import type { AllowedScopesSetting, LifecycleScope } from '../../shared/types'

const SCOPE_OPTIONS_BY_SETTING: Readonly<Record<AllowedScopesSetting, LifecycleScope[]>> = {
  all: ['local', 'global'],
  global: ['global'],
  local: ['local'],
  none: [],
}

const SCOPE_LABELS: Readonly<Record<LifecycleScope, string>> = {
  local: 'Local',
  global: 'Global',
}

function getVisibleScopes(allowedScopes: AllowedScopesSetting, currentScope: LifecycleScope): LifecycleScope[] {
  const configuredScopes = SCOPE_OPTIONS_BY_SETTING[allowedScopes]
  return configuredScopes.length > 0 ? configuredScopes : [currentScope]
}

export interface ScopeSelectorProps {
  value: LifecycleScope
  onChange: (scope: LifecycleScope) => void
  allowedScopes?: AllowedScopesSetting
  disabled?: boolean
  disabledReason?: string
}

/**
 * Scope dropdown used to switch between local and global install contexts.
 *
 * @param props - Current scope, policy-constrained options, and disabled metadata.
 * @returns Scope selector control anchored to the home page footer.
 */
export function ScopeSelector({
  value,
  onChange,
  allowedScopes = 'all',
  disabled = false,
  disabledReason,
}: ScopeSelectorProps) {
  const visibleScopes = getVisibleScopes(allowedScopes, value)
  const selectedScope = visibleScopes.includes(value) ? value : visibleScopes[0]
  const isDisabled = disabled || allowedScopes === 'none'

  return (
    <div className="scope-selector">
      <label htmlFor="scope-selector" className="sr-only">
        Installation scope
      </label>
      <select
        id="scope-selector"
        className="scope-selector-input"
        value={selectedScope}
        onChange={(event) => {
          const nextScope = event.target.value as LifecycleScope
          if (visibleScopes.includes(nextScope)) {
            onChange(nextScope)
          }
        }}
        disabled={isDisabled}
        title={isDisabled && disabledReason ? disabledReason : undefined}
      >
        {visibleScopes.map((scopeOption) => (
          <option key={scopeOption} value={scopeOption}>
            {SCOPE_LABELS[scopeOption]}
          </option>
        ))}
      </select>
    </div>
  )
}
