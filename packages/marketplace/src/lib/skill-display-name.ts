import { findLineOutsideCodeFences } from './markdown-code-fences'

/**
 * Derive a human-readable title from a kebab-case skill id.
 * Example: `tlc-spec-driven` → `Tlc Spec Driven`
 */
export function humanizeSkillId(id: string): string {
  return id
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/**
 * Strip inline markdown markup so a heading reads as plain text in `<title>`/H1.
 * Handles code spans (`` `x` ``), emphasis (`**x**`, `*x*`), and links (`[x](url)`).
 */
export function stripInlineMarkdown(text: string): string {
  return text
    .replace(/`+/g, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Prefer the first ATX H1 (`# Title`) in the markdown body; otherwise humanize `id`.
 * Only `# ` (level-1) counts — `##` and deeper are ignored — and `#` lines inside
 * code fences are skipped so a code sample never becomes the display name. Inline
 * markdown (backticks, emphasis, links) is stripped so the title stays plain text.
 */
export function extractDisplayName(markdownBody: string, id: string): string {
  const heading = findLineOutsideCodeFences(markdownBody, (line) => /^#\s+\S/.test(line))
  const match = heading?.match(/^#\s+(.+?)\s*#*\s*$/)
  if (match?.[1]) {
    const cleaned = stripInlineMarkdown(match[1])
    if (cleaned) return cleaned
  }
  return humanizeSkillId(id)
}
