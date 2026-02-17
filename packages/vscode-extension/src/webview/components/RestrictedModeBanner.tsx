/**
 * Provides a banner warning when the workspace is in restricted (untrusted) mode.
 *
 * @param props - Visibility flag for the restricted-mode notice.
 * @returns Banner element when visible, otherwise `null`.
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
