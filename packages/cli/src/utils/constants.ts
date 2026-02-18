// Package metadata
export const PACKAGE_NAME = '@tech-leads-club/agent-skills'
export const SKILLS_CATALOG_PACKAGE = '@tech-leads-club/skills-catalog'

// Directory and file paths
export const CONFIG_DIR = '.agent-skills'
export const CACHE_FILE = 'cache.json'
export const CONFIG_FILE = 'config.json'
export const SKILL_META_FILE = '.skill-meta.json'

// Project structure
export const AGENTS_DIR = '.agents'
export const CANONICAL_SKILLS_DIR = 'skills'
export const LOCK_FILE = '.skill-lock.json'
export const LOCK_FILE_BACKUP = '.skill-lock.json.backup'

// Global configuration
export const GLOBAL_CONFIG_DIR = '.agent-skills'
export const AUDIT_LOG_FILE = 'audit.log'

// Cache directory structure
export const CACHE_BASE_DIR = '.cache'
export const CACHE_NAMESPACE = 'agent-skills'
export const SKILLS_SUBDIR = 'skills'
export const REGISTRY_CACHE_FILENAME = 'registry.json'

// Cache settings
export const UPDATE_CHECK_CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

// Registry/CDN settings
export const REGISTRY_CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
export const FETCH_TIMEOUT_MS = 15_000
export const MAX_RETRIES = 3
export const RETRY_BASE_DELAY_MS = 500
export const MAX_CONCURRENT_DOWNLOADS = 10

// Versioning
export const CURRENT_CONFIG_VERSION = '1.0.0'
