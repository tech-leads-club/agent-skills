#!/usr/bin/env node
/* global console, process */
// Validator for file-based Tecture architectures.
// Usage: node validate.mjs [path/to/architecture]
// Exits 0 on success, 1 on validation failure, 2 on internal error.

import { constants as FS } from 'node:fs'
import { access, readFile, readdir } from 'node:fs/promises'
import { basename, extname, join, resolve } from 'node:path'

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

const NODE_TYPES = new Set([
  'system',
  'person',
  'service',
  'database',
  'queue',
  'gateway',
  'frontend',
  'cache',
  'storage',
  'external',
])
const EDGE_TYPES = new Set(['calls', 'reads', 'writes', 'publishes', 'subscribes', 'data-flow'])
const DIRECTIONS = new Set(['TB', 'LR'])
const LEVELS = new Set([1, 2, 3])

class Report {
  constructor() {
    this.errors = []
    this.warnings = []
  }
  err(where, msg) {
    this.errors.push(`[error] ${where}: ${msg}`)
  }
  warn(where, msg) {
    this.warnings.push(`[warn]  ${where}: ${msg}`)
  }
  get ok() {
    return this.errors.length === 0
  }
  print() {
    for (const w of this.warnings) console.warn(w)
    for (const e of this.errors) console.error(e)
    const summary = this.ok
      ? `OK — ${this.warnings.length} warning(s)`
      : `FAIL — ${this.errors.length} error(s), ${this.warnings.length} warning(s)`
    ;(this.ok ? console.log : console.error)(summary)
  }
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const isStr = (v) => typeof v === 'string'
const isBool = (v) => typeof v === 'boolean'
const isInt = (v) => Number.isInteger(v)

async function exists(p) {
  try {
    await access(p, FS.F_OK)
    return true
  } catch {
    return false
  }
}

async function loadJson(path) {
  const raw = await readFile(path, 'utf8')
  try {
    return JSON.parse(raw)
  } catch (e) {
    throw new Error(`Invalid JSON in ${path}: ${e.message}`)
  }
}

function validateManifest(m, report) {
  const where = 'manifest.json'
  if (!isObj(m)) return report.err(where, 'must be an object')

  const allowed = new Set(['name', 'description', 'topDiagram', 'diagrams'])
  for (const k of Object.keys(m)) {
    if (!allowed.has(k)) report.err(where, `unknown field "${k}"`)
  }

  if (!isStr(m.name) || m.name.length === 0) report.err(where, 'missing or empty name')
  if ('description' in m && !isStr(m.description)) report.err(where, 'description must be a string')
  if (!isStr(m.topDiagram) || !SLUG_RE.test(m.topDiagram)) {
    report.err(where, 'topDiagram must be a kebab-case slug')
  }
  if (!Array.isArray(m.diagrams) || m.diagrams.length === 0) {
    report.err(where, 'diagrams must be a non-empty array')
    return
  }
  const seen = new Set()
  for (const s of m.diagrams) {
    if (!isStr(s) || !SLUG_RE.test(s)) report.err(where, `invalid diagram slug: ${JSON.stringify(s)}`)
    if (seen.has(s)) report.err(where, `duplicate diagram slug: ${s}`)
    seen.add(s)
  }
  if (isStr(m.topDiagram) && !seen.has(m.topDiagram)) {
    report.err(where, `topDiagram "${m.topDiagram}" is not listed in diagrams[]`)
  }
}

function validateDiagramShape(slug, d, report) {
  const where = `diagrams/${slug}.json`
  if (!isObj(d)) {
    report.err(where, 'must be an object')
    return false
  }

  const allowed = new Set(['name', 'level', 'meta', 'nodes', 'edges'])
  for (const k of Object.keys(d)) {
    if (!allowed.has(k)) report.err(where, `unknown field "${k}"`)
  }

  if (!isStr(d.name) || d.name.length === 0) report.err(where, 'missing or empty name')
  if ('level' in d && !(isInt(d.level) && LEVELS.has(d.level))) {
    report.err(where, 'level must be 1, 2, or 3')
  }
  if ('meta' in d) {
    if (!isObj(d.meta)) report.err(where, 'meta must be an object')
    else {
      if ('direction' in d.meta && !DIRECTIONS.has(d.meta.direction)) {
        report.err(where, 'meta.direction must be "TB" or "LR"')
      }
      if ('layout' in d.meta && !isStr(d.meta.layout)) {
        report.err(where, 'meta.layout must be a string')
      }
    }
  }
  if (!Array.isArray(d.nodes) || d.nodes.length === 0) {
    report.err(where, 'nodes must be a non-empty array')
    return false
  }
  if ('edges' in d && !Array.isArray(d.edges)) {
    report.err(where, 'edges must be an array')
  }

  const nodeIds = new Set()
  for (const [i, n] of d.nodes.entries()) {
    const nw = `${where}#nodes[${i}]`
    if (!isObj(n)) {
      report.err(nw, 'must be an object')
      continue
    }
    const nodeAllowed = new Set(['id', 'label', 'parentId', 'subDiagramId', 'meta'])
    for (const k of Object.keys(n)) {
      if (!nodeAllowed.has(k)) report.err(nw, `unknown field "${k}"`)
    }
    if (!isStr(n.id) || !SLUG_RE.test(n.id)) report.err(nw, 'id must be a kebab-case slug')
    else if (nodeIds.has(n.id)) report.err(nw, `duplicate node id "${n.id}" within diagram`)
    else nodeIds.add(n.id)
    if (!isStr(n.label) || n.label.length === 0) report.err(nw, 'missing or empty label')
    if ('parentId' in n && n.parentId !== null && !isStr(n.parentId)) {
      report.err(nw, 'parentId must be a string or null')
    }
    if ('subDiagramId' in n && n.subDiagramId !== null && (!isStr(n.subDiagramId) || !SLUG_RE.test(n.subDiagramId))) {
      report.err(nw, 'subDiagramId must be a kebab-case slug or null')
    }
    if ('meta' in n) {
      if (!isObj(n.meta)) report.err(nw, 'meta must be an object')
      else {
        if ('type' in n.meta && !NODE_TYPES.has(n.meta.type)) {
          report.err(nw, `meta.type "${n.meta.type}" is not a valid node type`)
        }
        if ('technology' in n.meta && (!isStr(n.meta.technology) || !SLUG_RE.test(n.meta.technology))) {
          report.err(nw, 'meta.technology must be a kebab-case slug')
        }
        if ('isContainer' in n.meta && !isBool(n.meta.isContainer)) {
          report.err(nw, 'meta.isContainer must be boolean')
        }
      }
    }
  }

  const edges = d.edges ?? []
  const edgeIds = new Set()
  for (const [i, e] of edges.entries()) {
    const ew = `${where}#edges[${i}]`
    if (!isObj(e)) {
      report.err(ew, 'must be an object')
      continue
    }
    const edgeAllowed = new Set(['id', 'source', 'target', 'label', 'meta'])
    for (const k of Object.keys(e)) {
      if (!edgeAllowed.has(k)) report.err(ew, `unknown field "${k}"`)
    }
    if (!isStr(e.id) || !SLUG_RE.test(e.id)) report.err(ew, 'id must be a kebab-case slug')
    else if (edgeIds.has(e.id)) report.err(ew, `duplicate edge id "${e.id}"`)
    else edgeIds.add(e.id)
    if (!isStr(e.source)) report.err(ew, 'source must be a string')
    if (!isStr(e.target)) report.err(ew, 'target must be a string')
    if ('label' in e && !isStr(e.label)) report.err(ew, 'label must be a string')
    if ('meta' in e) {
      if (!isObj(e.meta)) report.err(ew, 'meta must be an object')
      else if ('type' in e.meta && !EDGE_TYPES.has(e.meta.type)) {
        report.err(ew, `meta.type "${e.meta.type}" is not a valid edge type`)
      }
    }
  }

  return true
}

function validateDiagramReferences(slug, d, report, allSlugs, descriptionsAvailable, allNodeIds) {
  const where = `diagrams/${slug}.json`
  const nodes = d.nodes ?? []
  const edges = d.edges ?? []
  const nodesById = new Map(nodes.filter((n) => isStr(n?.id)).map((n) => [n.id, n]))

  for (const [i, n] of nodes.entries()) {
    const nw = `${where}#nodes[${i}]`
    if (!isStr(n?.id)) continue

    if (allNodeIds.has(n.id) && allNodeIds.get(n.id) !== slug) {
      report.err(
        nw,
        `node id "${n.id}" is also used in diagrams/${allNodeIds.get(n.id)}.json — node ids must be globally unique`,
      )
    } else {
      allNodeIds.set(n.id, slug)
    }

    if (n.parentId) {
      const parent = nodesById.get(n.parentId)
      if (!parent) report.err(nw, `parentId "${n.parentId}" does not match any node in this diagram`)
      else if (!parent.meta?.isContainer) {
        report.err(
          nw,
          `parentId "${n.parentId}" points to a node that is not a container (set parent's meta.isContainer = true)`,
        )
      }
    }
    if (n.subDiagramId) {
      if (!allSlugs.has(n.subDiagramId)) {
        report.err(nw, `subDiagramId "${n.subDiagramId}" is not a known diagram slug`)
      }
      if (n.subDiagramId === slug) {
        report.err(nw, `subDiagramId points to the same diagram (self-reference)`)
      }
    }

    if (!descriptionsAvailable.has(n.id)) {
      report.err(nw, `missing description file: descriptions/${n.id}.md`)
    }
  }

  validateNestingDepthAndCycles(slug, nodes, nodesById, report)

  for (const [i, e] of edges.entries()) {
    const ew = `${where}#edges[${i}]`
    if (!isStr(e?.source) || !isStr(e?.target)) continue
    if (!nodesById.has(e.source)) report.err(ew, `edge source "${e.source}" does not match any node in this diagram`)
    if (!nodesById.has(e.target)) report.err(ew, `edge target "${e.target}" does not match any node in this diagram`)
  }
}

// Enforces: parentId chain is acyclic and nests at most one level deep.
// Depth 0 = top-level, depth 1 = child of a container. Depth >= 2 (grandchild) is an error.
// Deeper decomposition should use subDiagramId (a separate child diagram).
const MAX_NESTING_DEPTH = 1

function validateNestingDepthAndCycles(slug, nodes, nodesById, report) {
  const where = `diagrams/${slug}.json`
  const depthCache = new Map()
  const cycleReported = new Set()

  function depthOf(id, visiting) {
    if (depthCache.has(id)) return depthCache.get(id)
    if (visiting.has(id)) {
      if (!cycleReported.has(id)) {
        const cycle = [...visiting, id]
        const start = cycle.indexOf(id)
        report.err(where, `parentId cycle: ${cycle.slice(start).join(' → ')}`)
        for (const c of cycle.slice(start)) cycleReported.add(c)
      }
      return Infinity
    }
    const n = nodesById.get(id)
    if (!n?.parentId) {
      depthCache.set(id, 0)
      return 0
    }
    if (!nodesById.has(n.parentId)) {
      depthCache.set(id, 0)
      return 0
    }
    visiting.add(id)
    const parentDepth = depthOf(n.parentId, visiting)
    visiting.delete(id)
    const d = parentDepth === Infinity ? Infinity : parentDepth + 1
    depthCache.set(id, d)
    return d
  }

  for (const [i, n] of nodes.entries()) {
    if (!isStr(n?.id)) continue
    const d = depthOf(n.id, new Set())
    if (d !== Infinity && d > MAX_NESTING_DEPTH) {
      const nw = `${where}#nodes[${i}]`
      report.err(
        nw,
        `nesting too deep (${d} levels via parentId chain; max ${MAX_NESTING_DEPTH}) — use subDiagramId to push deeper decomposition into a child diagram`,
      )
    }
  }
}

function detectDrillDownCycles(diagrams, report) {
  // Build edges: diagramSlug -> set of child diagram slugs via any node.subDiagramId
  const children = new Map()
  for (const [slug, d] of diagrams) {
    const kids = new Set()
    for (const n of d.nodes ?? []) {
      if (isStr(n?.subDiagramId)) kids.add(n.subDiagramId)
    }
    children.set(slug, kids)
  }

  const WHITE = 0,
    GRAY = 1,
    BLACK = 2
  const color = new Map([...children.keys()].map((s) => [s, WHITE]))

  const dfs = (s, stack) => {
    color.set(s, GRAY)
    stack.push(s)
    for (const c of children.get(s) ?? []) {
      if (!children.has(c)) continue // unknown child already reported
      const col = color.get(c)
      if (col === GRAY) {
        const i = stack.indexOf(c)
        const cycle = [...stack.slice(i), c].join(' → ')
        report.err('architecture', `drill-down cycle detected via subDiagramId: ${cycle}`)
      } else if (col === WHITE) {
        dfs(c, stack)
      }
    }
    stack.pop()
    color.set(s, BLACK)
  }
  for (const s of children.keys()) if (color.get(s) === WHITE) dfs(s, [])
}

async function main() {
  const root = resolve(process.argv[2] ?? 'architecture')
  const report = new Report()

  if (!(await exists(root))) {
    console.error(`[error] architecture directory not found: ${root}`)
    process.exit(2)
  }

  const manifestPath = join(root, 'manifest.json')
  if (!(await exists(manifestPath))) {
    console.error(`[error] missing ${manifestPath}`)
    process.exit(1)
  }

  let manifest
  try {
    manifest = await loadJson(manifestPath)
  } catch (e) {
    console.error(`[error] ${e.message}`)
    process.exit(1)
  }

  validateManifest(manifest, report)

  const diagramsDir = join(root, 'diagrams')
  const descriptionsDir = join(root, 'descriptions')

  if (!(await exists(diagramsDir))) {
    report.err('architecture', `missing diagrams/ directory`)
    report.print()
    process.exit(1)
  }

  const onDisk = (await readdir(diagramsDir)).filter((f) => extname(f) === '.json').map((f) => basename(f, '.json'))
  const onDiskSet = new Set(onDisk)

  const listed = new Set(Array.isArray(manifest.diagrams) ? manifest.diagrams : [])
  for (const slug of listed) {
    if (!onDiskSet.has(slug))
      report.err('architecture', `manifest lists "${slug}" but diagrams/${slug}.json does not exist`)
  }
  for (const slug of onDisk) {
    if (!listed.has(slug))
      report.warn('architecture', `diagrams/${slug}.json exists but is not listed in manifest.diagrams`)
  }

  const descriptionsAvailable = new Set()
  if (await exists(descriptionsDir)) {
    for (const f of await readdir(descriptionsDir)) {
      if (extname(f) === '.md') descriptionsAvailable.add(basename(f, '.md'))
    }
  } else {
    report.warn('architecture', `descriptions/ directory does not exist`)
  }

  const diagrams = new Map()
  for (const slug of onDisk) {
    try {
      const d = await loadJson(join(diagramsDir, `${slug}.json`))
      if (validateDiagramShape(slug, d, report)) diagrams.set(slug, d)
    } catch (e) {
      report.err(`diagrams/${slug}.json`, e.message)
    }
  }

  const allSlugs = new Set(diagrams.keys())
  const allNodeIds = new Map()
  for (const [slug, d] of diagrams) {
    validateDiagramReferences(slug, d, report, allSlugs, descriptionsAvailable, allNodeIds)
  }

  // Warn about orphan description files
  const usedDescriptionIds = new Set(allNodeIds.keys())
  for (const id of descriptionsAvailable) {
    if (!usedDescriptionIds.has(id)) {
      report.warn('architecture', `descriptions/${id}.md has no matching node id`)
    }
  }

  detectDrillDownCycles(diagrams, report)

  report.print()
  process.exit(report.ok ? 0 : 1)
}

main().catch((e) => {
  console.error(`[internal error] ${e.stack || e.message}`)
  process.exit(2)
})
