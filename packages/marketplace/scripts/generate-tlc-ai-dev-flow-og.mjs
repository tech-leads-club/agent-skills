import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '../public')
const logoSvg = readFileSync(join(publicDir, 'tlc-logo-dark.svg'), 'utf8')
const logoMatch = logoSvg.match(/<svg[\s\S]*<\/svg>/)
const logoInner = logoMatch?.[0]?.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '') ?? ''

const FONT = 'system-ui, -apple-system, Segoe UI, sans-serif'

const phases = [
  { label: 'DISCOVER', color: '#2563EB' },
  { label: 'PLAN', color: '#8B5CF6' },
  { label: 'IMPLEMENT', color: '#10B981' },
  { label: 'JUDGE', color: '#F43F5E' },
]

function textBaselineY(centerY, fontSize) {
  return centerY + Math.round(fontSize * 0.36)
}

const CONTENT_X = 88
const PILL_Y = 392
const PILL_H = 92
const PILL_W = 228
const PILL_GAP = 36
const PILL_CY = PILL_Y + PILL_H / 2
const PILL_FONT = 28

const phaseFlow = phases
  .map((phase, i) => {
    const x = CONTENT_X + i * (PILL_W + PILL_GAP)
    return `<rect x="${x}" y="${PILL_Y}" width="${PILL_W}" height="${PILL_H}" rx="${PILL_H / 2}" fill="${phase.color}"/>
      <text x="${x + PILL_W / 2}" y="${textBaselineY(PILL_CY, PILL_FONT)}" text-anchor="middle" fill="#FFFFFF" font-family="${FONT}" font-size="${PILL_FONT}" font-weight="800" letter-spacing="0.08em">${phase.label}</text>`
  })
  .join('\n')

const phaseArrows = phases
  .slice(0, -1)
  .map((_, i) => {
    const start = CONTENT_X + i * (PILL_W + PILL_GAP) + PILL_W + 10
    const end = start + PILL_GAP - 20
    return `<path d="M${start} ${PILL_CY} L${end} ${PILL_CY}" stroke="#94A3B8" stroke-width="5" stroke-linecap="round"/>
      <path d="M${end - 10} ${PILL_CY - 10} L${end} ${PILL_CY} L${end - 10} ${PILL_CY + 10}" stroke="#94A3B8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
  })
  .join('\n')

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0B1220"/>
      <stop offset="0.5" stop-color="#111827"/>
      <stop offset="1" stop-color="#1E1B4B"/>
    </linearGradient>
    <radialGradient id="glow" cx="280" cy="180" r="420" gradientUnits="userSpaceOnUse">
      <stop stop-color="#2563EB" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#2563EB" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="tlc-icon">
      <rect x="0" y="0" width="182" height="202"/>
    </clipPath>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <g transform="translate(992, 64) scale(0.32)" clip-path="url(#tlc-icon)">
    ${logoInner}
  </g>

  <rect x="${CONTENT_X}" y="80" width="488" height="50" rx="25" fill="#1D4ED8" fill-opacity="0.22" stroke="#60A5FA" stroke-opacity="0.45"/>
  <circle cx="${CONTENT_X + 28}" cy="105" r="7" fill="#34D399"/>
  <text x="${CONTENT_X + 48}" y="${textBaselineY(105, 20)}" fill="#BFDBFE" font-family="${FONT}" font-size="20" font-weight="700" letter-spacing="0.08em">AGENTIC SOFTWARE FACTORY</text>

  <text x="${CONTENT_X}" y="230" fill="#F8FAFC" font-family="${FONT}" font-size="92" font-weight="800" letter-spacing="-0.04em">TLC AI Dev Flow</text>
  <text x="${CONTENT_X}" y="312" fill="#E2E8F0" font-family="${FONT}" font-size="38" font-weight="500">Skills that run the factory, not the session.</text>

  ${phaseFlow}
  ${phaseArrows}
</svg>`

const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
})
const pngData = resvg.render().asPng()
writeFileSync(join(publicDir, 'og-tlc-ai-dev-flow.png'), pngData)
console.log('Wrote packages/marketplace/public/og-tlc-ai-dev-flow.png')
