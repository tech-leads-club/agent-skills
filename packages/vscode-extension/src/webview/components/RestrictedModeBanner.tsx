/**
 * Props for the RestrictedModeBanner component.
 */
export interface RestrictedModeBannerProps {
  /** Visibility flag for the restricted-mode notice. */
  visible: boolean
}

/**
 * Provides a banner warning when the workspace is in restricted (untrusted) mode.
 *
 * @param props - Component props.
 * @returns Banner element when visible, otherwise `null`.
 *
 * @see {@link RestrictedModeBannerProps} for available props.
 *
 * @example
 * ```tsx
 * <RestrictedModeBanner visible={!isTrusted} />
 * ```
 */
export function RestrictedModeBanner({ visible }: RestrictedModeBannerProps) {
  if (!visible) return null

  return (
    <div className="restricted-mode-banner" role="status">
      <span className="restricted-mode-icon">🔒</span>
      <span>Restricted Mode — local installs disabled</span>
    </div>
  )
}
