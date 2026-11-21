#!/usr/bin/env bash
set -euo pipefail

DIR="${1:?usage: record.sh /demos/<name>}"
shift
SCRIPT="$DIR/script.mjs"
[ -f "$SCRIPT" ] || { echo "demo script not found: $SCRIPT" >&2; exit 1; }

# Record to hidden partial files so a failed run never replaces the last good video.
PARTIAL_VIDEO="$DIR/.video.partial.mp4"
export EVENTS_OUT="$DIR/.events.partial.json"
export FAILED_OUT="$DIR/failed"
rm -f "$PARTIAL_VIDEO" "$EVENTS_OUT" "$FAILED_OUT.png" "$FAILED_OUT.json"

# The container runs as the host uid, which has no home in the image.
export HOME=/tmp/home
PANEL_XML="$HOME/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-panel.xml"
mkdir -p "$(dirname "$PANEL_XML")"
# Seeding the panel config skips its "first start" dialog.
cp /etc/xdg/xfce4/panel/default.xml "$PANEL_XML"

# The demo script and lib run from /tmp/run so `import './lib.mjs'` and `playwright` resolve.
RUN_DIR=/tmp/run
mkdir -p "$RUN_DIR"
ln -sfn /app/node_modules "$RUN_DIR/node_modules"
cp /app/lib.mjs /app/config.mjs "$RUN_DIR/"
cp "$SCRIPT" "$RUN_DIR/script.mjs"
# One project-wide config for every demo: .demos/demo.config.mjs.
rm -f "$RUN_DIR/demo.config.mjs"
PROJECT_CONFIG="$(dirname "$DIR")/demo.config.mjs"
if [ -f "$PROJECT_CONFIG" ]; then cp "$PROJECT_CONFIG" "$RUN_DIR/demo.config.mjs"; fi

# Defaults merged with demo.config.mjs; an invalid config stops here.
if ! CONFIG_ENV="$(node "$RUN_DIR/config.mjs" env "$RUN_DIR/demo.config.mjs" 2>&1)"; then
  printf '{"error": %s, "stack": null, "events": []}\n' "$(printf '%s' "$CONFIG_ENV" | node -e 'process.stdout.write(JSON.stringify(require("fs").readFileSync(0, "utf8")))')" > "$FAILED_OUT.json"
  echo "INVALID CONFIG: $CONFIG_ENV" >&2
  exit 1
fi
eval "$CONFIG_ENV"

# Docker Desktop (macOS) has no host networking: forward the container's localhost to
# the host so the browser still loads localhost, which dev servers' Host checks expect.
SOCAT_PID=
if [ -n "${APP_LOOPBACK_HOST:-}" ]; then
  APP_PORT="$(node -e 'const u = new URL(process.env.APP_URL); if (["localhost", "127.0.0.1"].includes(u.hostname)) process.stdout.write(u.port || (u.protocol === "https:" ? "443" : "80"))')"
  if [ -n "$APP_PORT" ]; then
    socat "TCP-LISTEN:$APP_PORT,fork,reuseaddr,bind=127.0.0.1" "TCP:$APP_LOOPBACK_HOST:$APP_PORT" 2>/dev/null &
    SOCAT_PID=$!
    trap 'kill "$SOCAT_PID" 2>/dev/null || true' EXIT
    for _ in $(seq 1 50); do
      (exec 3<>"/dev/tcp/127.0.0.1/$APP_PORT") 2>/dev/null && break
      sleep 0.1
    done
  fi
fi

# Any HTTP response counts; only a connection failure or timeout means the app is down.
if ! node -e 'fetch(process.env.APP_URL, { redirect: "manual", signal: AbortSignal.timeout(5000) }).catch(() => process.exit(1))'; then
  printf '{"error": %s, "stack": null, "events": []}\n' "$(node -e 'process.stdout.write(JSON.stringify(`app not reachable at ${process.env.APP_URL}`))')" > "$FAILED_OUT.json"
  echo "APP NOT REACHABLE: $APP_URL" >&2
  exit 1
fi

# The panel is GTK3; the theme variant comes from GTK_THEME.
if [ "$THEME" = dark ]; then PANEL_GTK_THEME=Adwaita:dark; else PANEL_GTK_THEME=Adwaita; fi

# The bottom dock (panel-2) auto-hides unless desktop.dockAutohide is false.
if [ "$DOCK_AUTOHIDE" = false ]; then
  sed -i '/<property name="panel-2"/,/<\/property>/ s#name="autohide-behavior" type="uint" value="[0-9]"#name="autohide-behavior" type="uint" value="0"#' "$PANEL_XML"
fi

# -nolisten local: with --network host (Linux) the abstract X socket would be shared with the host.
Xvfb "$DISPLAY" -screen 0 "${SCREEN_W}x${SCREEN_H}x24" -nolisten tcp -nolisten local >/dev/null 2>&1 &
XVFB_PID=$!
for _ in $(seq 1 50); do
  xdpyinfo -display "$DISPLAY" >/dev/null 2>&1 && break
  sleep 0.1
done

eval "$(dbus-launch --sh-syntax)"

xfwm4 --replace >/dev/null 2>&1 &
WM_PID=$!
sleep 1.5

# Without a wallpaper the root window is black and the video reads as a terminal, not a desktop.
feh --no-fehbg --bg-fill /app/wallpaper.jpg || true
xfsettingsd --daemon >/dev/null 2>&1 || true
GTK_THEME="$PANEL_GTK_THEME" xfce4-panel --disable-wm-check >/dev/null 2>&1 &
PANEL_PID=$!
sleep 2

# The demo script sets the scene off camera (browser, login, starting page) and calls
# record() from lib.mjs, which touches $RECORD_SIGNAL. Capture starts only then.
export RECORD_SIGNAL="$RUN_DIR/record"
rm -f "$RECORD_SIGNAL" "$RECORD_SIGNAL.started" "$RECORD_SIGNAL.stop" "$RECORD_SIGNAL.stopped"
FFMPEG_PID=
FFMPEG_STOPPED=0
FFMPEG_ERROR=

# Stops ffmpeg once and sets FFMPEG_ERROR if the take is unusable. Our SIGINT makes
# ffmpeg exit 255, so its status only matters if it was still running when we asked.
stop_ffmpeg() {
  { [ -n "$FFMPEG_PID" ] && [ "$FFMPEG_STOPPED" = 0 ]; } || return 0
  FFMPEG_STOPPED=1
  local alive=0 status=0
  if kill -0 "$FFMPEG_PID" 2>/dev/null; then
    alive=1
    # SIGINT, not SIGKILL, so ffmpeg writes the mp4 index.
    kill -INT "$FFMPEG_PID" 2>/dev/null || true
  fi
  wait "$FFMPEG_PID" 2>/dev/null || status=$?
  if [ "$alive" = 0 ]; then
    FFMPEG_ERROR="ffmpeg exited with status $status before the recording was stopped"
  elif [ "$status" -ne 0 ] && [ "$status" -ne 255 ]; then
    FFMPEG_ERROR="ffmpeg exited with status $status"
  elif [ ! -s "$PARTIAL_VIDEO" ]; then
    FFMPEG_ERROR="ffmpeg wrote no video"
  fi
}

CLEANED=0
cleanup() {
  [ "$CLEANED" = 1 ] && return
  CLEANED=1
  stop_ffmpeg
  kill "$PANEL_PID" "$WM_PID" "$XVFB_PID" $SOCAT_PID 2>/dev/null || true
}
trap cleanup EXIT

node "$RUN_DIR/script.mjs" "$@" &
NODE_PID=$!

while kill -0 "$NODE_PID" 2>/dev/null && [ ! -f "$RECORD_SIGNAL" ]; do
  sleep 0.05
done

if [ -f "$RECORD_SIGNAL" ]; then
  ffmpeg -y -loglevel error \
    -f x11grab -draw_mouse 1 -framerate "$FPS" \
    -video_size "${SCREEN_W}x${SCREEN_H}" -i "$DISPLAY" \
    -c:v libx264 -preset "$VIDEO_PRESET" -crf "$VIDEO_CRF" -pix_fmt yuv420p \
    -movflags +faststart \
    "$PARTIAL_VIDEO" &
  FFMPEG_PID=$!
  date +%s%3N > "$RECORD_SIGNAL.tmp"
  mv "$RECORD_SIGNAL.tmp" "$RECORD_SIGNAL.started"

  # finish() in lib.mjs asks for the stop while the browser is still on screen;
  # stopping after node exits would capture an empty desktop.
  while kill -0 "$NODE_PID" 2>/dev/null && [ ! -f "$RECORD_SIGNAL.stop" ]; do
    sleep 0.05
  done
  if [ -f "$RECORD_SIGNAL.stop" ]; then
    stop_ffmpeg
    touch "$RECORD_SIGNAL.stopped"
  fi
fi

set +e
wait "$NODE_PID"
STATUS=$?
set -e
stop_ffmpeg

if [ "$STATUS" -eq 0 ] && [ -z "$FFMPEG_PID" ]; then
  printf '{"error": "demo script finished without calling record()", "stack": null, "events": []}\n' > "$FAILED_OUT.json"
  STATUS=1
elif [ "$STATUS" -eq 0 ] && [ -n "$FFMPEG_ERROR" ]; then
  printf '{"error": "%s", "stack": null, "events": []}\n' "$FFMPEG_ERROR" > "$FAILED_OUT.json"
  STATUS=1
fi

if [ "$STATUS" -ne 0 ]; then
  [ -f "$FAILED_OUT.png" ] || ffmpeg -loglevel error -y -f x11grab -video_size "${SCREEN_W}x${SCREEN_H}" \
    -i "$DISPLAY" -frames:v 1 "$FAILED_OUT.png" || true
  [ -f "$FAILED_OUT.json" ] || printf '{"error": "demo script exited with status %s", "stack": null, "events": []}\n' \
    "$STATUS" > "$FAILED_OUT.json"
  cleanup
  rm -f "$PARTIAL_VIDEO" "$EVENTS_OUT"
  echo "RECORDING FAILED (exit $STATUS), previous video.mp4 left untouched." >&2
  echo "error:      $FAILED_OUT.json" >&2
  echo "screenshot: $FAILED_OUT.png" >&2
  exit "$STATUS"
fi

cleanup
mv -f "$PARTIAL_VIDEO" "$DIR/video.mp4"
mv -f "$EVENTS_OUT" "$DIR/events.json"
echo "video:  $DIR/video.mp4"
echo "events: $DIR/events.json"
