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
   *
   * @example
   * ```typescript
   * const policy = new ScopePolicyService().evaluate({
   *   allowedScopes: 'all',
   *   isWorkspaceTrusted: true,
   *   hasWorkspaceFolder: true,
   * });
   * console.log(policy.effectiveScopes); // ['local', 'global']
   * ```
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

    const environmentScopes: LifecycleScope[] =
      input.isWorkspaceTrusted && input.hasWorkspaceFolder ? ['local', 'global'] : ['global']

    const policyScopes = policyMapper[input.allowedScopes]

    const effectiveScopes = environmentScopes.filter((scope) => policyScopes.includes(scope))

    let blockedReason: BlockedReason | undefined

    if (effectiveScopes.length === 0) {
      if (input.allowedScopes === 'none') {
        blockedReason = 'policy-none'
      } else if (input.allowedScopes === 'local') {
        if (!input.isWorkspaceTrusted) {
          blockedReason = 'workspace-untrusted'
        } else if (!input.hasWorkspaceFolder) {
          blockedReason = 'workspace-missing'
        } else {
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
