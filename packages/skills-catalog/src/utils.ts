import type { DeprecatedEntry } from '@tech-leads-club/core'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export const IGNORED_FILES = ['.DS_Store', '.gitkeep', 'Thumbs.db', '.gitignore']
export const CATEGORY_FOLDER_PATTERN = /^\(([a-z][a-z0-9-]*)\)$/
export const CATEGORY_METADATA_FILE = '_category.json'
export const SKILL_NAME_SLUG_PATTERN = /^[a-z][a-z0-9-]*$/

export interface SkillMetadata {
  name: string
  description: string
  category: string
  path: string
  files: string[]
  author?: string
  version?: string
  contentHash: string
}

export interface CategoryMetadata {
  name: string
  description?: string
}

export interface SkillsRegistry {
  version: string
  categories: Record<string, CategoryMetadata>
  skills: SkillMetadata[]
  deprecated?: DeprecatedEntry[]
}

/**
 * why: YAML block scalars (`description: >` / `|`) are common in SKILL.md frontmatter,
 * and a single-line regex captured only the indicator character, publishing ">" as the
 * skill description to the registry, the CLI and the marketplace metadata.
 */
function readScalar(frontmatter: string, key: string): string | undefined {
  const lines = frontmatter.split('\n')
  const headerPattern = new RegExp(`^${key}:[ \t]*(.*)$`)

  for (let index = 0; index < lines.length; index += 1) {
    const header = lines[index].match(headerPattern)
    if (!header) continue

    const inline = header[1].trim()
    const isBlockScalar = /^[>|][+-]?\d*$/.test(inline)

    if (inline !== '' && !isBlockScalar) {
      return stripQuotes(inline)
    }
    if (!isBlockScalar) return undefined

    const folded = inline.startsWith('>')
    const block: string[] = []
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const line = lines[cursor]
      if (line.trim() === '') {
        block.push('')
        continue
      }
      if (!/^[ \t]/.test(line)) break
      block.push(line.trim())
    }

    while (block.length > 0 && block[block.length - 1] === '') block.pop()
    const joined = folded
      ? block.reduce((acc, line) => (line === '' ? `${acc}\n` : acc === '' ? line : `${acc} ${line}`), '')
      : block.join('\n')

    return joined.trim() || undefined
  }

  return undefined
}

function stripQuotes(value: string): string {
  const quoted = value.match(/^(['"])([\s\S]*)\1$/)
  return (quoted ? quoted[2] : value).trim()
}

export function parseSkillFrontmatter(content: string): {
  name?: string
  description?: string
  author?: string
  version?: string
} {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) return {}

  const frontmatter = frontmatterMatch[1]
  const metadataBlock = frontmatter.match(/^metadata:\s*\n((?:\s{2,}.+\n?)*)/m)
  const metadata = metadataBlock?.[1] || ''
  const authorMatch = metadata.match(/author:\s*(.+)$/m)
  const versionMatch = metadata.match(/version:\s*['"]?([^'"]+)['"]?$/m)

  return {
    name: readScalar(frontmatter, 'name'),
    description: readScalar(frontmatter, 'description'),
    author: authorMatch?.[1]?.trim(),
    version: versionMatch?.[1]?.trim(),
  }
}

export function getFilesInDirectory(dir: string): string[] {
  const files: string[] = []

  function walk(currentDir: string, prefix = '') {
    const entries = readdirSync(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      if (IGNORED_FILES.includes(entry.name) || entry.name.startsWith('.')) continue
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name

      if (entry.isDirectory()) {
        walk(join(currentDir, entry.name), relativePath)
      } else {
        files.push(relativePath)
      }
    }
  }

  walk(dir)
  return files
}

export function computeSkillHash(skillDir: string, files: string[]): string {
  const hash = createHash('sha256')
  const sortedFiles = [...files].sort()

  for (const file of sortedFiles) {
    const filePath = join(skillDir, file)

    if (existsSync(filePath)) {
      hash.update(file)
      hash.update(readFileSync(filePath))
    }
  }

  return hash.digest('hex')
}

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // replace any non-alphanumeric sequence with a hyphen
    .replace(/^-+|-+$/g, '') // strip leading/trailing hyphens
}
