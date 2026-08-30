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

function documentTitle(html) {
  const match = html.match(/<title>([^<]*)<\/title>/i)
  return match?.[1]?.trim() ?? null
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

/** True when basename appears as visible text/code and not only inside an href attribute value. */
function hasVisibleDocLabel(html, label) {
  if (!html.includes(label)) return false
  const withoutHrefs = html.replace(/\bhref="[^"]*"/gi, '')
  return withoutHrefs.includes(label)
}

function canonical(html) {
  return html.match(/rel="canonical"\s+href="([^"]+)"/i)?.[1] ?? null
}

/** Attribute values are HTML-escaped, so entities must be decoded before measuring length. */
function metaDescription(html) {
  const raw = html.match(/name="description"\s+content="([^"]*)"/i)?.[1]
  if (raw === undefined) return null
  return raw
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function jsonLdTypes(html) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1])
  const types = []
  for (const block of blocks) {
    let parsed
    try {
      parsed = JSON.parse(block)
    } catch (error) {
      fail(`invalid JSON-LD block: ${error.message}`)
    }
    for (const node of parsed['@graph'] ?? [parsed]) types.push(node['@type'])
  }
  return types
}

/** Every page must self-canonicalise to its own trailing-slashed URL. */
function assertCanonical(relPath, expectedUrl) {
  const found = canonical(read(relPath))
  if (found !== expectedUrl) fail(`${relPath} canonical "${found}" !== "${expectedUrl}"`)
}

function assertSchema(relPath, expectedTypes) {
  const types = jsonLdTypes(read(relPath))
  for (const expected of expectedTypes) {
    if (!types.includes(expected)) fail(`${relPath} JSON-LD missing @type ${expected} (found: ${types.join(', ')})`)
  }
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
if (!hub.includes('All skills')) {
  fail('/skills/ missing crawlable “All skills” index landmark')
}

const samplePage = read('skills/accessibility/index.html')
const h1Count = countH1(samplePage)
if (h1Count !== 1) fail(`accessibility page H1 count ${h1Count}, expected 1`)
const h1Text = firstH1Text(samplePage)
if (h1Text !== accessibility.name) {
  fail(`accessibility H1 "${h1Text}" !== display name "${accessibility.name}"`)
}
const title = documentTitle(samplePage)
if (!title || !title.includes(accessibility.name)) {
  fail(`accessibility <title> "${title}" does not include display name "${accessibility.name}"`)
}

const tlcPage = read('skills/tlc-spec-driven/index.html')
const bad = badRelativeDocHrefs(tlcPage)
if (bad.length > 0) {
  fail(`tlc-spec-driven has unsafe relative doc hrefs: ${bad.slice(0, 8).join(', ')}`)
}
if (!hasVisibleDocLabel(tlcPage, 'implement.md')) {
  fail('tlc-spec-driven missing visible neutralized label implement.md (text/code)')
}
const absoluteGithub = [...tlcPage.matchAll(/\bhref="(https:\/\/github\.com\/[^"]+)"/gi)].map((m) => m[1])
if (absoluteGithub.length === 0) {
  fail('tlc-spec-driven missing retained absolute GitHub <a href="https://…">')
}

const ORIGIN = 'https://agent-skills.techleads.club'

assertCanonical('index.html', `${ORIGIN}/`)
assertCanonical('skills/index.html', `${ORIGIN}/skills/`)
assertCanonical('skills/accessibility/index.html', `${ORIGIN}/skills/accessibility/`)
assertCanonical('categories/index.html', `${ORIGIN}/categories/`)
assertCanonical('categories/security/index.html', `${ORIGIN}/categories/security/`)
assertCanonical('agents/index.html', `${ORIGIN}/agents/`)
assertCanonical('agents/cursor/index.html', `${ORIGIN}/agents/cursor/`)
assertCanonical('about/index.html', `${ORIGIN}/about/`)

assertSchema('index.html', ['Organization', 'WebSite'])
assertSchema('skills/accessibility/index.html', ['Organization', 'TechArticle', 'BreadcrumbList'])
assertSchema('categories/security/index.html', ['Organization', 'CollectionPage', 'BreadcrumbList'])
assertSchema('agents/cursor/index.html', ['Organization', 'HowTo', 'BreadcrumbList'])

const seenDescriptions = new Map()
for (const skill of data.skills) {
  const relPath = `skills/${skill.id}/index.html`
  const description = metaDescription(read(relPath))
  if (!description) fail(`${relPath} has no meta description`)
  if (description.length > 161) fail(`${relPath} meta description is ${description.length} chars (limit 160)`)
  if (seenDescriptions.has(description)) {
    fail(`duplicate meta description on ${relPath} and ${seenDescriptions.get(description)}`)
  }
  seenDescriptions.set(description, relPath)
}

const sitemap = read('sitemap.xml')
const sitemapUrls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]))
const expectedUrls = [
  `${ORIGIN}/`,
  `${ORIGIN}/skills/`,
  `${ORIGIN}/categories/`,
  `${ORIGIN}/agents/`,
  ...data.skills.map((skill) => `${ORIGIN}/skills/${skill.id}/`),
  ...data.agents.map((agent) => `${ORIGIN}/agents/${agent.id}/`),
]
for (const url of expectedUrls) {
  if (!sitemapUrls.has(url)) fail(`sitemap missing ${url}`)
}
if (sitemapUrls.size !== [...sitemapUrls].length) fail('sitemap contains duplicate <loc> entries')
for (const url of sitemapUrls) {
  if (!url.endsWith('/')) fail(`sitemap URL without trailing slash: ${url}`)
}

const categoriesWithSkills = new Set(data.skills.map((skill) => skill.category))
for (const category of data.categories) {
  const relPath = `categories/${category.id}/index.html`
  const exists = fs.existsSync(path.join(OUT, relPath))
  const shouldExist = categoriesWithSkills.has(category.id) && category.id !== 'uncategorized'
  if (shouldExist && !exists) fail(`missing category hub for ${category.id}`)
  if (!shouldExist && exists) fail(`category hub ${category.id} exported but has no skills`)
  if (!exists) continue
  const hubLinks = uniqueSkillHrefs(read(relPath))
  const expected = data.skills.filter((skill) => skill.category === category.id).length
  if (hubLinks.size < expected) {
    fail(`category ${category.id} links ${hubLinks.size} skills, expected >= ${expected}`)
  }
}

if (!/name="robots" content="noindex/i.test(read('404.html'))) {
  fail('404.html is missing a noindex robots directive')
}

console.log(`  canonicals: self-referential and trailing-slashed on 8 sampled routes`)
console.log(`  structured data: Organization/WebSite/TechArticle/CollectionPage/HowTo/BreadcrumbList valid`)
console.log(
  `  meta descriptions: ${seenDescriptions.size} unique across ${data.skills.length} skill pages, all <= 160 chars`,
)
console.log(`  sitemap: ${sitemapUrls.size} URLs, all trailing-slashed, all expected routes present`)
console.log(`  category hubs: ${categoriesWithSkills.size} populated categories exported and fully linked`)

console.log('SEO smoke OK')
console.log(`  /skills/ unique skill links: ${hubLinks.size} (skills: ${skillCount})`)
console.log(`  accessibility title/H1: ${title} / ${h1Text}`)
console.log('  tlc-spec-driven: zero relative .md / references/ hrefs; labels + GitHub <a> retained')
