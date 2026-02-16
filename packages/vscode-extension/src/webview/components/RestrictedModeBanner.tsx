/**
 * Provides a banner warning when the workspace is in restricted (untrusted) mode.
 */
export function RestrictedModeBanner({ visible }: { visible: boolean }) {
  if (!visible) return null

  return (
    <div className="restricted-mode-banner" role="status">
      <span className="restricted-mode-icon">🔒</span>
      <span>Restricted Mode — local installs disabled</span>
    </div>
  )
}
