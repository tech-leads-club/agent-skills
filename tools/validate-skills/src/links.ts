import { existsSync, readdirSync, readFileSync, statSync } from 'fs'
import { dirname, join, relative, resolve, sep } from 'path'

import { listSkillFiles } from './files'

export interface LinkFinding {
  kind: 'broken' | 'escapes'
  file: string
  line: number
  target: string
}

const FENCE = /^\s{0,3}(`{3,}|~{3,})/
const INLINE_CODE = /(`+)[\s\S]*?\1/g
const LINK = /\[[^\]]*\]\(\s*(<[^>]*>|[^)\s]+)(?:\s+[^)]*)?\)/g
const SCHEME = /^[a-z][a-z0-9+.-]*:/i

/**
 * Relative markdown links in every .md file of the skill. A target resolves from the skill root first
 * (agentskills.io), then relative to the file that holds the link (markdown). A link that leaves the skill
 * escapes when it lands in another catalog skill, and is broken otherwise.
 */
export function checkLinks(skillPath: string): { findings: LinkFinding[]; checked: number } {
  const root = resolve(skillPath)
  const findings: LinkFinding[] = []
  let checked = 0

  for (const file of listSkillFiles(skillPath).filter((f) => f.toLowerCase().endsWith('.md'))) {
    const lines = readFileSync(join(root, file), 'utf-8').split('\n')
    let fence: string | undefined

    lines.forEach((raw, index) => {
      const fenceMatch = raw.match(FENCE)
      if (fence) {
        if (fenceMatch && fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length) fence = undefined
        return
      }
      if (fenceMatch) {
        fence = fenceMatch[1]
        return
      }

      for (const match of raw.replace(INLINE_CODE, '').matchAll(LINK)) {
        const target = match[1].replace(/^<|>$/g, '')
        const path = relativePath(target)
        if (!path) continue
        checked++

        const fromFile = resolve(root, dirname(file), path)
        const resolved = [resolve(root, path), fromFile].some((c) => isInside(root, c) && existsSync(c))
        if (resolved) continue
        const kind =
          !isInside(root, fromFile) && existsInSibling(root, relative(dirname(root), fromFile)) ? 'escapes' : 'broken'
        findings.push({ kind, file, line: index + 1, target })
      }
    })
  }

  return { findings, checked }
}

const isInside = (root: string, path: string) => path === root || path.startsWith(root + sep)

/**
 * Installs put skills side by side, while the catalog splits them into category folders. `flatPath` is the
 * target relative to the skill's parent as an install lays it out (`<skill>/<path>`); it exists when that skill
 * is in any category of the catalog and holds `<path>`.
 */
function existsInSibling(skillRoot: string, flatPath: string): boolean {
  const [skill, ...rest] = flatPath.split(sep)
  if (!skill || skill === '..') return false
  const catalog = dirname(dirname(skillRoot))
  return readdirSync(catalog).some((category) => {
    const sibling = join(catalog, category, skill)
    return statSync(join(catalog, category)).isDirectory() && existsSync(sibling) && existsSync(join(sibling, ...rest))
  })
}

/** The filesystem part of a relative link, or undefined for anchors, URLs with a scheme and absolute paths. */
function relativePath(target: string): string | undefined {
  if (target.startsWith('#') || target.startsWith('/') || SCHEME.test(target)) return undefined
  const path = target.split('#')[0].split('?')[0]
  if (!path) return undefined
  try {
    return decodeURIComponent(path)
  } catch {
    return path
  }
}
