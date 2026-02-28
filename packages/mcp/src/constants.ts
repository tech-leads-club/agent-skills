/** Cache TTL for registry data (15 minutes). */
export const CACHE_TTL_MS = 15 * 60 * 1000

/** Same CDN as CLI: jsDelivr serving the npm package. @latest so MCP always sees the same cache as CLI after publish. */
const CDN_NPM_BASE = 'https://cdn.jsdelivr.net/npm/@tech-leads-club/skills-catalog@latest'

/** Base URL for skill files (registry and skills from same npm package on jsDelivr). */
export const CDN_BASE = `${CDN_NPM_BASE}/skills/`

/** URL of the skills registry JSON. */
export const REGISTRY_URL = `${CDN_NPM_BASE}/skills-registry.json`

/** Main skill instruction file name. */
export const SKILL_MAIN_FILE = 'SKILL.md'

/** Directory prefixes that denote optional reference files (scripts, references, assets). */
export const OPTIONAL_REFERENCE_DIRS = ['scripts/', 'references/', 'assets/'] as const

/** Max number of reference file paths to show in read_skill output. */
export const MAX_REFERENCE_FILES_DISPLAY = 50
