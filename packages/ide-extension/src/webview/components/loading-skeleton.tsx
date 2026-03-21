/**
 * Placeholder UI shown while lazy-loaded views resolve inside Suspense.
 * Uses VS Code theme tokens so the shell matches the host editor.
 */
export function LoadingSkeleton() {
  return (
    <div className="loading-skeleton" role="status" aria-busy="true" aria-label="Loading view">
      <div className="loading-skeleton__header loading-skeleton__pulse" />
      <div className="loading-skeleton__sub loading-skeleton__pulse" />
      <div className="loading-skeleton__rows" aria-hidden="true">
        <div className="loading-skeleton__row loading-skeleton__pulse" />
        <div className="loading-skeleton__row loading-skeleton__row--mid loading-skeleton__pulse" />
        <div className="loading-skeleton__row loading-skeleton__row--short loading-skeleton__pulse" />
      </div>
    </div>
  )
}
