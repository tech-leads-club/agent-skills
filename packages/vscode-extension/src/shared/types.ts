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
  category: string
  path: string
  files: string[]
  author?: string
  version?: string
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
  local: boolean
  global: boolean
  agents: AgentInstallInfo[]
  contentHash?: string
  installedAt?: string
  updatedAt?: string
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
 * Client-side view routing.
 */
export type ViewRoute = 'home' | 'selectSkills' | 'selectAgents'

/**
 * Actions that navigate to skill selection.
 */
export type WebviewAction = 'install' | 'uninstall'

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
  message: string
  retryable: boolean
  action?: {
    label: string
    command: string
  }
}

/**
 * Known error categories for classification.
 */
export type ErrorCategory =
  | 'cancelled'
  | 'terminated'
  | 'file-locked'
  | 'npx-missing'
  | 'disk-full'
  | 'permission-denied'
  | 'cli-missing'
  | 'cli-error'
  | 'unknown'

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

/**
 * Configuration values for the agentSkills.scopes.allowedScopes setting.
 */
export type AllowedScopesSetting = 'all' | 'global' | 'local' | 'none'

/**
 * Normalized scope values used in policy evaluation.
 */
export type LifecycleScope = 'local' | 'global'

/**
 * Reasons why lifecycle operations might be blocked.
 */
export type BlockedReason =
  | 'policy-none'
  | 'workspace-untrusted'
  | 'workspace-missing'
  | 'local-disallowed-by-environment'

/**
 * Result of a scope policy evaluation.
 */
export interface ScopePolicyEvaluation {
  allowedScopes: AllowedScopesSetting
  environmentScopes: LifecycleScope[]
  effectiveScopes: LifecycleScope[]
  blockedReason?: BlockedReason
}

/**
 * Extended scope values used in batch planning and metadata.
 */
export type LifecycleScopeHint = LifecycleScope | 'all' | 'auto'

/**
 * Intent representing a batch lifecycle request originating from UI selections.
 */
export interface LifecycleBatchSelection {
  action: OperationType
  skills: string[]
  agents?: string[]
  scope: LifecycleScopeHint
  source: 'card' | 'command-palette'
  updateAll?: boolean
}

/**
 * Metadata preserved on queued jobs for grouped feedback.
 */
export interface OperationBatchMetadata {
  batchId: string
  batchSize: number
  skillNames: string[]
  scope: LifecycleScopeHint
  agents: string[]
}
