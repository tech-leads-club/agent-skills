import { CDN_BASE, OPTIONAL_REFERENCE_DIRS } from './constants'
import type { MatchQuality } from './types'

/** Returns whether the file path is an optional reference (scripts/, references/, assets/). */
export function isOptionalReferencePath(filePath: string): boolean {
  return OPTIONAL_REFERENCE_DIRS.some((dir) => filePath.startsWith(dir))
}

/** Builds the full CDN URL for a file within a skill. */
export function buildCdnUrl(skillPath: string, filePath: string): string {
  return CDN_BASE + skillPath + '/' + filePath
}

/** Returns the match quality based on the score. */
export function getMatchQuality(score: number): MatchQuality {
  if (score >= 85) return 'exact'
  if (score >= 65) return 'strong'
  if (score >= 45) return 'partial'
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
