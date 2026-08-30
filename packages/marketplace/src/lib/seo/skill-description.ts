/**
 * Skill descriptions in this catalog follow an enforced convention (see AGENTS.md):
 * `[what it does] + Use when ... + Do NOT use for ...`.
 *
 * why: that convention is real domain data, so parsing it — rather than inventing SEO copy —
 * yields the entity-clarity sections ("what / when / when not") that AI answer engines quote,
 * plus a short summary short enough to survive as a SERP snippet.
 */
export interface ParsedSkillDescription {
  summary: string
  useWhen: string[]
  doNotUseFor: string[]
}

const USE_WHEN_PATTERN = /(?:^|[.\s])Use (?:this skill )?when\b/i
const DO_NOT_PATTERN = /(?:^|[.\s])Do\s+not\s+use\s+(?:for|when|this)\b/i

function splitClauses(text: string): string[] {
  return text
    .split(/,(?![^(]*\))|;/)
    .map((clause) => clause.replace(/^\s*(?:and|or)\s+/i, '').trim())
    .map((clause) => clause.replace(/[.\s]+$/, '').trim())
    .filter((clause) => clause.length > 2)
}

function sliceAt(text: string, pattern: RegExp): { before: string; after: string } | null {
  const match = pattern.exec(text)
  if (!match) return null
  const start = match.index + (/^[.\s]/.test(match[0]) ? 1 : 0)
  return { before: text.slice(0, start).trim(), after: text.slice(start).trim() }
}

export function parseSkillDescription(description: string): ParsedSkillDescription {
  const normalized = description.replace(/\s+/g, ' ').trim()

  const notSplit = sliceAt(normalized, DO_NOT_PATTERN)
  const head = notSplit ? notSplit.before : normalized
  const doNotSection = notSplit ? notSplit.after.replace(DO_NOT_PATTERN, '').trim() : ''

  const whenSplit = sliceAt(head, USE_WHEN_PATTERN)
  const summarySection = whenSplit ? whenSplit.before : head
  const useWhenSection = whenSplit ? whenSplit.after.replace(USE_WHEN_PATTERN, '').trim() : ''

  return {
    summary: (summarySection || normalized).replace(/[.\s]+$/, '').trim(),
    useWhen: splitClauses(useWhenSection),
    doNotUseFor: splitClauses(doNotSection),
  }
}

/**
 * why: raw descriptions run up to ~970 characters, so shipping them verbatim as
 * `<meta name="description">` guarantees a truncated, low-CTR snippet.
 */
export function truncateForMeta(text: string, maxLength: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= maxLength) return clean

  const cut = clean.slice(0, maxLength - 1)
  const lastBoundary = Math.max(cut.lastIndexOf(' '), cut.lastIndexOf(','))
  return `${(lastBoundary > maxLength * 0.6 ? cut.slice(0, lastBoundary) : cut).replace(/[,\s]+$/, '')}…`
}
