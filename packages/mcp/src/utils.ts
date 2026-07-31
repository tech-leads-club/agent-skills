import { OPTIONAL_REFERENCE_DIRS } from './constants'
import type { MatchQuality } from './types'

/** Returns whether the file path is an optional reference (scripts/, references/, assets/). */
export function isOptionalReferencePath(filePath: string): boolean {
  return OPTIONAL_REFERENCE_DIRS.some((dir) => filePath.startsWith(dir))
}

/** Builds the full CDN URL for a file within a skill, using a pinned skills/ base URL. */
export function buildCdnUrl(skillsBaseUrl: string, skillPath: string, filePath: string): string {
  return `${skillsBaseUrl}${skillPath}/${filePath}`
}

/**
 * Returns the match quality based on the score.
 *
 * why: the bands map onto the token-search score scale, where a strong match on a multi-word
 * intent phrase still scores well below 100 — the previous 85/65/45 cutoffs belonged to a
 * different scale and collapsed every real match into 'weak'.
 * invariant: 'weak' is the band buildSearchSkillsResponse discards, so this lower bound decides
 * what search_skills returns at all. Changing it changes tool output, not just a label.
 */
export function getMatchQuality(score: number): MatchQuality {
  if (score >= 45) return 'exact'
  if (score >= 30) return 'strong'
  if (score >= 20) return 'partial'
  return 'weak'
}

/** Extracts the triggers from the description. */
export function extractTriggers(description: string): string {
  const patterns = [
    /Triggers?\s+on\s+(.+?)(?:\.\s|$)/i,
    /Use\s+when\s+(?:asked\s+to\s+|the\s+user\s+(?:asks?|mentions?)\s+)?(.+?)(?:\.\s|$)/i,
    /Keywords?\s*[-–:]\s*(.+?)(?:\.\s|$)/i,
  ]

  const triggers: string[] = []

  for (const pattern of patterns) {
    const match = description.match(pattern)
    if (match?.[1]) triggers.push(match[1].replace(/['"]/g, '').replace(/\s+/g, ' ').trim())
  }

  return triggers.join(' ')
}
