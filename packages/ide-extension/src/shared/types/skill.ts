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
  category: string
  path: string
  files: string[]
  author?: string
  version?: string
  contentHash: string
}

/**
 * Complete skills registry structure from the CDN.
 * Used by Install (skill picker), Update (updatable list), Remove (installed list).
 */
export interface SkillRegistry {
  version: string
  categories: Record<string, Category>
  skills: Skill[]
}

/**
 * Map of skill name -> installation metadata.
 * A skill can be installed locally, globally, or both independently.
 * null value means the skill is not installed in any scope.
 * Supports Install, Update, and Remove flows (scoped by local/global).
 */
export type InstalledSkillsMap = Record<string, InstalledSkillInfo | null>

/**
 * Installation metadata for a single skill.
 * Tracks installation across multiple agents and scopes.
 */
export interface InstalledSkillInfo {
  local: boolean
  global: boolean
  agents: AgentInstallInfo[]
  contentHash?: string
  scopeHashes?: InstalledScopeHashes
  installedAt?: string
  updatedAt?: string
}

export interface InstalledScopeHashes {
  local?: string
  global?: string
}

/**
 * Per-agent installation details with scope granularity.
 */
export interface AgentInstallInfo {
  agent: string
  displayName: string
  local: boolean
  global: boolean
  corrupted: boolean
}

/**
 * Represents an agent that can host skills, used for filtering and selections.
 */
export interface AvailableAgent {
  agent: string
  displayName: string
  company: string
}

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
