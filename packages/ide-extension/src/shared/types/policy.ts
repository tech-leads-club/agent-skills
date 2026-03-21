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
