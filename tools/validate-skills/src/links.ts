import { existsSync, readFileSync } from 'fs'
import { dirname, join, resolve, sep } from 'path'

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
 * folder is reported as escaping, never as broken.
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
        // Sibling skills sit in other category folders here but side by side once installed, so a link that
        // leaves the skill cannot be checked on disk.
        findings.push({ kind: isInside(root, fromFile) ? 'broken' : 'escapes', file, line: index + 1, target })
      }
    })
  }

  return { findings, checked }
}

const isInside = (root: string, path: string) => path === root || path.startsWith(root + sep)

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
