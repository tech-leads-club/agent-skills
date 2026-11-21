# The tag must match the playwright version in package.json.
FROM mcr.microsoft.com/playwright:v1.62.1-noble

RUN apt-get update && apt-get install -y --no-install-recommends \
      xvfb x11-utils xdotool ffmpeg dbus-x11 procps socat \
      xfwm4 xfce4-panel xfce4-settings feh papirus-icon-theme fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

ENV DISPLAY=:99 \
    SCREEN_W=1440 \
    SCREEN_H=900 \
    FPS=30 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

WORKDIR /app
COPY docker/package.json ./
RUN npm install --omit=dev && chmod -R a+rX /app
COPY docker/record.sh docker/wallpaper.jpg lib.mjs config.mjs ./
RUN chmod a+rx record.sh && chmod a+r wallpaper.jpg lib.mjs config.mjs

ENTRYPOINT ["/app/record.sh"]
