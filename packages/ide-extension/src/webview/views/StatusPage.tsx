import type { OperationState } from '../hooks/useOperations'

/**
 * Result of a completed batch operation.
 */
export interface BatchResult {
  success: boolean
  failedSkills?: string[]
  errorMessage?: string
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
            {batchResult.success ? (
              <p className="status-success">
                <span className="codicon codicon-check" aria-hidden="true" />
                All operations completed successfully.
              </p>
            ) : (
              <div className="status-failure">
                <p>
                  <span className="codicon codicon-error" aria-hidden="true" />
                  {batchResult.errorMessage ?? 'Some operations failed.'}
                </p>
                {batchResult.failedSkills && batchResult.failedSkills.length > 0 && (
                  <p>Failed skills: {batchResult.failedSkills.join(', ')}</p>
                )}
              </div>
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
