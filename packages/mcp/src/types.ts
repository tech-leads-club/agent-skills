import Fuse from 'fuse.js'

/** Skill entry from the registry. */
export interface SkillEntry {
  name: string
  description: string
  category: string
  path: string
  files: string[]
  author?: string
  version?: string
  contentHash: string
}

/** Registry data structure. */
export interface Registry {
  version: string
  categories: Record<string, { name: string; description: string }>
  skills: SkillEntry[]
  deprecated: Array<{ name: string; message: string; alternatives: string[] }>
}

/** Registry cache data. */
export interface RegistryCache {
  data: Registry
  etag?: string
  fetchedAt: number
}

/** Skill shape used in the Fuse search index (no score yet). */
export interface IndexSkill {
  name: string
  description: string
  usage_hint: string
  category: string
  triggers: string
}

/** Skill search result returned to the user (includes score and match_quality). */
export interface SlimSkill {
  name: string
  description: string
  usage_hint: string
  category: string
  score: number
  match_quality: MatchQuality
}

/** Match quality for search results. */
export type MatchQuality = 'exact' | 'strong' | 'partial' | 'weak'

/** Indexes for the Fuse search and skill lookup. */
export type Indexes = { fuse: Fuse<IndexSkill>; map: Map<string, SkillEntry> }
