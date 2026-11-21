const SKILL_LINK_PATTERN = /\]\(\/skills\/([^/)#?\s]+)\/?(?:[#?][^)]*)?\)/g

/** Skill ids targeted by `[label](/skills/<id>/)` links that do not exist in the catalog. */
export function findBrokenSkillLinks(markdown: string, skillIds: Set<string>): string[] {
  const broken = new Set<string>()
  for (const match of markdown.matchAll(SKILL_LINK_PATTERN)) {
    if (!skillIds.has(match[1])) broken.add(match[1])
  }
  return [...broken]
}

/** Root-relative site path (`/skills/x/`), as opposed to protocol-relative `//host` URLs. */
export function isInternalHref(href: string | undefined): href is string {
  return href != null && /^\/(?!\/)/.test(href.trim())
}

export type TextSegment = { text: string } | { skillId: string }

const USE_GROUP_PATTERN = /\(use ([^)]+)\)/gi
const ID_TOKEN_PATTERN = /[a-z0-9][a-z0-9-]*[a-z0-9]/g

/**
 * Splits a "Do NOT use for" clause so the skills it points to — written as `(use seo)` or
 * `(use tlc-spec-lean or tlc-spec-driven)` by the catalog's description convention — can be
 * rendered as links. Only tokens that are real skill ids become links; everything else stays text.
 */
export function splitSkillReferences(text: string, skillIds: ReadonlySet<string>): TextSegment[] {
  const segments: TextSegment[] = []
  let cursor = 0

  const pushText = (value: string) => {
    if (!value) return
    const last = segments[segments.length - 1]
    if (last && 'text' in last) last.text += value
    else segments.push({ text: value })
  }

  for (const group of text.matchAll(USE_GROUP_PATTERN)) {
    const groupStart = group.index ?? 0
    const innerStart = groupStart + group[0].indexOf(group[1])
    pushText(text.slice(cursor, innerStart))
    cursor = innerStart

    for (const token of group[1].matchAll(ID_TOKEN_PATTERN)) {
      if (!skillIds.has(token[0])) continue
      const tokenStart = innerStart + (token.index ?? 0)
      pushText(text.slice(cursor, tokenStart))
      segments.push({ skillId: token[0] })
      cursor = tokenStart + token[0].length
    }
  }

  pushText(text.slice(cursor))
  return segments
}
