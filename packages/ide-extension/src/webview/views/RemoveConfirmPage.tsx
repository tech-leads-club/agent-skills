import type { ActionRequest } from '../../shared/types'

/**
 * Props for the RemoveConfirmPage component.
 */
export interface RemoveConfirmPageProps {
  /** Selected skill names. */
  selectedSkills: string[]
  /** Selected agent identifiers. */
  selectedAgents: string[]
  /** Target scope for removal. */
  scope: ActionRequest['scope']
  /** Whether removal is in progress. */
  isProcessing: boolean
  /** Callback to go back to skills selection. */
  onBack: () => void
  /** Callback to confirm and execute removal. */
  onConfirm: () => void
}

/**
 * Remove confirmation page: summary and confirm button.
 *
 * @param props - Remove context and callbacks.
 * @returns Remove confirm view.
 */
export function RemoveConfirmPage({
  selectedSkills,
  selectedAgents,
  scope,
  isProcessing,
  onBack,
  onConfirm,
}: RemoveConfirmPageProps) {
  const scopeLabel =
    scope === 'local' ? 'Local (project)' : scope === 'global' ? 'Global (user)' : 'Local and global'

  return (
    <section className="select-page" aria-label="Remove confirmation">
      <header className="select-page-header">
        <button type="button" className="icon-button" onClick={onBack} aria-label="Back to skills">
          <span className="codicon codicon-arrow-left" aria-hidden="true" />
        </button>
        <div>
          <h1>Remove: Confirmation</h1>
          <p>Review and confirm removal of the selected skills.</p>
        </div>
      </header>

      <div className="install-config-content">
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
            Cancel
          </button>
          <button
            type="button"
            className="primary-footer-button primary-footer-button--uninstall"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </footer>
    </section>
  )
}
