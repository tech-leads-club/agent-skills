#!/usr/bin/env node
/**
 * Post-export SEO smoke checks for marketplace static HTML.
 * Run: npx nx run marketplace:export && node packages/marketplace/scripts/seo-smoke.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'out')
const SKILLS_JSON = path.join(ROOT, 'src/data/skills.json')

function fail(message) {
  console.error(`SEO smoke FAIL: ${message}`)
  process.exit(1)
}

function read(relPath) {
  const full = path.join(OUT, relPath)
  if (!fs.existsSync(full)) fail(`missing export file ${relPath}`)
  return fs.readFileSync(full, 'utf8')
}

function uniqueSkillHrefs(html) {
  const matches = [...html.matchAll(/href="(\/skills\/[^"#?]+\/)"/g)].map((m) => m[1])
  return new Set(matches)
}

function countH1(html) {
  return (html.match(/<h1\b/gi) || []).length
}

function firstH1Text(html) {
  const match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)
  if (!match) return null
  return match[1].replace(/<[^>]+>/g, '').trim()
}

/** Marketplace-relative hrefs that look like package markdown paths (not absolute https). */
function badRelativeDocHrefs(html) {
  const hrefs = [...html.matchAll(/\bhref="([^"]+)"/gi)].map((m) => m[1])
  return hrefs.filter((href) => {
    if (/^https?:/i.test(href) || href.startsWith('mailto:') || href.startsWith('#')) return false
    if (href.includes('references/')) return true
    if (/\.md(?:$|[?#])/i.test(href)) return true
    return false
  })
}

const data = JSON.parse(fs.readFileSync(SKILLS_JSON, 'utf8'))
const skillCount = data.skills.length
const accessibility = data.skills.find((s) => s.id === 'accessibility')
if (!accessibility) fail('skills.json missing accessibility sample')

const hub = read('skills/index.html')
const hubLinks = uniqueSkillHrefs(hub)
if (hubLinks.size < skillCount) {
  fail(`/skills/ unique skill links ${hubLinks.size} < skill count ${skillCount}`)
}
if (hub.includes('Loading skills')) {
  fail('/skills/ still contains “Loading skills…”')
}

const samplePage = read('skills/accessibility/index.html')
const h1Count = countH1(samplePage)
if (h1Count !== 1) fail(`accessibility page H1 count ${h1Count}, expected 1`)
const h1Text = firstH1Text(samplePage)
if (h1Text !== accessibility.name) {
  fail(`accessibility H1 "${h1Text}" !== display name "${accessibility.name}"`)
}

const tlcPage = read('skills/tlc-spec-driven/index.html')
const bad = badRelativeDocHrefs(tlcPage)
if (bad.length > 0) {
  fail(`tlc-spec-driven has unsafe relative doc hrefs: ${bad.slice(0, 8).join(', ')}`)
}

console.log('SEO smoke OK')
console.log(`  /skills/ unique skill links: ${hubLinks.size} (skills: ${skillCount})`)
console.log(`  accessibility H1: ${h1Text}`)
console.log('  tlc-spec-driven: zero relative .md / references/ hrefs')
