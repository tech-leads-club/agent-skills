// Resolves a demo's settings: strong defaults, overridden by an optional
// project-wide .demos/demo.config.mjs. Unknown keys and invalid values fail the run.
import { existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const PACES = {
  // Tuned for short product videos: readable, no dead air.
  normal: {
    move: 550,
    hover: 350,
    hesitate: [80, 200],
    afterClick: 250,
    typeDelay: 30,
    afterType: 200,
    wheelStep: [50, 90],
    lead: 1000,
    hold: 2000,
  },
  // Walkthroughs where the viewer needs time to follow each step.
  slow: {
    move: 700,
    hover: 600,
    hesitate: [150, 350],
    afterClick: 400,
    typeDelay: 60,
    afterType: 300,
    wheelStep: [60, 120],
    lead: 1000,
    hold: 2500,
  },
}

const THEMES = ['system', 'light', 'dark']
const PRESETS = ['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow']

export const DEFAULTS = {
  app: { url: `http://localhost:${process.env.PORT || 3000}` },
  pace: 'normal',
  theme: 'system',
  browser: { locale: 'en-US', window: { width: 0.95, height: 0.85 } },
  desktop: { dockAutohide: false },
  timeouts: { action: 5000, navigation: 15000 },
  video: { width: 1440, height: 900, fps: 30, crf: 20, preset: 'veryfast' },
}

function merge(defaults, overrides, path) {
  if (overrides === undefined) return defaults
  if (typeof overrides !== 'object' || overrides === null || Array.isArray(overrides)) {
    throw new Error(`demo.config.mjs: ${path} must be an object`)
  }
  for (const key of Object.keys(overrides)) {
    if (!(key in defaults)) throw new Error(`demo.config.mjs: unknown key ${path ? `${path}.` : ''}${key}`)
  }
  const out = { ...defaults }
  for (const [key, value] of Object.entries(overrides)) {
    const base = defaults[key]
    const at = path ? `${path}.${key}` : key
    if (typeof base === 'object' && base !== null && !Array.isArray(base)) {
      out[key] = merge(base, value, at)
    } else {
      if (Array.isArray(base) ? !Array.isArray(value) : typeof value !== typeof base) {
        throw new Error(`demo.config.mjs: ${at} must be ${Array.isArray(base) ? 'an array' : `a ${typeof base}`}`)
      }
      out[key] = value
    }
  }
  return out
}

function oneOf(value, allowed, path) {
  if (!allowed.includes(value)) throw new Error(`demo.config.mjs: ${path} must be one of ${allowed.join(', ')}`)
}

const nonNegative = (v) => Number.isFinite(v) && v >= 0
const positiveInteger = [(v) => Number.isInteger(v) && v > 0, 'a positive integer']
const positive = [(v) => Number.isFinite(v) && v > 0, 'a positive number']
// Value checks on top of the type checks in merge().
const RULES = {
  'video.width': positiveInteger,
  'video.height': positiveInteger,
  'video.fps': positiveInteger,
  'video.crf': [(v) => Number.isInteger(v) && v >= 0 && v <= 51, 'an integer in 0..51'],
  'timeouts.action': positive,
  'timeouts.navigation': positive,
}

function check(config) {
  for (const [path, [valid, expected]] of Object.entries(RULES)) {
    const value = path.split('.').reduce((obj, key) => obj[key], config)
    if (!valid(value)) throw new Error(`demo.config.mjs: ${path} must be ${expected}`)
  }
  for (const [key, value] of Object.entries(config.pace)) {
    if (Array.isArray(value)) {
      if (!(value.length === 2 && value.every(nonNegative) && value[0] <= value[1])) {
        throw new Error(`demo.config.mjs: pace.${key} must be [min, max] of non-negative numbers with min <= max`)
      }
    } else if (!nonNegative(value)) {
      throw new Error(`demo.config.mjs: pace.${key} must be a non-negative number`)
    }
  }
}

// `pace` is a preset name, or { preset, ...overrides } to tweak single values.
function resolvePace(pace) {
  if (typeof pace === 'string') {
    oneOf(pace, Object.keys(PACES), 'pace')
    return PACES[pace]
  }
  if (typeof pace !== 'object' || pace === null || Array.isArray(pace)) {
    throw new Error('demo.config.mjs: pace must be a preset name or an object')
  }
  const { preset = DEFAULTS.pace, ...overrides } = pace
  oneOf(preset, Object.keys(PACES), 'pace.preset')
  return merge(PACES[preset], overrides, 'pace')
}

export function resolveConfig(raw = {}) {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('demo.config.mjs: the default export must be an object')
  }
  const { pace, ...rest } = raw
  const { pace: _, ...base } = DEFAULTS
  const config = merge(base, rest, '')
  config.pace = resolvePace(pace === undefined ? DEFAULTS.pace : pace)
  oneOf(config.theme, THEMES, 'theme')
  // `system` follows the host's GNOME color-scheme or macOS appearance, passed in by scripts/record.
  if (config.theme === 'system') config.theme = process.env.HOST_THEME === 'dark' ? 'dark' : 'light'
  oneOf(config.video.preset, PRESETS, 'video.preset')
  check(config)
  for (const [key, value] of Object.entries(config.browser.window)) {
    if (!(value > 0 && value <= 1)) throw new Error(`demo.config.mjs: browser.window.${key} must be a number in (0, 1]`)
  }
  if (!URL.canParse(config.app.url) || !/^https?:$/.test(new URL(config.app.url).protocol)) {
    throw new Error('demo.config.mjs: app.url must be an http(s) URL')
  }
  return config
}

export async function loadConfig(file) {
  if (!file || !existsSync(file)) return resolveConfig()
  const mod = await import(pathToFileURL(resolve(file)).href)
  return resolveConfig(mod.default)
}

// The file `scripts/config` writes: every default, documented in place.
export function template() {
  const d = DEFAULTS
  const n = PACES.normal
  const s = PACES.slow
  const list = (a) => `[${a.join(', ')}]`
  return `// Settings for every demo in this project. Every key is optional; delete
// what you don't change and the skill default applies. Unknown keys, wrong
// types or out-of-range values fail the run.
export default {
  app: {
    // Where the app under demo is served. Unset, it is http://localhost:$PORT,
    // with PORT from the environment or the project .env, else 3000. localhost
    // is the host's localhost: the recorder shares the host network on Linux
    // and forwards to host.docker.internal on macOS.
    // url: 'http://localhost:3000'
  },

  // Timing of the helpers. A preset name, or an object that starts from a
  // preset and overrides single values, e.g. { preset: 'normal', typeDelay: 20 }.
  //   normal: short product videos. slow: step-by-step walkthroughs.
  // Keys (ms):
  //   move        pointer travel to a target          normal ${n.move}, slow ${s.move}
  //   hover       pause on a target in hover()        normal ${n.hover}, slow ${s.hover}
  //   hesitate    [min, max] pause before a click     normal ${list(n.hesitate)}, slow ${list(s.hesitate)}
  //   afterClick  pause after a click                 normal ${n.afterClick}, slow ${s.afterClick}
  //   typeDelay   delay per key in type()             normal ${n.typeDelay}, slow ${s.typeDelay}
  //   afterType   pause after typing                  normal ${n.afterType}, slow ${s.afterType}
  //   wheelStep   [min, max] delay per wheel() step   normal ${list(n.wheelStep)}, slow ${list(s.wheelStep)}
  //   lead        still frames after record()         normal ${n.lead}, slow ${s.lead}
  //   hold        still frames in finish()            normal ${n.hold}, slow ${s.hold}
  pace: '${d.pace}',

  // 'system', 'light' or 'dark'. Drives the XFCE panels, the
  // Chromium UI and prefers-color-scheme in the page. 'system' follows the
  // host's GNOME color-scheme or macOS appearance (dark is dark, anything else light).
  theme: '${d.theme}',

  browser: {
    // Chromium UI language and Accept-Language sent to the app.
    locale: '${d.browser.locale}',
    // Share of the screen, centered: wide enough for desktop breakpoints, clear of the dock.
    window: { width: ${d.browser.window.width}, height: ${d.browser.window.height} }
  },

  desktop: {
    // true hides the bottom dock until the pointer reaches it; false keeps it on screen.
    dockAutohide: ${d.desktop.dockAutohide}
  },

  timeouts: {
    // A missing element fails the run after this long instead of recording dead air.
    action: ${d.timeouts.action},
    // Page loads and URL waits.
    navigation: ${d.timeouts.navigation}
  },

  video: {
    width: ${d.video.width},
    height: ${d.video.height},
    fps: ${d.video.fps},
    // x264 quality: lower is sharper and bigger (18-28 is sane).
    crf: ${d.video.crf},
    // x264 speed: ${PRESETS.join(', ')}.
    preset: '${d.video.preset}'
  }
}
`
}

// CLI:
//   node config.mjs env <file>   shell assignments for record.sh
//   node config.mjs init <file>  write the documented defaults (never overwrites)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [command, file] = process.argv.slice(2)
  try {
    if (command === 'env') {
      const { app, video, theme, desktop } = await loadConfig(file)
      const env = {
        APP_URL: app.url,
        SCREEN_W: video.width,
        SCREEN_H: video.height,
        FPS: video.fps,
        VIDEO_CRF: video.crf,
        VIDEO_PRESET: video.preset,
        THEME: theme,
        DOCK_AUTOHIDE: desktop.dockAutohide,
      }
      for (const [key, value] of Object.entries(env))
        console.log(`export ${key}='${String(value).replaceAll("'", "'\\''")}'`)
    } else if (command === 'init') {
      if (!file) throw new Error('usage: config.mjs init <file>')
      if (existsSync(file)) throw new Error(`${file} already exists`)
      writeFileSync(file, template())
      await loadConfig(file)
      console.log(file)
    } else {
      throw new Error('usage: config.mjs env|init <file>')
    }
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}
