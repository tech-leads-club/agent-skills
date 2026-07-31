/** Cache TTL for registry data (15 minutes). */
export const CACHE_TTL_MS = 15 * 60 * 1000

/** npm package that publishes skills-registry.json and skill files. */
export const SKILLS_CATALOG_PACKAGE = '@tech-leads-club/skills-catalog'

/** Main skill instruction file name. */
export const SKILL_MAIN_FILE = 'SKILL.md'

/** Max number of reference file paths to show in read_skill output. */
export const MAX_REFERENCE_FILES_DISPLAY = 50

/** Directory where prepare_skill_files materializes verified skill files for execution. */
export const STAGING_DIR_NAME = 'agent-skills-mcp'

/** Chars of contentHash used to name a skill's revision directory. */
export const STAGING_REVISION_LENGTH = 12

/**
 * Minimum age before a superseded revision directory is pruned.
 * hazard: an agent may still be running a script out of the previous revision when a skill
 * updates. The grace period keeps a recently used directory on disk until that turn is over.
 */
export const STAGING_PRUNE_MIN_AGE_MS = 60 * 60 * 1000
