import type { InstallMethod, LifecycleScope } from '../../shared/types'

/**
 * Props for the InstallConfigPage component.
 */
export interface InstallConfigPageProps {
  /** Selected skill names. */
  selectedSkills: string[]
  /** Selected agent identifiers. */
  selectedAgents: string[]
  /** Target scope (local or global). */
  scope: LifecycleScope
  /** Currently selected install method. */
  method: InstallMethod
  /** Whether a background operation is running. */
  isProcessing: boolean
  /** Callback when install method changes. */
  onMethodChange: (method: InstallMethod) => void
  /** Callback to go back to agent selection. */
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
  isProcessing,
  onMethodChange,
  onBack,
  onConfirm,
}: InstallConfigPageProps) {
  const scopeLabel = scope === 'local' ? 'Local (project)' : 'Global (user)'

  return (
    <section className="select-page" aria-label="Install configuration">
      <header className="select-page-header">
        <button type="button" className="icon-button" onClick={onBack} aria-label="Back to agents">
          <span className="codicon codicon-arrow-left" aria-hidden="true" />
        </button>
        <div>
          <h1>Install: Configuration</h1>
          <p>Choose how skills will be installed.</p>
        </div>
      </header>

      <div className="install-config-content">
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
            <strong>Scope:</strong> {scopeLabel}
          </p>
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
          <button type="button" className="secondary-footer-button" onClick={onBack} disabled={isProcessing}>
            Back
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
