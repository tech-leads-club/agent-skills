/** Cache TTL for registry data (15 minutes). */
export const CACHE_TTL_MS = 15 * 60 * 1000

/** npm package that publishes skills-registry.json and skill files. */
export const SKILLS_CATALOG_PACKAGE = '@tech-leads-club/skills-catalog'

/** Main skill instruction file name. */
export const SKILL_MAIN_FILE = 'SKILL.md'

/** Directory prefixes that denote optional reference files (scripts, references, assets). */
export const OPTIONAL_REFERENCE_DIRS = ['scripts/', 'references/', 'assets/'] as const

/** Max number of reference file paths to show in read_skill output. */
export const MAX_REFERENCE_FILES_DISPLAY = 50

/** Directory where prepare_skill_files materializes verified skill files for execution. */
export const STAGING_DIR_NAME = 'agent-skills-mcp'

/** How long a staged skill directory is considered fresh before it is rewritten. */
export const STAGING_TTL_MS = 24 * 60 * 60 * 1000
