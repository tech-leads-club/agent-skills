import type { OperationState } from '../hooks/useOperations'

/**
 * Single result line for CLI-style display.
 */
export interface BatchResultLine {
  skillName: string
  success: boolean
  errorMessage?: string
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
  /** In-flight operations with progress. */
  operations: Map<string, OperationState>
  /** Result of the last completed batch, if any. */
  batchResult: BatchResult | null
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
function formatResultLine(
  line: BatchResultLine,
  action?: 'install' | 'remove' | 'update',
): string {
  if (line.success) {
    switch (action) {
      case 'update':
        return line.skillName === 'all' ? 'All skills updated' : `Updated ${line.skillName}`
      case 'remove':
        return `${line.skillName}: Removed`
      case 'install':
        return line.skillName === 'install (batch)' ? 'Installed' : `Installed ${line.skillName}`
      default:
        return line.skillName === 'all' ? 'All skills updated' : line.skillName
    }
  }
  switch (action) {
    case 'update':
      return `Failed to update ${line.skillName}: ${line.errorMessage ?? 'Unknown error'}`
    case 'remove':
      return `${line.skillName}: Failed to remove - ${line.errorMessage ?? 'Unknown error'}`
    case 'install':
      return `${line.skillName}: Failed to install - ${line.errorMessage ?? 'Unknown error'}`
    default:
      return `${line.skillName}: ${line.errorMessage ?? 'Failed'}`
  }
}

export function StatusPage({ isProcessing, operations, batchResult, onRetry, onDone }: StatusPageProps) {
  const operationList = Array.from(operations.values())
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
        {isProcessing && operationList.length > 0 && (
          <div className="status-progress" role="status">
            <ul className="status-progress-list" aria-label="Active operations">
              {operationList.map((op) => (
                <li key={op.operationId}>
                  <span className="codicon codicon-loading codicon-modifier-spin" aria-hidden="true" />
                  <span>
                    {op.operation} {op.skillName}: {op.message}
                  </span>
                </li>
              ))}
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
          >
            Back to Dashboard
          </button>
        </div>
      </footer>
    </section>
  )
}
