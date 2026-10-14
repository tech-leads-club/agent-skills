// Runs only inside the recorder Docker container, next to the demo script (record.sh copies both into /tmp/run).
// Relies on the container's DISPLAY and the RECORD_SIGNAL, EVENTS_OUT and FAILED_OUT env vars.
import { execFile, execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { promisify } from 'node:util'
import { chromium } from 'playwright'
import { loadConfig } from './config.mjs'

const exec = promisify(execFile)
const xdo = (...args) => exec('xdotool', args.map(String))

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const config = await loadConfig(new URL('./demo.config.mjs', import.meta.url).pathname)
export const APP_URL = config.app.url
const PACE = config.pace
const W = config.video.width
const H = config.video.height
const FPS = config.video.fps
const WINDOW_W = Math.round(W * config.browser.window.width)
const WINDOW_H = Math.round(H * config.browser.window.height)
const between = ([min, max]) => min + Math.random() * (max - min)
const RECORD_SIGNAL = process.env.RECORD_SIGNAL
let T0 = Date.now()
const EVENTS_OUT = process.env.EVENTS_OUT
const FAILED_OUT = process.env.FAILED_OUT

const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

const arcControl = (from, to, bend) => {
  const dx = to.x - from.x
  const dy = to.y - from.y
  return { x: from.x + dx / 2 - dy * bend, y: from.y + dy / 2 + dx * bend }
}

const quadraticBezier = (from, control, to, t) => {
  const u = 1 - t
  return {
    x: u * u * from.x + 2 * u * t * control.x + t * t * to.x,
    y: u * u * from.y + 2 * u * t * control.y + t * t * to.y,
  }
}

let pos = { x: Math.round(W / 2), y: Math.round(H / 2) }
// Screen position of the viewport's top-left corner.
let offset = { x: 0, y: 0 }
const events = []
let failed = false
let current = null

const toScreen = (box) =>
  box && {
    x: Math.round(offset.x + box.x),
    y: Math.round(offset.y + box.y),
    w: Math.round(box.width),
    h: Math.round(box.height),
  }

export function mark(type, box = null) {
  events.push({ t: Number(((Date.now() - T0) / 1000).toFixed(3)), type, rect: toScreen(box) })
}

function flush() {
  if (!EVENTS_OUT || failed) return
  writeFileSync(EVENTS_OUT, JSON.stringify({ video: 'video.mp4', fps: FPS, width: W, height: H, events }, null, 2))
}
process.on('exit', flush)

// A broken demo script must not leave a plausible-looking video behind: grab the
// display, record the error, and exit non-zero so record.sh discards the mp4.
function fail(error) {
  if (failed) return
  failed = true
  console.error(error)
  if (FAILED_OUT) {
    try {
      execFileSync('ffmpeg', [
        '-loglevel',
        'error',
        '-y',
        '-f',
        'x11grab',
        '-video_size',
        `${W}x${H}`,
        '-i',
        process.env.DISPLAY,
        '-frames:v',
        '1',
        `${FAILED_OUT}.png`,
      ])
    } catch {}
    let url = null
    try {
      url = current?.url() ?? null
    } catch {}
    writeFileSync(
      `${FAILED_OUT}.json`,
      JSON.stringify(
        {
          error: String(error?.message ?? error),
          stack: error?.stack ?? null,
          url,
          t: Number(((Date.now() - T0) / 1000).toFixed(3)),
          events,
        },
        null,
        2,
      ),
    )
  }
  process.exit(1)
}
process.on('uncaughtException', fail)
process.on('unhandledRejection', fail)

export async function launch() {
  const profile = '/tmp/chrome-profile'
  mkdirSync(`${profile}/Default`, { recursive: true })
  // Native Chrome bubbles ignore command-line flags; only profile prefs turn them off.
  writeFileSync(
    `${profile}/Default/Preferences`,
    JSON.stringify({
      translate: { enabled: false },
      autofill: { enabled: false, profile_enabled: false, credit_card_enabled: false },
      credentials_enable_service: false,
      profile: { password_manager_enabled: false, password_manager_leak_detection: false },
    }),
  )

  const context = await chromium.launchPersistentContext(profile, {
    headless: false,
    viewport: null,
    locale: config.browser.locale,
    colorScheme: config.theme,
    args: [
      `--window-size=${WINDOW_W},${WINDOW_H}`,
      `--window-position=${Math.round((W - WINDOW_W) / 2)},${Math.round((H - WINDOW_H) / 2)}`,
      '--disable-infobars',
      // Hides the "unsupported command-line flag" infobar Playwright's --no-sandbox triggers.
      '--test-type',
      '--hide-crash-restore-bubble',
      '--no-first-run',
      '--no-default-browser-check',
      '--password-store=basic',
      '--disable-features=PasswordLeakDetection,PasswordManagerLeakDetection',
      `--lang=${config.browser.locale}`,
      ...(config.theme === 'dark' ? ['--force-dark-mode'] : []),
    ],
  })
  // Short timeouts so a missing element fails fast instead of recording dead air.
  context.setDefaultTimeout(config.timeouts.action)
  context.setDefaultNavigationTimeout(config.timeouts.navigation)
  const page = context.pages()[0] ?? (await context.newPage())
  current = page
  await calibrate(page)
  return { context, page }
}

// Maps DOM to screen coordinates by moving the real pointer and reading clientX/Y,
// which is exact regardless of panel, window frame, and browser toolbar sizes.
async function calibrate(page) {
  let last = 0
  for (let i = 0; i < 30; i++) {
    const width = await page.evaluate(() => window.outerWidth)
    if (width === last && width > W / 2) break
    last = width
    await sleep(100)
  }
  // A move that never reaches the page would await forever, so each attempt times out.
  for (let attempt = 1; attempt <= 5; attempt++) {
    await page.evaluate(() => {
      window.__pointer = new Promise((resolve) => {
        document.addEventListener('mousemove', (e) => resolve({ x: e.clientX, y: e.clientY }), { once: true })
        setTimeout(() => resolve(null), 1000)
      })
    })
    await xdo('mousemove', pos.x + attempt, pos.y + attempt)
    await xdo('mousemove', pos.x, pos.y)
    const client = await page.evaluate(() => window.__pointer)
    if (client) {
      offset = { x: pos.x - client.x, y: pos.y - client.y }
      return
    }
  }
  throw new Error('calibration failed: the X pointer never reached the page (no mousemove after 5 attempts)')
}

export async function moveTo(x, y, ms = PACE.move) {
  const frames = Math.max(2, Math.round(ms / 20))
  const from = { ...pos }
  const to = { x, y }
  const control = arcControl(from, to, between([-0.15, 0.15]))
  for (let i = 1; i <= frames; i++) {
    const p = quadraticBezier(from, control, to, ease(i / frames))
    await xdo('mousemove', Math.round(p.x), Math.round(p.y))
    await sleep(20)
  }
  pos = { x: Math.round(x), y: Math.round(y) }
}

export async function settle(page) {
  let last = -1
  let stable = 0
  for (let i = 0; i < 60 && stable < 3; i++) {
    const y = await page.evaluate(() => window.scrollY)
    stable = y === last ? stable + 1 : 0
    last = y
    await sleep(50)
  }
}

const randomAnchor = () => ({ x: between([0.4, 0.6]), y: between([0.4, 0.6]) })

const pointIn = (box, anchor) => ({
  x: Math.round(offset.x + box.x + box.width * anchor.x),
  y: Math.round(offset.y + box.y + box.height * anchor.y),
})

async function approach(page, locator, type, ms) {
  await locator.scrollIntoViewIfNeeded()
  await settle(page)
  const box = await locator.boundingBox()
  if (!box) throw new Error(`${type}: target has no bounding box`)
  mark(type, box)
  const anchor = randomAnchor()
  const p = pointIn(box, anchor)
  await moveTo(p.x, p.y, ms)
  return anchor
}

export async function hover(page, locator, { ms = PACE.move, hold = PACE.hover } = {}) {
  await approach(page, locator, 'hover', ms)
  await sleep(hold)
}

export async function humanClick(page, locator, { ms = PACE.move } = {}) {
  const anchor = await approach(page, locator, 'click', ms)
  await sleep(between(PACE.hesitate))
  // The layout may have shifted during the approach.
  const box = await locator.boundingBox()
  if (box) {
    const p = pointIn(box, anchor)
    if (Math.hypot(p.x - pos.x, p.y - pos.y) > 2) await moveTo(p.x, p.y, 150)
  }
  await xdo('click', 1)
  await sleep(PACE.afterClick)
}

export async function type(page, locator, text, { delay = PACE.typeDelay } = {}) {
  await humanClick(page, locator)
  mark('type', await locator.boundingBox())
  await page.keyboard.type(text, { delay })
  await sleep(PACE.afterType)
}

// Scroll through Playwright: `xdotool click 4/5` escaping the window switches the
// xfwm4 workspace and blacks out the rest of the video.
export async function wheel(page, total, { steps = 12 } = {}) {
  mark('scroll')
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, total / steps)
    await sleep(between(PACE.wheelStep))
  }
  await settle(page)
}

// Starts the capture. Everything before it (browser launch, sign-in, navigation to
// the starting page) stays off camera. `lead` holds the first frame still.
export async function record({ lead = PACE.lead } = {}) {
  if (RECORD_SIGNAL) {
    writeFileSync(RECORD_SIGNAL, '')
    const started = `${RECORD_SIGNAL}.started`
    for (let i = 0; i < 200 && !existsSync(started); i++) await sleep(25)
    if (!existsSync(started)) throw new Error('recorder did not start')
    T0 = Number(readFileSync(started, 'utf8').trim())
  } else {
    T0 = Date.now()
  }
  events.length = 0
  await sleep(lead)
}

// Closing the browser would leave an empty desktop at the end of the video.
// The recorder is stopped first, while the browser is still on screen.
export async function finish(ms = PACE.hold) {
  await sleep(ms)
  flush()
  if (RECORD_SIGNAL && existsSync(`${RECORD_SIGNAL}.started`)) {
    writeFileSync(`${RECORD_SIGNAL}.stop`, '')
    for (let i = 0; i < 400 && !existsSync(`${RECORD_SIGNAL}.stopped`); i++) await sleep(25)
  }
  process.exit(0)
}
