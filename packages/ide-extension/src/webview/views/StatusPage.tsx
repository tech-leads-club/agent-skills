import type { LifecycleScope } from '../../shared/types'

/**
 * Single result line for CLI-style display.
 */
export interface BatchResultLine {
  skillName: string
  success: boolean
  scope?: LifecycleScope
  errorMessage?: string
  message?: string
}

export interface StatusLogEntry {
  operation: 'install' | 'remove' | 'update'
  skillName: string
  scope?: LifecycleScope
  message: string
  severity: 'info' | 'warn' | 'error'
}

/**
 * Result of a completed batch operation.
 */
export interface BatchResult {
  success: boolean
  failedSkills?: string[]
  errorMessage?: string
  results?: BatchResultLine[]
  action?: 'install' | 'remove' | 'update'
}

/**
 * Props for the StatusPage component.
 */
export interface StatusPageProps {
  /** Whether a batch is currently running. */
  isProcessing: boolean
  /** Current action step reported by the host. */
  currentStep: string | null
  /** Real-time log timeline during batch execution. */
  logTimeline: StatusLogEntry[]
  /** Result of the last completed batch, if any. */
  batchResult: BatchResult | null
  /** Visible rejection feedback when a concurrent action was denied. */
  rejectionMessage?: string | null
  /** Callback to retry failed items only. */
  onRetry?: () => void
  /** Callback to return to dashboard. */
  onDone: () => void
}

/**
 * Status page: real-time progress and final results (success/failure per skill/agent).
 *
 * @param props - Status state and callbacks.
 * @returns Status view.
 */
function formatResultLine(line: BatchResultLine, action?: 'install' | 'remove' | 'update'): string {
  if (line.message) {
    return line.message
  }

  const scopeLabel = line.scope ? ` (${line.scope})` : ''
  if (line.success) {
    switch (action) {
      case 'update':
        return line.skillName === 'all' ? 'All skills updated' : `Updated ${line.skillName}${scopeLabel}`
      case 'remove':
        return `${line.skillName}${scopeLabel}: Removed`
      case 'install':
        return line.skillName === 'install (batch)' ? 'Installed' : `Installed ${line.skillName}${scopeLabel}`
      default:
        return line.skillName === 'all' ? 'All skills updated' : line.skillName
    }
  }
  switch (action) {
    case 'update':
      return `Failed to update ${line.skillName}${scopeLabel}: ${line.errorMessage ?? 'Unknown error'}`
    case 'remove':
      return `${line.skillName}${scopeLabel}: Failed to remove - ${line.errorMessage ?? 'Unknown error'}`
    case 'install':
      return `${line.skillName}${scopeLabel}: Failed to install - ${line.errorMessage ?? 'Unknown error'}`
    default:
      return `${line.skillName}: ${line.errorMessage ?? 'Failed'}`
  }
}

export function StatusPage({
  isProcessing,
  currentStep,
  logTimeline,
  batchResult,
  rejectionMessage,
  onRetry,
  onDone,
}: StatusPageProps) {
  const hasFailures =
    !isProcessing &&
    batchResult &&
    !batchResult.success &&
    batchResult.failedSkills &&
    batchResult.failedSkills.length > 0

  return (
    <section className="select-page status-page" aria-label="Operation status">
      <header className="select-page-header">
        <div>
          <h1>{isProcessing ? 'Operation in progress' : 'Operation complete'}</h1>
          <p>{isProcessing ? 'Please wait while skills are being processed.' : 'Review the results below.'}</p>
        </div>
      </header>

      <div className="status-page-content">
        {rejectionMessage && (
          <div className="status-result" role="alert">
            <p className="status-result-line">
              <span className="status-icon status-icon--warn codicon codicon-warning" aria-hidden="true" />
              <span>{rejectionMessage}</span>
            </p>
          </div>
        )}

        {isProcessing && logTimeline.length > 0 && (
          <div className="status-log-timeline" role="log" aria-live="polite">
            <ul className="status-log-timeline-list">
              {logTimeline.map((entry, idx) => (
                <li
                  key={`${entry.operation}-${entry.skillName}-${entry.scope ?? 'all'}-${idx}`}
                  className={`status-log-entry status-log-entry--${entry.severity}`}
                >
                  {entry.severity === 'error' && (
                    <span className="status-icon status-icon--error codicon codicon-close" aria-hidden="true" />
                  )}
                  {entry.severity === 'warn' && (
                    <span className="status-icon status-icon--warn codicon codicon-warning" aria-hidden="true" />
                  )}
                  {entry.severity === 'info' && (
                    <span className="status-icon status-icon--info codicon codicon-info" aria-hidden="true" />
                  )}
                  <span>
                    {entry.operation} {entry.skillName}
                    {entry.scope ? ` (${entry.scope})` : ''}: {entry.message}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isProcessing && currentStep && logTimeline.length === 0 && (
          <div className="status-progress" role="status">
            <ul className="status-progress-list" aria-label="Active operations">
              <li>
                <span className="codicon codicon-loading codicon-modifier-spin" aria-hidden="true" />
                <span>{currentStep}</span>
              </li>
            </ul>
          </div>
        )}

        {!isProcessing && batchResult && (
          <div className="status-result" role="status">
            {batchResult.results && batchResult.results.length > 0 ? (
              <ul className="status-result-list">
                {batchResult.results.map((line, idx) => (
                  <li key={`${line.skillName}-${idx}`} className="status-result-line">
                    {line.success ? (
                      <>
                        <span className="status-icon status-icon--success codicon codicon-check" aria-hidden="true" />
                        <span>{formatResultLine(line, batchResult.action)}</span>
                      </>
                    ) : (
                      <>
                        <span className="status-icon status-icon--error codicon codicon-close" aria-hidden="true" />
                        <span>{formatResultLine(line, batchResult.action)}</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : batchResult.success ? (
              <p className="status-result-line">
                <span className="status-icon status-icon--success codicon codicon-check" aria-hidden="true" />
                <span>All operations completed successfully.</span>
              </p>
            ) : (
              <p className="status-result-line">
                <span className="status-icon status-icon--error codicon codicon-close" aria-hidden="true" />
                <span>{batchResult.errorMessage ?? 'Some operations failed.'}</span>
              </p>
            )}
          </div>
        )}
      </div>

      <footer className="select-page-footer">
        <div className="select-page-footer-actions">
          {hasFailures && onRetry && (
            <button type="button" className="secondary-footer-button" onClick={onRetry}>
              Try again
            </button>
          )}
          <button
            type="button"
            className="primary-footer-button"
            onClick={onDone}
            disabled={isProcessing}
            title={isProcessing ? 'Wait for the operation to complete' : undefined}
          >
            Back to Dashboard
          </button>
        </div>
      </footer>
    </section>
  )
}
