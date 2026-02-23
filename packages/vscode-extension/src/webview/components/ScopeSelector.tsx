import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { AllowedScopesSetting, LifecycleScope } from '../../shared/types'
import { getState, setState } from '../lib/vscode-api'

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

const SCOPE_SELECTOR_STATE_KEY = 'scopeSelectorState'

/**
 * Structure of the state persisted to VS Code's webview API.
 */
interface PersistedWebviewState {
  [SCOPE_SELECTOR_STATE_KEY]?: {
    selectedScope: LifecycleScope
  }
  [key: string]: unknown
}

/**
 * Type guard for LifecycleScope.
 *
 * @param scope - Unknown value to check.
 * @returns True if value is a valid LifecycleScope.
 */
function isLifecycleScope(scope: unknown): scope is LifecycleScope {
  return scope === 'local' || scope === 'global'
}

/**
 * Reads the previously selected scope from persisted state.
 *
 * @returns The persisted scope or null if none/invalid.
 */
function readPersistedScope(): LifecycleScope | null {
  const persistedState = getState<PersistedWebviewState>()
  const persistedScope = persistedState?.[SCOPE_SELECTOR_STATE_KEY]?.selectedScope
  return isLifecycleScope(persistedScope) ? persistedScope : null
}

/**
 * Saves the selected scope to persisted state.
 *
 * @param selectedScope - The scope to persist.
 */
function persistSelectedScope(selectedScope: LifecycleScope): void {
  const persistedState = getState<PersistedWebviewState>() ?? {}
  setState<PersistedWebviewState>({
    ...persistedState,
    [SCOPE_SELECTOR_STATE_KEY]: {
      selectedScope,
    },
  })
}

/**
 * Props for the ScopeSelector component.
 */
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
 * @returns Scope selector control anchored to the home page footer, or null when policy disallows all scopes.
 */
export function ScopeSelector({
  value,
  onChange,
  allowedScopes = 'all',
  disabled = false,
  disabledReason,
}: ScopeSelectorProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const hasAppliedPersistedScopeRef = useRef(false)
  const labelId = useId()
  const menuId = useId()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const visibleScopes = SCOPE_OPTIONS_BY_SETTING[allowedScopes]
  const selectedScope = visibleScopes.includes(value) ? value : (visibleScopes[0] ?? 'global')
  const isDisabled = disabled

  useEffect(() => {
    if (!isMenuOpen) {
      return
    }

    const handleDocumentPointerDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node) || !wrapperRef.current?.contains(target)) {
        setIsMenuOpen(false)
      }
    }

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleDocumentPointerDown)
    document.addEventListener('keydown', handleDocumentKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleDocumentPointerDown)
      document.removeEventListener('keydown', handleDocumentKeyDown)
    }
  }, [isMenuOpen])

  useEffect(() => {
    if (isDisabled && isMenuOpen) {
      setIsMenuOpen(false)
    }
  }, [isDisabled, isMenuOpen])

  useEffect(() => {
    if (isDisabled || visibleScopes.length === 0) {
      return
    }

    if (allowedScopes === 'all' && !hasAppliedPersistedScopeRef.current) {
      hasAppliedPersistedScopeRef.current = true
      const persistedScope = readPersistedScope()
      if (persistedScope && persistedScope !== selectedScope && visibleScopes.includes(persistedScope)) {
        onChange(persistedScope)
        return
      }
    }

    persistSelectedScope(selectedScope)
  }, [allowedScopes, isDisabled, onChange, selectedScope, visibleScopes])

  if (visibleScopes.length === 0) {
    return null
  }

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (isDisabled) {
      return
    }

    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setIsMenuOpen(true)
    }
  }

  const handleOptionSelect = (nextScope: LifecycleScope) => {
    if (visibleScopes.includes(nextScope)) {
      onChange(nextScope)
    }

    setIsMenuOpen(false)
  }

  return (
    <div className="scope-selector">
      <span id={labelId} className="sr-only">
        Installation scope
      </span>
      <div
        className={`scope-selector-input-wrapper${isMenuOpen ? ' scope-selector-input-wrapper--open' : ''}`}
        ref={wrapperRef}
      >
        <button
          id="scope-selector"
          className="scope-selector-input"
          type="button"
          aria-labelledby={labelId}
          aria-haspopup="listbox"
          aria-expanded={isMenuOpen}
          aria-controls={menuId}
          onClick={() => {
            if (!isDisabled) {
              setIsMenuOpen((open) => !open)
            }
          }}
          onKeyDown={handleTriggerKeyDown}
          disabled={isDisabled}
          title={isDisabled && disabledReason ? disabledReason : undefined}
        >
          <span className="scope-selector-chevron codicon codicon-chevron-down" aria-hidden="true" />
          <span className="scope-selector-value">{SCOPE_LABELS[selectedScope]}</span>
        </button>

        {isMenuOpen && !isDisabled && (
          <div id={menuId} className="scope-selector-menu" role="listbox" aria-label="Installation scope">
            {visibleScopes.map((scopeOption) => (
              <button
                key={scopeOption}
                type="button"
                role="option"
                aria-selected={scopeOption === selectedScope}
                className={`scope-selector-option${scopeOption === selectedScope ? ' scope-selector-option--selected' : ''}`}
                onClick={() => handleOptionSelect(scopeOption)}
              >
                {SCOPE_LABELS[scopeOption]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
