export type MarkdownToken =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list-item'; text: string; indent: number }
  | { type: 'code-block'; language: string; lines: string[] }
  | { type: 'hr' }
  | { type: 'blank' }

function stripFrontmatter(raw: string): string {
  if (!raw.startsWith('---')) return raw
  const endIndex = raw.indexOf('---', 3)
  if (endIndex === -1) return raw
  return raw.slice(endIndex + 3).trimStart()
}

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

export interface InlineSegment {
  text: string
  bold?: boolean
  italic?: boolean
  code?: boolean
}

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
