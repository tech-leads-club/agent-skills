import type { CategoryInfo } from './types'

/** Relative path to the local skills catalog in the monorepo. */
export const SKILLS_CATALOG_DIR = 'packages/skills-catalog/skills'
/** Fallback category id used when a skill has no explicit category. */
export const DEFAULT_CATEGORY_ID = 'uncategorized'
/** Matches category folder names such as `(frontend)` or `(quality-tools)`. */
export const CATEGORY_FOLDER_PATTERN = /^\(([a-z][a-z0-9-]*)\)$/
/** File that stores category metadata overrides inside the skills catalog. */
export const CATEGORY_METADATA_FILE = '_category.json'

/**
 * Default category object used when no category metadata is available.
 *
 * @example
 * ```ts
 * DEFAULT_CATEGORY.id // 'uncategorized'
 * ```
 */
export const DEFAULT_CATEGORY: CategoryInfo = {
  id: DEFAULT_CATEGORY_ID,
  name: 'Uncategorized',
  description: 'Skills without a specific category',
  priority: 999,
}

/** Package name for the CLI distribution. */
export const PACKAGE_NAME = '@tech-leads-club/agent-skills'
/** Package name for the published skills catalog. */
export const SKILLS_CATALOG_PACKAGE = '@tech-leads-club/skills-catalog'
/** Project directory used to store agent-specific state. */
export const AGENTS_DIR = '.agents'
/** Canonical directory that stores local skill sources. */
export const CANONICAL_SKILLS_DIR = 'skills'
/** Lockfile name used to track installed skills. */
export const LOCK_FILE = '.skill-lock.json'
/** Backup filename created during atomic lockfile writes. */
export const LOCK_FILE_BACKUP = '.skill-lock.json.backup'
/** Global configuration directory stored in the user home directory. */
export const GLOBAL_CONFIG_DIR = '.agent-skills'
/** Audit log filename stored under the global config directory. */
export const AUDIT_LOG_FILE = 'audit.log'
/** Base cache directory relative to the user home directory. */
export const CACHE_BASE_DIR = '.cache'
/** Namespace folder nested under the base cache directory. */
export const CACHE_NAMESPACE = 'agent-skills'
/** Skills cache subdirectory name. */
export const SKILLS_SUBDIR = 'skills'
/** Filename for the cached registry payload. */
export const REGISTRY_CACHE_FILENAME = 'registry.json'
/** Filename for per-skill cache metadata. */
export const SKILL_META_FILE = '.skill-meta.json'
/** Registry cache time-to-live in milliseconds. */
export const REGISTRY_CACHE_TTL_MS = 24 * 60 * 60 * 1000
/** HTTP fetch timeout in milliseconds for registry and skill downloads. */
export const FETCH_TIMEOUT_MS = 15_000
/** Maximum number of HTTP retries for registry and skill downloads. */
export const MAX_RETRIES = 3
/** Initial retry delay in milliseconds before exponential backoff. */
export const RETRY_BASE_DELAY_MS = 500
/** Maximum number of concurrent file downloads per skill install. */
export const MAX_CONCURRENT_DOWNLOADS = 10
