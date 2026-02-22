import type { ScopePolicyStatePayload } from '../../shared/messages'
import type { InstalledSkillsMap, LifecycleScope, SkillRegistry, WebviewAction } from '../../shared/types'
import { RestrictedModeBanner } from '../components/RestrictedModeBanner'
import { ScopeSelector } from '../components/ScopeSelector'

export interface HomePageProps {
  registry: SkillRegistry | null
  installedSkills: InstalledSkillsMap
  policy: ScopePolicyStatePayload | null
  isTrusted: boolean
  hasWorkspace: boolean
  scope: LifecycleScope
  isProcessing: boolean
  processingAction?: 'update' | 'repair' | null
  onNavigate: (action: WebviewAction) => void
  onScopeChange: (scope: LifecycleScope) => void
  onUpdate: () => void
  onRepair: () => void
}

function isInstalledForScope(installed: InstalledSkillsMap[string], scope: LifecycleScope): boolean {
  if (!installed) return false
  return scope === 'local' ? installed.local : installed.global
}

/**
 * Home page action hub for install/uninstall/update/repair flows.
 *
 * @param props - Home page state and action callbacks.
 * @returns Home view with action cards and scope selector.
 */
export function HomePage({
  registry,
  installedSkills,
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
  const allInstalled =
    skills.length > 0 && skills.every((skill) => isInstalledForScope(installedSkills[skill.name], scope))
  const noneInstalled = skills.every((skill) => !isInstalledForScope(installedSkills[skill.name], scope))
  const lifecycleBlocked = (policy?.effectiveScopes.length ?? 0) === 0

  const installDisabledReason = isProcessing
    ? 'Operation in progress'
    : lifecycleBlocked
      ? `Lifecycle actions are disabled: ${policy?.blockedReason ?? 'policy-none'}`
      : allInstalled
        ? 'All skills are already installed'
        : null

  const uninstallDisabledReason = isProcessing
    ? 'Operation in progress'
    : lifecycleBlocked
      ? `Lifecycle actions are disabled: ${policy?.blockedReason ?? 'policy-none'}`
      : noneInstalled
        ? 'No skills are installed'
        : null

  const maintenanceDisabledReason =
    isProcessing || lifecycleBlocked
      ? isProcessing
        ? 'Operation in progress'
        : `Lifecycle actions are disabled: ${policy?.blockedReason ?? 'policy-none'}`
      : null

  const scopeDisabled = !isTrusted || !hasWorkspace
  const scopeDisabledReason = !isTrusted
    ? 'Local scope is unavailable in Restricted Mode'
    : !hasWorkspace
      ? 'Local scope requires an open workspace'
      : undefined

  return (
    <section className="home-page" aria-label="Home page">
      <RestrictedModeBanner visible={!isTrusted} />

      <div className="home-page-actions" role="group" aria-label="Skill actions">
        <button
          className="home-action-button"
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
          className="home-action-button"
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
          className="home-action-button"
          onClick={onUpdate}
          disabled={maintenanceDisabledReason !== null}
          title={maintenanceDisabledReason ?? undefined}
        >
          <span className="home-action-icon codicon codicon-refresh" aria-hidden="true" />
          <span className="home-action-copy">
            <strong>{processingAction === 'update' ? 'Updating...' : 'Update'}</strong>
            <small>Check for new versions</small>
          </span>
        </button>

        <button
          className="home-action-button"
          onClick={onRepair}
          disabled={maintenanceDisabledReason !== null}
          title={maintenanceDisabledReason ?? undefined}
        >
          <span className="home-action-icon codicon codicon-wrench" aria-hidden="true" />
          <span className="home-action-copy">
            <strong>{processingAction === 'repair' ? 'Repairing...' : 'Repair'}</strong>
            <small>Fix broken dependencies</small>
          </span>
        </button>
      </div>

      <ScopeSelector
        value={scopeDisabled ? 'global' : scope}
        onChange={onScopeChange}
        disabled={scopeDisabled}
        disabledReason={scopeDisabledReason}
      />
    </section>
  )
}
