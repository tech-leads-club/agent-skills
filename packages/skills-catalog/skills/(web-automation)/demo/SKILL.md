---
name: demo
description: Record a demo video of a web app feature or flow on a real desktop (Docker, Xvfb, XFCE, real X cursor), producing an mp4 plus a click/hover/scroll/type telemetry file. Takes a flow description, an existing demo name or path, or init. Use when the user says "record a demo of the checkout", "gravar um demo dessa feature", "make a screencast of this flow", "video for the changelog", "re-record the checkout demo", "refresh the demo video", or "demo init". Do NOT use for general browser testing or automation that needs no video (use playwright-skill), page debugging or network inspection (use chrome-devtools), or static screenshots.
metadata:
  author: github.com/wcalderipe
  version: '1.0.0'
---

**IMPORTANT - Path Resolution:**
This skill can be installed in different locations (plugin system, manual installation, global, or project-specific). Before executing any commands, determine the skill directory based on where you loaded this SKILL.md file, and use that path in all commands below. Replace `$SKILL_DIR` with the actual discovered path.

# Demo

Records a scripted flow of the local app as `video.mp4` (1440x900, 30fps, full X display with XFCE panel, Chromium window, and system cursor) plus `events.json`.

## Input forms

The first word decides the form: `init` is a command; anything else is a demo name, path, or flow description.

1. **Flow description**, for example `/demo record the checkout paying by card logged in as a customer`. Pick a name, write `.demos/<name>/script.mjs`, record.
2. **Existing demo**, for example `/demo checkout-card-as-customer`, `/demo .demos/checkout-card-as-customer`, or `/demo .demos/checkout-card-as-customer/script.mjs`. Skip authoring and re-record as-is. If it fails loudly (the UI changed), fix the demo script, retry, and tell the user what changed in it.
3. **`init`**, i.e. `/demo init`: follow `references/init.md`.

## Layout

One directory per demo, fixed file names, plus one optional config for all demos:

```
.demos/demo.config.mjs     settings for every demo (see Config)
.demos/checkout-card-as-customer/
  script.mjs     demo script
  video.mp4      last good recording
  events.json    telemetry of that recording
  failed.png     only after a failed run that reached the desktop
  failed.json    only after a failed run
```

A successful run replaces `video.mp4` and `events.json` and removes `failed.*`. A failed run leaves the previous good video untouched. `.demos/` is gitignored.

Names are descriptive kebab-case slugs of the specific flow, not the area: `<area>-<flow>[-<variant>]`, e.g. `checkout-card-as-customer`, `checkout-coupon-applied`, `admin-user-invite`. Before creating one, `ls .demos/` and reuse the existing name for the same flow instead of adding a near-duplicate.

## Workflow

1. For form 1, read the views/routes of the flow to pick stable locators, and work out how to sign in (and with which test account) from the project's code and docs (AGENTS.md, README; `/demo init` sets that up). Then write the demo script (template below).
2. Record: `$SKILL_DIR/scripts/record <name>`. The first run builds the Docker image (tag hashed from the assets, so edits rebuild automatically). Before launching the browser the recorder checks that `app.url` (unset, `http://localhost:$PORT` from the environment or `.env`, else 3000) answers; if `failed.json` says `app not reachable at <url>`, start the app the way the project's AGENTS.md or README says, re-run, and stop what you started when done. If the app runs elsewhere, set `app.url` in the config.
3. Verify: extract 3-4 frames around the events and look at them. The `t` in `events.json` is seconds into the video.
   ```bash
   ffmpeg -loglevel error -y -ss 6.5 -i .demos/<name>/video.mp4 -frames:v 1 /tmp/frame.png
   ```
4. Report the `video.mp4` and `events.json` paths.

## Script

Runs inside the container next to `lib.mjs`, so always import `./lib.mjs`.

Framing rules:

- Capture starts only when the demo script calls `record()`. Set the scene before it: browser open, logged in, starting page loaded. The video never shows the browser launching or an empty desktop.
- Never show the sign-in unless the user asks for it. Do it with plain Playwright before `record()`, not the animated helpers. Start on the page where the user's intent begins (e.g. `/admin/users` for "invite a user"), not on the home page.

Pacing: timings come from the `pace` config, so call helpers without timing arguments. Don't `hover` right before `humanClick` on the same target (the click already approaches it). Keep extra `sleep`s short: 300-500ms between steps, ~400ms after a new page loads.

```js
import { launch, record, hover, humanClick, type, wheel, sleep, finish, APP_URL } from './lib.mjs'

const { page } = await launch()
await page.goto(`${APP_URL}/<sign-in-path>`, { waitUntil: 'networkidle' })
await page.getByLabel('<email-label>').fill('<test-account-email>')
await page.getByLabel('<password-label>').fill('<test-account-password>')
await Promise.all([
  page.waitForURL((url) => !url.pathname.startsWith('/<sign-in-path>')),
  page.getByRole('button', { name: '<submit-label>' }).click(),
])
await page.goto(`${APP_URL}/cart`, { waitUntil: 'networkidle' })
await record()

await hover(page, page.getByRole('link', { name: /Order summary/ }).last())
await humanClick(page, page.getByRole('link', { name: 'Checkout' }).first())
await wheel(page, 400)
await type(page, page.getByLabel('Coupon'), 'SAVE10')

await finish()
```

`lib.mjs` API: `launch()`, `record({ lead })` (starts capture and the event clock; required, a demo script that never calls it fails), `hover`, `humanClick`, `type` (click then key by key), `wheel(page, pixels)`, `moveTo(x, y, ms)` in screen coordinates, `settle(page)`, `mark(type, box)` for custom telemetry, `sleep`, `finish(ms)`.

Test accounts are project-specific: take them from the project's docs (AGENTS.md, README) or seed data, never guess.

## Config

`.demos/demo.config.mjs` is optional and applies to every demo. Leave it out unless the user wants something different: the defaults are the house style. Keys are deep-merged over the defaults; unknown keys, wrong types, or out-of-range values fail the run before recording.

Create it with every default documented in place with `/demo init` (`$SKILL_DIR/scripts/config`), then edit or delete lines. It never overwrites an existing file. The file's comments are the reference for each key; defaults and pace presets live in `$SKILL_DIR/assets/config.mjs`. The top-level keys are `app.url` (where the app is served; unset, `http://localhost:$PORT` from the environment or `.env`, else 3000; localhost is the host's localhost: shared host network on Linux, forwarded to `host.docker.internal` on macOS), `pace` (`normal` or `slow`, or single timing overrides), `theme` (`system` follows GNOME or macOS appearance, `light`, `dark`), `browser.locale`, `browser.window` (width and height as screen fractions, window centered), `desktop.dockAutohide`, `timeouts`, and `video`.

## Gotchas

- Scope locators: `button.btn-cta` can match a header copy first (off-screen, negative `y`). Prefer `getByRole` with a name, and `.first()`/`.last()` deliberately.
- Measure right before acting. The helpers scroll into view, wait for scroll to settle, and re-measure before clicking; custom `moveTo` code must do the same.
- Scroll only with `wheel()`. Never `xdotool click 4/5`: an event escaping the window switches the xfwm4 workspace and blacks out the rest of the video.
- End with `finish()`, never `browser.close()`, or the last seconds show an empty desktop.
- Form submits that navigate: wrap the click in `Promise.all` with `page.waitForURL(...)`, then wait for the result (toast, row) before `finish()`.
- The cursor is the real X pointer, so `<dialog>` top layer and `(hover: hover)` CSS just work.
- Native Chrome bubbles (translate, save password, "Change your password" leak warning after login, autofill suggestions under inputs) are disabled via profile prefs in `launch()`. If a new one shows up in `failed.png`, add its pref there.

## Failures

Any error (missing locator, timeout) fails fast (5s action timeout) and the run exits non-zero with no new video. Read `.demos/<name>/failed.json` (error, stack, page URL, `t`, events so far), look at `failed.png` (the display at failure time; not written when the config is invalid or the app is unreachable, since those fail before the display starts), fix the demo script, and re-run. Never hand over a video from a failed run.

## events.json

```json
{
  "video": "video.mp4",
  "fps": 30,
  "width": 1440,
  "height": 900,
  "events": [{ "t": 6.504, "type": "click", "rect": { "x": 12, "y": 346, "w": 195, "h": 36 } }]
}
```

`type` is `hover`, `click`, `type`, or `scroll`. `rect` is in screen (video) pixels, measured when the pointer starts moving toward the target, so `t` leads the visible action by about 0.7s. `scroll` has `rect: null`.
