export function LoadingState() {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <p>Loading skills...</p>
    </div>
  )
}

export function ErrorState({ message }: { message: string | null }) {
  return (
    <div className="error-state">
      <p className="error-message">{message || 'Failed to load skill registry'}</p>
    </div>
  )
}

export function NoRegistryState() {
  return (
    <div className="empty-state">
      <p>No skills available in the registry</p>
    </div>
  )
}
