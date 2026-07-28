/**
 * Demote ATX level-1 headings (`# Title`) to level-2 (`## Title`) so the page
 * chrome can own the sole document H1. Deeper headings (`##`+) are unchanged.
 */
export function demoteFirstMarkdownH1(markdownBody: string): string {
  // `^#\s+` does not match `##` because the character after the first `#` is `#`, not whitespace.
  return markdownBody.replace(/^#\s+/gm, '## ')
}
