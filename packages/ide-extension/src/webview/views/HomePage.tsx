import type { ScopePolicyStatePayload } from '../../shared/messages'
import type {
  AvailableAgent,
  InstalledSkillsMap,
  LifecycleScope,
  SkillRegistry,
  WebviewAction,
} from '../../shared/types'
import { RestrictedModeBanner } from '../components/RestrictedModeBanner'
import { ScopeSelector } from '../components/ScopeSelector'

/**
 * Props for the HomePage component.
 */
export interface HomePageProps {
  /** The skill registry instance or null if unavailable. */
  registry: SkillRegistry | null
  /** Map of currently installed skills. */
  installedSkills: InstalledSkillsMap
  /** Array of all available agents. */
  allAgents?: AvailableAgent[]
  /** The current scope policy state or null if unavailable. */
  policy: ScopePolicyStatePayload | null
  /** Whether the workspace is trusted to allow local scope actions. */
  isTrusted: boolean
  /** Whether a workspace is currently open. */
  hasWorkspace: boolean
  /** The currently selected target scope for lifecycle actions. */
  scope: LifecycleScope
  /** Whether a background operation is currently running. */
  isProcessing: boolean
  /** The specific operation currently being processed, if any. */
  processingAction?: 'update' | 'repair' | null
  /** Callback to navigate to a specific webview action flow. */
  onNavigate: (action: WebviewAction) => void
  /** Callback when the target scope changes. */
  onScopeChange: (scope: LifecycleScope) => void
  /** Callback to trigger an update of all outdated skills. */
  onUpdate: () => void
  /** Callback to trigger a repair of all corrupted skills. */
  onRepair: () => void
}

/**
 * Checks if a skill is installed in the given scope for *any* agent.
 *
 * @param installed - Installation metadata for a specific skill.
 * @param scope - The target scope to check.
 * @returns True if installed in the specified scope.
 *
 * @example
 * ```typescript
 * const isInstalled = isInstalledForScope(installedSkills['my-skill'], 'local');
 * ```
 */
function isInstalledForScope(installed: InstalledSkillsMap[string], scope: LifecycleScope): boolean {
  if (!installed) return false
  return scope === 'local' ? installed.local : installed.global
}

/**
 * Checks if a skill is installed across all provided agents for the given scope.
 *
 * @param installed - Installation metadata for a specific skill.
 * @param allAgents - List of agents to verify against.
 * @param scope - The target scope to check.
 * @returns True if installed on all agents in the specific scope.
 *
 * @example
 * ```typescript
 * const isInstalledOnAll = isInstalledForAllAgents(
 *   installedSkills['my-skill'],
 *   availableAgents,
 *   'global'
 * );
 * ```
 */
function isInstalledForAllAgents(
  installed: InstalledSkillsMap[string],
  allAgents: AvailableAgent[],
  scope: LifecycleScope,
): boolean {
  if (!installed || allAgents.length === 0) return false

  return allAgents.every((agent) => {
    const installInfo = installed.agents.find((entry) => entry.agent === agent.agent)
    if (!installInfo) return false
    return scope === 'local' ? installInfo.local : installInfo.global
  })
}

/**
 * Checks if there are any available updates for skills installed in the specified scope.
 *
 * @param skills - Array of skills from the registry.
 * @param installedSkills - Map of installed skills.
 * @param scope - The target scope to check.
 * @returns True if any skill has an update.
 *
 * @example
 * ```typescript
 * const hasUpdates = hasUpdatesForScope(registry.skills, installedSkills, 'local');
 * if (hasUpdates) {
 *   showUpdateBadge();
 * }
 * ```
 */
function hasUpdatesForScope(
  skills: SkillRegistry['skills'],
  installedSkills: InstalledSkillsMap,
  scope: LifecycleScope,
): boolean {
  return skills.some((skill) => {
    const installed = installedSkills[skill.name]
    if (!installed || !isInstalledForScope(installed, scope)) return false

    if (!installed.contentHash) return false

    return installed.contentHash !== skill.contentHash
  })
}

/**
 * Checks if there are any corrupted installations in the specified scope.
 *
 * @param installedSkills - Map of installed skills.
 * @param scope - The target scope to check.
 * @returns True if any corrupted installations exist.
 *
 * @example
 * ```typescript
 * const needsRepair = hasCorruptedInstallationsForScope(installedSkills, 'global');
 * ```
 */
function hasCorruptedInstallationsForScope(installedSkills: InstalledSkillsMap, scope: LifecycleScope): boolean {
  return Object.values(installedSkills).some((installed) => {
    if (!installed || !isInstalledForScope(installed, scope)) return false

    return installed.agents.some((agent) => {
      const installedInScope = scope === 'local' ? agent.local : agent.global
      return installedInScope && agent.corrupted
    })
  })
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
  registry,
  installedSkills,
  allAgents = [],
  policy,
  isTrusted,
  hasWorkspace,
  scope,
  isProcessing,
  processingAction = null,
  onNavigate,
  onScopeChange,
  onUpdate,
  onRepair,
}: HomePageProps) {
  const skills = registry?.skills ?? []
  const allowedScopes = policy?.allowedScopes ?? 'all'
  const shouldShowScopeSelector = allowedScopes !== 'none'
  const allInstalled =
    skills.length > 0 && skills.every((skill) => isInstalledForAllAgents(installedSkills[skill.name], allAgents, scope))
  const noneInstalled = skills.every((skill) => !isInstalledForScope(installedSkills[skill.name], scope))
  const hasUpdatesAvailable = hasUpdatesForScope(skills, installedSkills, scope)
  const hasRepairableSkills = hasCorruptedInstallationsForScope(installedSkills, scope)
  const lifecycleBlocked = (policy?.effectiveScopes.length ?? 0) === 0
  const lifecycleBlockedMessage = `Lifecycle actions are disabled: ${policy?.blockedReason ?? 'policy-none'}`

  let installDisabledReason: string | null = null
  if (isProcessing) {
    installDisabledReason = 'Operation in progress'
  } else if (lifecycleBlocked) {
    installDisabledReason = lifecycleBlockedMessage
  } else if (allInstalled) {
    installDisabledReason = 'All skills are already installed'
  }

  let uninstallDisabledReason: string | null = null
  if (isProcessing) {
    uninstallDisabledReason = 'Operation in progress'
  } else if (lifecycleBlocked) {
    uninstallDisabledReason = lifecycleBlockedMessage
  } else if (noneInstalled) {
    uninstallDisabledReason = 'No skills are installed'
  }

  let maintenanceDisabledReason: string | null = null
  if (isProcessing) {
    maintenanceDisabledReason = 'Operation in progress'
  } else if (lifecycleBlocked) {
    maintenanceDisabledReason = lifecycleBlockedMessage
  }

  const updateDisabledReason = maintenanceDisabledReason ?? (hasUpdatesAvailable ? null : 'No updates are available')
  const repairDisabledReason =
    maintenanceDisabledReason ?? (hasRepairableSkills ? null : 'No corrupted skills are available to repair')

  const scopeDisabled = !isTrusted || !hasWorkspace
  let scopeDisabledReason: string | undefined
  if (!isTrusted) {
    scopeDisabledReason = 'Local scope is unavailable in Restricted Mode'
  } else if (!hasWorkspace) {
    scopeDisabledReason = 'Local scope requires an open workspace'
  }

  return (
    <section className="home-page" aria-label="Home page">
      <RestrictedModeBanner visible={!isTrusted} />

      <div className="home-page-actions" role="group" aria-label="Skill actions">
        <button
          className="home-action-button home-action-button--install"
          onClick={() => onNavigate('install')}
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
          onClick={() => onNavigate('uninstall')}
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
          disabled={updateDisabledReason !== null}
          title={updateDisabledReason ?? undefined}
        >
          <span className="home-action-icon codicon codicon-refresh" aria-hidden="true" />
          <span className="home-action-copy">
            <strong>{processingAction === 'update' ? 'Updating...' : 'Update'}</strong>
            <small>Check for new versions</small>
          </span>
        </button>

        <button
          className="home-action-button home-action-button--repair"
          onClick={onRepair}
          disabled={repairDisabledReason !== null}
          title={repairDisabledReason ?? undefined}
        >
          <span className="home-action-icon codicon codicon-wrench" aria-hidden="true" />
          <span className="home-action-copy">
            <strong>{processingAction === 'repair' ? 'Repairing...' : 'Repair'}</strong>
            <small>Fix broken dependencies</small>
          </span>
        </button>
      </div>

      {shouldShowScopeSelector && (
        <ScopeSelector
          value={scopeDisabled ? 'global' : scope}
          onChange={onScopeChange}
          allowedScopes={allowedScopes}
          disabled={scopeDisabled}
          disabledReason={scopeDisabledReason}
        />
      )}
    </section>
  )
}
