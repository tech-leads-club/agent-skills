import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '../public')
const logoSvg = readFileSync(join(publicDir, 'tlc-logo-dark.svg'), 'utf8')
const logoMatch = logoSvg.match(/<svg[\s\S]*<\/svg>/)
const logoInner = logoMatch?.[0] ?? ''

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0B1220"/>
      <stop offset="0.45" stop-color="#111827"/>
      <stop offset="1" stop-color="#1E1B4B"/>
    </linearGradient>
    <linearGradient id="glow" x1="600" y1="120" x2="600" y2="420" gradientUnits="userSpaceOnUse">
      <stop stop-color="#2563EB" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#2563EB" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop stop-color="#2563EB"/>
      <stop offset="1" stop-color="#10B981"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="980" cy="120" r="220" fill="#4F46E5" fill-opacity="0.12"/>
  <circle cx="180" cy="520" r="180" fill="#2563EB" fill-opacity="0.14"/>
  <ellipse cx="600" cy="250" rx="420" ry="180" fill="url(#glow)"/>
  <rect x="80" y="80" width="1040" height="470" rx="28" stroke="#334155" stroke-opacity="0.55" stroke-width="1.5"/>
  <rect x="120" y="130" width="260" height="34" rx="17" fill="#1D4ED8" fill-opacity="0.18" stroke="#3B82F6" stroke-opacity="0.35"/>
  <circle cx="142" cy="147" r="4" fill="#10B981"/>
  <text x="158" y="152" fill="#93C5FD" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="16" font-weight="600" letter-spacing="0.04em">SPEC-DRIVEN DEVELOPMENT</text>
  <text x="120" y="230" fill="#F8FAFC" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="58" font-weight="800" letter-spacing="-0.03em">TLC Spec-Driven</text>
  <text x="120" y="295" fill="#CBD5E1" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="30" font-weight="500">AI agents that ship right, every time</text>
  <rect x="120" y="340" width="520" height="4" rx="2" fill="url(#accent)"/>
  <text x="120" y="395" fill="#94A3B8" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="22" font-weight="500">4 adaptive phases · Atomic tasks · Independent verification</text>
  <text x="120" y="435" fill="#64748B" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="20" font-weight="500">Requirement traceability from spec to commit</text>
  <g transform="translate(120, 470) scale(0.34)">
    ${logoInner.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}
  </g>
  <text x="120" y="585" fill="#64748B" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="18" font-weight="500">agent-skills.techleads.club/tlc-spec-driven</text>
  <g transform="translate(860, 470)">
    <rect x="0" y="0" width="220" height="92" rx="16" fill="#0F172A" fill-opacity="0.72" stroke="#334155" stroke-opacity="0.8"/>
    <text x="24" y="34" fill="#94A3B8" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="14" font-weight="600" letter-spacing="0.08em">BENCHMARK</text>
    <text x="24" y="68" fill="#F8FAFC" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="24" font-weight="700">Best-in-class consistency</text>
  </g>
</svg>`

const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
})
const pngData = resvg.render().asPng()
writeFileSync(join(publicDir, 'og-tlc-spec-driven.png'), pngData)
console.log('Wrote packages/marketplace/public/og-tlc-spec-driven.png')
