import { AllowedScopesSetting, BlockedReason, LifecycleScope, ScopePolicyEvaluation } from '../shared/types'

/**
 * Service that evaluates scope policy based on user settings and workspace environment.
 * Implements deterministic precedence: Workspace Trust/Presence -> Policy -> Effective Scope.
 */
export class ScopePolicyService {
  /**
   * Evaluates the effective scopes based on configuration and environment.
   *
   * @param input - Configuration and environment state.
   * @returns The evaluated policy result including effective scopes and blocked reasons.
   */
  public evaluate(input: {
    allowedScopes: AllowedScopesSetting
    isWorkspaceTrusted: boolean
    hasWorkspaceFolder: boolean
  }): ScopePolicyEvaluation {
    const policyMapper: Record<AllowedScopesSetting, LifecycleScope[]> = {
      all: ['local', 'global'],
      global: ['global'],
      local: ['local'],
      none: [],
    }

    // 1. Environment Constraints
    // trusted + workspace -> {local, global}
    // untrusted OR no workspace -> {global}
    const environmentScopes: LifecycleScope[] =
      input.isWorkspaceTrusted && input.hasWorkspaceFolder ? ['local', 'global'] : ['global']

    // 2. Policy Constraints
    const policyScopes = policyMapper[input.allowedScopes]

    // 3. Effective Scopes (Intersection)
    const effectiveScopes = environmentScopes.filter((scope) => policyScopes.includes(scope))

    // 4. Blocked Reason
    let blockedReason: BlockedReason | undefined

    if (effectiveScopes.length === 0) {
      if (input.allowedScopes === 'none') {
        blockedReason = 'policy-none'
      } else if (input.allowedScopes === 'local') {
        // Local was requested but not available in environment
        if (!input.isWorkspaceTrusted) {
          blockedReason = 'workspace-untrusted'
        } else if (!input.hasWorkspaceFolder) {
          blockedReason = 'workspace-missing'
        } else {
          // Fallback, though logically unreachable if logic above holds
          blockedReason = 'local-disallowed-by-environment'
        }
      }
    }

    return {
      allowedScopes: input.allowedScopes,
      environmentScopes,
      effectiveScopes,
      blockedReason,
    }
  }
}
