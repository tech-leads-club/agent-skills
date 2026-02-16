/**
 * Shared type definitions for the Agent Skills registry.
 * These interfaces match the structure of skills-registry.json from the CDN.
 * Imported by both Extension Host (esbuild) and Webview (Vite).
 */

/**
 * Category metadata for organizing skills.
 */
export interface Category {
  name: string
  description: string
}

/**
 * Individual skill entry in the registry.
 */
export interface Skill {
  name: string
  description: string
  category: string // Key into SkillRegistry.categories
  path: string
  files: string[]
  author?: string // Optional
  version?: string // Optional
  contentHash: string
}

/**
 * Complete skills registry structure from the CDN.
 */
export interface SkillRegistry {
  version: string
  categories: Record<string, Category>
  skills: Skill[]
}

/**
 * Map of skill name → installation metadata.
 * A skill can be installed locally, globally, or both independently.
 * null value means the skill is not installed in any scope.
 */
export type InstalledSkillsMap = Record<string, InstalledSkillInfo | null>

/**
 * Installation metadata for a single skill.
 * Tracks installation across multiple agents and scopes.
 */
export interface InstalledSkillInfo {
  local: boolean // true if installed in the current workspace (any agent)
  global: boolean // true if installed in the global home directory (any agent)
  agents: AgentInstallInfo[] // Per-agent installation details
  contentHash?: string // From lockfile, used for update detection
  installedAt?: string // ISO timestamp
  updatedAt?: string // ISO timestamp
}

/**
 * Per-agent installation details with scope granularity.
 */
export interface AgentInstallInfo {
  agent: string // AgentType identifier (e.g., 'cursor', 'claude-code')
  displayName: string // Human-readable name (e.g., 'Cursor', 'Claude Code')
  local: boolean // installed in this agent's local skillsDir
  global: boolean // installed in this agent's globalSkillsDir
  corrupted: boolean // NEW: true if dir exists but SKILL.md missing
}

/**
 * Represents an agent that can host skills, used for filtering and selections.
 */
export interface AvailableAgent {
  agent: string
  displayName: string
}

/**
 * Type of lifecycle operation being performed.
 */
export type OperationType = 'install' | 'remove' | 'update' | 'repair'

/**
 * CLI health status result from CliHealthChecker.
 */
export type CliHealthStatus =
  | { status: 'ok'; version: string }
  | { status: 'outdated'; version: string; minVersion: string }
  | { status: 'cli-missing' }
  | { status: 'npx-missing' }
  | { status: 'unknown'; error: string }

/**
 * Classified error information from ErrorClassifier.
 */
export interface ErrorInfo {
  category: ErrorCategory
  message: string // User-friendly message
  retryable: boolean // Whether the operation should be retried
  action?: {
    // Optional action button
    label: string // Button label (e.g., "Install CLI")
    command: string // Command to run
  }
}

/**
 * Known error categories for classification.
 */
export type ErrorCategory =
  | 'cancelled' // SIGTERM — user cancelled
  | 'terminated' // SIGKILL — unexpected kill
  | 'file-locked' // EPERM/EBUSY — Windows file locking
  | 'npx-missing' // npx not in PATH
  | 'disk-full' // ENOSPC
  | 'permission-denied' // EACCES
  | 'cli-missing' // MODULE_NOT_FOUND
  | 'cli-error' // Generic non-zero exit
  | 'unknown' // Unclassified error

/**
 * Result of post-install verification.
 */
export interface VerifyResult {
  ok: boolean
  corrupted: Array<{
    agent: string
    scope: 'local' | 'global'
    expectedPath: string
  }>
}
