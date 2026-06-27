import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '../public')
const logoSvg = readFileSync(join(publicDir, 'tlc-logo-dark.svg'), 'utf8')
const logoMatch = logoSvg.match(/<svg[\s\S]*<\/svg>/)
const logoInner = logoMatch?.[0]?.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '') ?? ''

const phases = [
  { label: 'SPECIFY', color: '#2563EB' },
  { label: 'DESIGN', color: '#8B5CF6' },
  { label: 'TASKS', color: '#F59E0B' },
  { label: 'EXECUTE', color: '#10B981' },
]

const features = [
  'Atomic tasks',
  'Independent validation',
  'Requirement traceability',
  'Persistent state',
]

const benchmarkItems = [
  '4 Adaptive Phases',
  'Production Ready',
  'Independent Validation',
  'Requirement Traceability',
]

const CONTENT_X = 120
const BADGE_Y = 118
const BADGE_H = 36
const BADGE_CY = BADGE_Y + BADGE_H / 2
const BADGE_LABEL = 'SPEC-DRIVEN DEVELOPMENT'
const BADGE_FONT_SIZE = 16
const BADGE_PAD_X = 26
const BADGE_DOT_R = 4
const BADGE_DOT_GAP = 12
const BADGE_TEXT_W = Math.ceil(BADGE_LABEL.length * 12.2 + BADGE_FONT_SIZE * 0.8) + 40
const BADGE_W = BADGE_PAD_X * 2 + BADGE_DOT_R * 2 + BADGE_DOT_GAP + BADGE_TEXT_W
const BADGE_DOT_CX = CONTENT_X + BADGE_PAD_X + BADGE_DOT_R
const BADGE_TEXT_X = BADGE_DOT_CX + BADGE_DOT_R + BADGE_DOT_GAP

const PHASE_Y = 352
const PHASE_H = 28
const PHASE_CY = PHASE_Y + PHASE_H / 2
const PHASE_GAP = 28
const PHASE_PILL_W = 104

const ADAPTIVE_Y = 430
const FEATURES_Y = 474

const phaseFlow = phases
  .map((phase, i) => {
    const x = CONTENT_X + i * (PHASE_PILL_W + PHASE_GAP)
    return `<rect x="${x}" y="${PHASE_Y}" width="${PHASE_PILL_W}" height="${PHASE_H}" rx="14" fill="${phase.color}" fill-opacity="0.18" stroke="${phase.color}" stroke-opacity="0.55"/>
      <circle cx="${x + 14}" cy="${PHASE_CY}" r="4" fill="${phase.color}"/>
      <text x="${x + 24}" y="${PHASE_CY}" dominant-baseline="middle" fill="#E2E8F0" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="11" font-weight="700" letter-spacing="0.06em">${phase.label}</text>`
  })
  .join('\n')

const phaseArrows = phases
  .slice(0, -1)
  .map((_, i) => {
    const pillEnd = CONTENT_X + i * (PHASE_PILL_W + PHASE_GAP) + PHASE_PILL_W
    const x1 = pillEnd + 3
    const x2 = pillEnd + PHASE_GAP - 3
    return `<path d="M${x1} ${PHASE_CY} L${x2} ${PHASE_CY}" stroke="#475569" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M${x2 - 4} ${PHASE_CY - 4} L${x2} ${PHASE_CY} L${x2 - 4} ${PHASE_CY + 4}" stroke="#475569" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
  })
  .join('\n')

const featureChecks = features
  .map((feature, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = CONTENT_X + col * 290
    const y = FEATURES_Y + row * 34
    return `<g transform="translate(${x}, ${y})">
      <circle cx="8" cy="8" r="8" fill="#10B981" fill-opacity="0.15"/>
      <path d="M4 8 L7 11 L13 5" stroke="#34D399" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <text x="24" y="12" fill="#94A3B8" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="17" font-weight="500">${feature}</text>
    </g>`
  })
  .join('\n')

const benchmarkList = benchmarkItems
  .map((item, i) => {
    const y = 338 + i * 30
    return `<g transform="translate(804, ${y})">
      <path d="M0 6 L3 9 L9 3" stroke="#60A5FA" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <text x="18" y="11" fill="#E2E8F0" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="16" font-weight="600">${item}</text>
    </g>`
  })
  .join('\n')

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0B1220"/>
      <stop offset="0.45" stop-color="#111827"/>
      <stop offset="1" stop-color="#1E1B4B"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop stop-color="#2563EB"/>
      <stop offset="1" stop-color="#10B981"/>
    </linearGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" stroke="#334155" stroke-opacity="0.22" stroke-width="0.75"/>
    </pattern>
    <clipPath id="tlc-icon">
      <rect x="0" y="0" width="182" height="202"/>
    </clipPath>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#grid)" opacity="0.35"/>

  <g opacity="0.07" stroke="#64748B" stroke-width="1">
    <path d="M80 520 C260 420, 420 500, 560 390"/>
    <path d="M640 390 C780 280, 920 360, 1120 260"/>
    <path d="M120 120 L120 520"/>
    <path d="M1080 120 L1080 520"/>
  </g>

  <rect x="80" y="80" width="1040" height="470" rx="28" stroke="#334155" stroke-opacity="0.55" stroke-width="1.5"/>

  <g transform="translate(1040, ${BADGE_CY - 19}) scale(0.19)" clip-path="url(#tlc-icon)">
    ${logoInner}
  </g>

  <rect x="${CONTENT_X}" y="${BADGE_Y}" width="${BADGE_W}" height="${BADGE_H}" rx="${BADGE_H / 2}" fill="#1D4ED8" fill-opacity="0.18" stroke="#3B82F6" stroke-opacity="0.35"/>
  <circle cx="${BADGE_DOT_CX}" cy="${BADGE_CY}" r="${BADGE_DOT_R}" fill="#10B981"/>
  <text x="${BADGE_TEXT_X}" y="${BADGE_CY}" dominant-baseline="middle" fill="#93C5FD" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="${BADGE_FONT_SIZE}" font-weight="600" letter-spacing="0.04em">${BADGE_LABEL}</text>

  <text x="${CONTENT_X}" y="210" fill="#F8FAFC" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="54" font-weight="800" letter-spacing="-0.03em">TLC Spec-Driven</text>
  <text x="${CONTENT_X}" y="258" fill="#CBD5E1" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="26" font-weight="500">AI agents that ship right, every time</text>
  <rect x="${CONTENT_X}" y="278" width="420" height="3" rx="1.5" fill="url(#accent)"/>

  ${phaseFlow}
  ${phaseArrows}

  <text x="${CONTENT_X}" y="${ADAPTIVE_Y}" fill="#64748B" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="15" font-weight="600" letter-spacing="0.06em">ADAPTIVE BY COMPLEXITY</text>

  ${featureChecks}

  <rect x="780" y="290" width="300" height="198" rx="16" fill="#0F172A" fill-opacity="0.72" stroke="#334155" stroke-opacity="0.8"/>
  <text x="804" y="322" fill="#94A3B8" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="13" font-weight="700" letter-spacing="0.1em">BENCHMARK</text>
  ${benchmarkList}
</svg>`

const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
})
const pngData = resvg.render().asPng()
writeFileSync(join(publicDir, 'og-tlc-spec-driven.png'), pngData)
console.log('Wrote packages/marketplace/public/og-tlc-spec-driven.png')
