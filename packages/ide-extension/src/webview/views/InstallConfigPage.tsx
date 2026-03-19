import type { ActionRequest, InstallMethod, LifecycleScope } from '../../shared/types'

/**
 * Props for the InstallConfigPage component.
 */
export interface InstallConfigPageProps {
  /** Selected skill names. */
  selectedSkills: string[]
  /** Selected agent identifiers. */
  selectedAgents: string[]
  /** Target scope (local, global, or all). */
  scope: ActionRequest['scope']
  /** Currently selected install method. */
  method: InstallMethod
  /** Effective scopes from policy (workspaceOnly). */
  effectiveScopes: LifecycleScope[]
  /** Whether a background operation is running. */
  isProcessing: boolean
  /** Callback when install method changes. */
  onMethodChange: (method: InstallMethod) => void
  /** Callback when scope changes. */
  onScopeChange: (scope: ActionRequest['scope']) => void
  /** Callback to cancel and return to dashboard. */
  onCancel: () => void
  /** Callback to go back to skills selection. */
  onBack: () => void
  /** Callback to confirm and start installation. */
  onConfirm: () => void
}

/**
 * Install configuration page: method (copy/symlink), scope confirmation, and validation before submit.
 *
 * @param props - Config state and callbacks.
 * @returns Install config view.
 */
export function InstallConfigPage({
  selectedSkills,
  selectedAgents,
  scope,
  method,
  effectiveScopes,
  isProcessing,
  onMethodChange,
  onScopeChange,
  onCancel,
  onBack,
  onConfirm,
}: InstallConfigPageProps) {
  return (
    <section className="select-page" aria-label="Install configuration">
      <header className="select-page-header">
        <button type="button" className="icon-button" onClick={onBack} aria-label="Back to skills">
          <span className="codicon codicon-arrow-left" aria-hidden="true" />
        </button>
        <div>
          <h1>Install: Configuration</h1>
          <p>Choose scope, method, and confirm installation.</p>
        </div>
      </header>

      <div className="install-config-content">
        <fieldset className="install-config-fieldset">
          <legend>Scope</legend>
          {effectiveScopes.includes('local') && (
            <label className="install-config-radio">
              <input
                type="radio"
                name="installScope"
                value="local"
                checked={scope === 'local'}
                onChange={() => onScopeChange('local')}
                disabled={isProcessing}
              />
              <span>
                <strong>Local (project)</strong> — Installed in workspace .agents directory.
              </span>
            </label>
          )}
          {effectiveScopes.includes('global') && (
            <label className="install-config-radio">
              <input
                type="radio"
                name="installScope"
                value="global"
                checked={scope === 'global'}
                onChange={() => onScopeChange('global')}
                disabled={isProcessing}
              />
              <span>
                <strong>Global (user)</strong> — Installed in user home directory.
              </span>
            </label>
          )}
        </fieldset>

        <fieldset className="install-config-fieldset">
          <legend>Install method</legend>
          <label className="install-config-radio">
            <input
              type="radio"
              name="installMethod"
              value="copy"
              checked={method === 'copy'}
              onChange={() => onMethodChange('copy')}
              disabled={isProcessing}
            />
            <span>
              <strong>Copy</strong> — Files are copied to the agent directory. Works everywhere.
            </span>
          </label>
          <label className="install-config-radio">
            <input
              type="radio"
              name="installMethod"
              value="symlink"
              checked={method === 'symlink'}
              onChange={() => onMethodChange('symlink')}
              disabled={isProcessing}
            />
            <span>
              <strong>Symlink</strong> — Creates links to the cache. Saves disk space; may fail on some systems.
            </span>
          </label>
        </fieldset>

        <div className="install-config-summary">
          <p>
            <strong>Skills:</strong> {selectedSkills.length} selected
          </p>
          <p>
            <strong>Agents:</strong> {selectedAgents.length} selected
          </p>
        </div>
      </div>

      <footer className="select-page-footer">
        <div className="select-page-footer-actions">
          <button type="button" className="secondary-footer-button" onClick={onCancel} disabled={isProcessing}>
            Cancel
          </button>
          <button
            type="button"
            className="primary-footer-button primary-footer-button--install"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? 'Installing...' : 'Install'}
          </button>
        </div>
      </footer>
    </section>
  )
}
