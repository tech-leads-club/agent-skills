import { join, normalize, resolve, sep } from 'node:path'

import { CACHE_BASE_DIR, CACHE_NAMESPACE, CATEGORY_FOLDER_PATTERN } from './constants'
import type { InlineSegment, MarkdownToken } from './types'

/**
 * Converts a category id such as `core-migration` into a display label.
 *
 * @param categoryId - Hyphenated category identifier.
 * @returns Human-friendly title-cased category name.
 *
 * @example
 * ```ts
 * formatCategoryName('core-migration') // 'Core Migration'
 * ```
 */
export function formatCategoryName(categoryId: string): string {
  return categoryId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Sanitizes a skill or file name so it can be safely used in filesystem paths.
 *
 * @param name - Raw skill or file name.
 * @returns Sanitized name with unsafe path characters removed.
 *
 * @example
 * ```ts
 * sanitizeName('../my-skill') // 'my-skill'
 * ```
 */
export function sanitizeName(name: string): string {
  const sanitized = name
    .replace(/[/\\]/g, '')
    .replace(/[\0:*?"<>|]/g, '')
    .replace(/^[.\s]+|[.\s]+$/g, '')
    .replace(/\.{2,}/g, '')
    .replace(/^\.+/, '')

  return (sanitized || 'unnamed-skill').substring(0, 255)
}

/**
 * Verifies that a target path stays within the provided base path.
 *
 * @param basePath - Allowed root path.
 * @param targetPath - Candidate path to validate.
 * @returns `true` when the resolved target stays inside the base path.
 *
 * @example
 * ```ts
 * isPathSafe('/repo/.agents', '/repo/.agents/skills/accessibility') // true
 * ```
 */
export function isPathSafe(basePath: string, targetPath: string): boolean {
  const normalizedBase = normalize(resolve(basePath))
  const normalizedTarget = normalize(resolve(targetPath))
  return normalizedTarget.startsWith(normalizedBase + sep) || normalizedTarget === normalizedBase
}

/**
 * Extracts a category id from a folder name such as `(frontend)`.
 *
 * @param folderName - Folder name from the skills catalog.
 * @returns The extracted category id or `null` when the folder is not a category folder.
 *
 * @example
 * ```ts
 * extractCategoryId('(frontend)') // 'frontend'
 * ```
 */
export function extractCategoryId(folderName: string): string | null {
  const match = folderName.match(CATEGORY_FOLDER_PATTERN)
  return match ? match[1] : null
}

/**
 * Checks whether a folder name matches the category-folder convention.
 *
 * @param folderName - Folder name to validate.
 * @returns `true` when the folder name follows the `(category-id)` pattern.
 *
 * @example
 * ```ts
 * isCategoryFolder('(quality)') // true
 * ```
 */
export function isCategoryFolder(folderName: string): boolean {
  return CATEGORY_FOLDER_PATTERN.test(folderName)
}

/**
 * Converts a category id into its folder representation.
 *
 * @param categoryId - Category identifier.
 * @returns Category folder name used in the skills catalog.
 *
 * @example
 * ```ts
 * categoryIdToFolderName('quality') // '(quality)'
 * ```
 */
export function categoryIdToFolderName(categoryId: string): string {
  return `(${categoryId})`
}

/**
 * Returns the relative cache directory used by registry and download services.
 *
 * @returns Cache path relative to the user's home directory.
 *
 * @example
 * ```ts
 * getCacheDir() // '.cache/agent-skills'
 * ```
 */
export function getCacheDir(): string {
  return join(CACHE_BASE_DIR, CACHE_NAMESPACE)
}

/**
 * Removes YAML frontmatter from a markdown document when present.
 *
 * @param raw - Raw markdown input.
 * @returns Markdown body without leading frontmatter.
 *
 * @example
 * ```ts
 * stripFrontmatter('---\\ntitle: Example\\n---\\n# Heading') // '# Heading'
 * ```
 */
export function stripFrontmatter(raw: string): string {
  if (!raw.startsWith('---')) return raw

  let offset = 0
  while (offset < raw.length) {
    const lineEnd = raw.indexOf('\n', offset)
    const segmentEnd = lineEnd === -1 ? raw.length : lineEnd
    const contentEnd = raw[segmentEnd - 1] === '\r' ? segmentEnd - 1 : segmentEnd
    const line = raw.slice(offset, contentEnd)

    if (offset === 0) {
      if (line !== '---') return raw
    } else if (line === '---') {
      return raw.slice(lineEnd === -1 ? raw.length : lineEnd + 1).trimStart()
    }

    if (lineEnd === -1) return raw
    offset = lineEnd + 1
  }

  return raw
}

/**
 * Parses block-level markdown into a small token set used by skill viewers.
 *
 * @param raw - Raw markdown input.
 * @returns Parsed block-level markdown tokens.
 *
 * @example
 * ```ts
 * parseMarkdown('# Title\\n\\nBody')
 * ```
 */
export function parseMarkdown(raw: string): MarkdownToken[] {
  const body = stripFrontmatter(raw)
  const lines = body.split('\n')
  const tokens: MarkdownToken[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('```')) {
      const language = line.slice(3).trim()
      const codeLines: string[] = []
      i++

      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }

      tokens.push({ type: 'code-block', language, lines: codeLines })
      i++
      continue
    }

    if (line.trim() === '') {
      tokens.push({ type: 'blank' })
      i++
      continue
    }

    if (/^(-{3,}|_{3,}|\*{3,})$/.test(line.trim())) {
      tokens.push({ type: 'hr' })
      i++
      continue
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
    if (headingMatch) {
      tokens.push({
        type: 'heading',
        level: headingMatch[1].length as 1 | 2 | 3,
        text: headingMatch[2],
      })
      i++
      continue
    }

    const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.+)$/)
    if (listMatch) {
      const indent = Math.floor(listMatch[1].length / 2)
      tokens.push({ type: 'list-item', text: listMatch[3], indent })
      i++
      continue
    }

    tokens.push({ type: 'paragraph', text: line })
    i++
  }

  return tokens
}

/**
 * Parses inline markdown for bold, italic, and code spans.
 *
 * @param text - Inline markdown source.
 * @returns Ordered inline segments preserving plain text between tokens.
 *
 * @example
 * ```ts
 * parseInline('Use **bold** and `code`')
 * ```
 */
export function parseInline(text: string): InlineSegment[] {
  const segments: InlineSegment[] = []
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) segments.push({ text: text.slice(lastIndex, match.index) })
    const token = match[0]

    if (token.startsWith('`')) {
      segments.push({ text: token.slice(1, -1), code: true })
    } else if (token.startsWith('**')) {
      segments.push({ text: token.slice(2, -2), bold: true })
    } else if (token.startsWith('*')) {
      segments.push({ text: token.slice(1, -1), italic: true })
    }

    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) segments.push({ text: text.slice(lastIndex) })
  if (segments.length === 0) segments.push({ text })
  return segments
}
