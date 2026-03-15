import type { ScopePolicyStatePayload } from '../../shared/messages'
import { RestrictedModeBanner } from '../components/RestrictedModeBanner'

/**
 * Props for the HomePage component.
 */
export interface HomePageProps {
  /** The current scope policy state or null if unavailable. */
  policy: ScopePolicyStatePayload | null
  /** Whether the workspace is trusted to allow local scope actions. */
  isTrusted: boolean
  /** Whether a background operation is currently running. */
  isProcessing: boolean
  /** Callback to start install flow. */
  onInstall: () => void
  /** Callback to start uninstall flow. */
  onUninstall: () => void
  /** Callback to start update flow. */
  onUpdate: () => void
}

/**
 * Home page action hub for install/uninstall/update/repair flows.
 *
 * @param props - Home page state and action callbacks.
 * @returns Home view with action cards and scope controls when permitted.
 *
 * @see {@link HomePageProps} for available props.
 *
 * @example
 * ```tsx
 * <HomePage
 *   registry={registry}
 *   installedSkills={installedSkills}
 *   isTrusted={true}
 *   hasWorkspace={true}
 *   scope="local"
 *   isProcessing={false}
 *   onNavigate={(action) => setView(action)}
 *   onScopeChange={(scope) => setScope(scope)}
 *   onUpdate={() => startUpdate()}
 *   onRepair={() => startRepair()}
 * />
 * ```
 */
export function HomePage({
  policy,
  isTrusted,
  isProcessing,
  onInstall,
  onUninstall,
  onUpdate,
}: HomePageProps) {
  const lifecycleBlocked = (policy?.effectiveScopes.length ?? 0) === 0
  const lifecycleBlockedMessage = `Lifecycle actions are disabled: ${policy?.blockedReason ?? 'policy-none'}`

  let installDisabledReason: string | null = null
  if (isProcessing) {
    installDisabledReason = 'Operation in progress'
  } else if (lifecycleBlocked) {
    installDisabledReason = lifecycleBlockedMessage
  }

  let uninstallDisabledReason: string | null = null
  if (isProcessing) {
    uninstallDisabledReason = 'Operation in progress'
  } else if (lifecycleBlocked) {
    uninstallDisabledReason = lifecycleBlockedMessage
  }

  return (
    <section className="home-page" aria-label="Home page">
      <RestrictedModeBanner visible={!isTrusted} />

      <div className="home-page-actions" role="group" aria-label="Skill actions">
        <button
          className="home-action-button home-action-button--install"
          onClick={onInstall}
          disabled={installDisabledReason !== null}
          title={installDisabledReason ?? undefined}
        >
          <span className="home-action-icon codicon codicon-cloud-download" aria-hidden="true" />
          <span className="home-action-copy">
            <strong>Install</strong>
            <small>Add new capabilities</small>
          </span>
          <span className="home-action-chevron codicon codicon-chevron-right" aria-hidden="true" />
        </button>

        <button
          className="home-action-button home-action-button--uninstall"
          onClick={onUninstall}
          disabled={uninstallDisabledReason !== null}
          title={uninstallDisabledReason ?? undefined}
        >
          <span className="home-action-icon codicon codicon-trash" aria-hidden="true" />
          <span className="home-action-copy">
            <strong>Uninstall</strong>
            <small>Remove installed skills</small>
          </span>
          <span className="home-action-chevron codicon codicon-chevron-right" aria-hidden="true" />
        </button>

        <button
          className="home-action-button home-action-button--update"
          onClick={onUpdate}
          disabled={isProcessing}
          title={isProcessing ? 'Operation in progress' : undefined}
        >
          <span className="home-action-icon codicon codicon-refresh" aria-hidden="true" />
          <span className="home-action-copy">
            <strong>Update</strong>
            <small>Check for new versions</small>
          </span>
        </button>
      </div>
    </section>
  )
}
