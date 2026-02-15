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
}

export interface AvailableAgent {
  agent: string
  displayName: string
}

/**
 * Type of lifecycle operation being performed.
 */
export type OperationType = 'install' | 'remove' | 'update'
