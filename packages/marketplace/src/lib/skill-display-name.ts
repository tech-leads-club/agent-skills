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
 * Prefer the first ATX H1 (`# Title`) in the markdown body; otherwise humanize `id`.
 * Only `# ` (level-1) counts — `##` and deeper are ignored for display name.
 */
export function extractDisplayName(markdownBody: string, id: string): string {
  const match = markdownBody.match(/^#\s+(.+?)\s*$/m)
  if (match?.[1]) {
    return match[1].trim()
  }
  return humanizeSkillId(id)
}
