import { mapLinesOutsideCodeFences } from './markdown-code-fences'

/**
 * Demote ATX level-1 headings (`# Title`) to level-2 (`## Title`) so the page
 * chrome can own the sole document H1. Deeper headings (`##`+) are unchanged,
 * and `#` lines inside fenced code blocks (shell comments, markdown templates)
 * are left intact — they are code samples, not document headings.
 */
export function demoteFirstMarkdownH1(markdownBody: string): string {
  // `^#\s+` does not match `##` because the character after the first `#` is `#`, not whitespace.
  return mapLinesOutsideCodeFences(markdownBody, (line) => line.replace(/^#\s+/, '## '))
}
