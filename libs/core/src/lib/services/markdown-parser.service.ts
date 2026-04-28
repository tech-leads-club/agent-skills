import type { InlineSegment, MarkdownToken } from '../types'

/**
 * Removes YAML frontmatter from the start of a markdown document when present.
 *
 * @param raw - Raw markdown string that may include frontmatter.
 * @returns Markdown body without the leading frontmatter block.
 * @throws {never} This helper does not throw exceptions.
 *
 * @example
 * ```ts
 * stripFrontmatter('---\ntitle: Example\n---\n# Heading') // '# Heading'
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
 * Parses block-level markdown into a compact token set used by skill viewers.
 *
 * @param raw - Raw markdown input that may include blank lines and frontmatter.
 * @returns Array of {@link MarkdownToken} objects describing the document structure.
 * @throws {never} This parser only performs in-memory string analysis.
 *
 * @example
 * ```ts
 * parseMarkdown('# Title\n\nParagraph')
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
 * Parses inline markdown formatting (bold, italic, code) into segments.
 *
 * @param text - Inline markdown string.
 * @returns Ordered {@link InlineSegment} entries preserving raw text.
 * @throws {never} Inline parsing never throws.
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
