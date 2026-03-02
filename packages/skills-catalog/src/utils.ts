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

export function parseSkillFrontmatter(content: string): {
  name?: string
  description?: string
  author?: string
  version?: string
} {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) return {}

  const frontmatter = frontmatterMatch[1]
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m)
  const descMatch = frontmatter.match(/^description:\s*(.+)$/m)
  const metadataBlock = frontmatter.match(/^metadata:\s*\n((?:\s{2,}.+\n?)*)/m)
  const metadata = metadataBlock?.[1] || ''
  const authorMatch = metadata.match(/author:\s*(.+)$/m)
  const versionMatch = metadata.match(/version:\s*['"]?([^'"]+)['"]?$/m)

  return {
    name: nameMatch?.[1]?.trim(),
    description: descMatch?.[1]?.trim(),
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
