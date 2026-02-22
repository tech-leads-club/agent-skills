import type { LifecycleScope } from '../../shared/types'

export interface ScopeSelectorProps {
  value: LifecycleScope
  onChange: (scope: LifecycleScope) => void
  disabled?: boolean
  disabledReason?: string
}

/**
 * Scope dropdown used to switch between local and global install contexts.
 *
 * @param props - Current scope, change handler, and disabled state metadata.
 * @returns Scope selector control anchored to the home page footer.
 */
export function ScopeSelector({ value, onChange, disabled = false, disabledReason }: ScopeSelectorProps) {
  return (
    <div className="scope-selector">
      <label htmlFor="scope-selector" className="scope-selector-label">
        Scope
      </label>
      <select
        id="scope-selector"
        className="scope-selector-input"
        value={value}
        onChange={(event) => onChange(event.target.value as LifecycleScope)}
        disabled={disabled}
        title={disabled && disabledReason ? disabledReason : undefined}
        aria-label="Installation scope"
      >
        <option value="local">Local</option>
        <option value="global">Global</option>
      </select>
    </div>
  )
}
