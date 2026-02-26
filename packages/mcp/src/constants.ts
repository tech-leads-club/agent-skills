/** Cache TTL for registry data (15 minutes). */
export const CACHE_TTL_MS = 15 * 60 * 1000

/** Base URL for skill files on jsDelivr CDN. */
export const CDN_BASE =
  'https://cdn.jsdelivr.net/gh/tech-leads-club/agent-skills@latest/packages/skills-catalog/skills/'

/** URL of the skills registry JSON. */
export const REGISTRY_URL =
  'https://cdn.jsdelivr.net/gh/tech-leads-club/agent-skills@latest/packages/skills-catalog/skills-registry.json'

/** Main skill instruction file name. */
export const SKILL_MAIN_FILE = 'SKILL.md'

/** Directory prefixes that denote optional reference files (scripts, references, assets). */
export const OPTIONAL_REFERENCE_DIRS = ['scripts/', 'references/', 'assets/'] as const

/** Max number of reference file paths to show in read_skill output. */
export const MAX_REFERENCE_FILES_DISPLAY = 50
