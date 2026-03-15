import type { AgentInstallInfo, InstalledSkillInfo, InstalledSkillsMap } from '../shared/types'

/**
 * Scope quick-pick item consumed by single-skill and multi-skill flows.
 */
export interface ScopeQuickPickItem {
  label: string
  description?: string
  scopeId: 'local' | 'global' | 'all'
}

/**
 * Input for single-skill scope option derivation.
 */
export interface BuildScopeItemsForSkillArgs {
  action: 'add' | 'remove'
  agents: string[]
  installedInfo: InstalledSkillInfo | null
  hasWorkspace: boolean
  isTrusted: boolean
  effectiveScopes: Array<'local' | 'global'>
}

/**
 * Input for multi-skill scope option derivation.
 */
export interface BuildScopeItemsForSkillsArgs {
  action: 'add' | 'remove'
  skillNames: string[]
  agents: string[]
  installedSkills: InstalledSkillsMap
  hasWorkspace: boolean
  isTrusted: boolean
  effectiveScopes: Array<'local' | 'global'>
}

/**
 * Builds scope options for add/remove flows while preserving existing
 * trusted-workspace and installed-state behavior.
 */
export class ScopeSelectionService {
  /**
   * Builds scope quick-pick items for single-skill add/remove flows.
   *
   * @param args - Inputs used to compute valid local/global/all options.
   * @returns Scope options that are valid for the selected skill and agents.
   */
  buildScopeItemsForSkill(args: BuildScopeItemsForSkillArgs): ScopeQuickPickItem[] {
    const { action, agents, installedInfo, hasWorkspace, isTrusted, effectiveScopes } = args
    const allowLocal = effectiveScopes.includes('local')
    const allowGlobal = effectiveScopes.includes('global')

    if (action === 'add') {
      const canLocal = allowLocal && this.canAddLocal(hasWorkspace, isTrusted, agents, installedInfo)
      const canGlobal = allowGlobal && this.canAddGlobal(agents, installedInfo)
      return this.buildScopeItems(canLocal, canGlobal, 'add')
    }

    const canLocal = allowLocal && this.canRemoveLocal(hasWorkspace, isTrusted, agents, installedInfo)
    const canGlobal = allowGlobal && this.canRemoveGlobal(agents, installedInfo)
    return this.buildScopeItems(canLocal, canGlobal, 'remove')
  }

  /**
   * Builds scope quick-pick items for multi-skill add/remove flows.
   *
   * @param args - Inputs used to compute valid options across selected skills.
   * @returns Scope options that are valid for the selected skills and agents.
   */
  buildScopeItemsForSkills(args: BuildScopeItemsForSkillsArgs): ScopeQuickPickItem[] {
    const { action, skillNames, agents, installedSkills, hasWorkspace, isTrusted, effectiveScopes } = args
    const allowLocal = effectiveScopes.includes('local')
    const allowGlobal = effectiveScopes.includes('global')

    if (action === 'add') {
      const canLocal =
        allowLocal && this.canAddLocalForSkills(skillNames, agents, installedSkills, hasWorkspace, isTrusted)
      const canGlobal = allowGlobal && this.canAddGlobalForSkills(skillNames, agents, installedSkills)
      return this.buildScopeItems(canLocal, canGlobal, 'add')
    }

    const canLocal =
      allowLocal && this.canRemoveLocalForSkills(skillNames, agents, installedSkills, hasWorkspace, isTrusted)
    const canGlobal = allowGlobal && this.canRemoveGlobalForSkills(skillNames, agents, installedSkills)
    return this.buildScopeItems(canLocal, canGlobal, 'remove')
  }

  private buildScopeItems(canLocal: boolean, canGlobal: boolean, action: 'add' | 'remove'): ScopeQuickPickItem[] {
    const localDescription = action === 'add' ? 'Install in the current workspace' : 'Remove from the current workspace'
    const globalDescription = action === 'add' ? 'Install in the home directory' : 'Remove from the home directory'
    const allDescription = action === 'add' ? 'Install both locally and globally' : 'Remove from both local and global'

    const scopeItems: ScopeQuickPickItem[] = []
    if (canLocal) {
      scopeItems.push({ label: 'Locally', description: localDescription, scopeId: 'local' })
    }
    if (canGlobal) {
      scopeItems.push({ label: 'Globally', description: globalDescription, scopeId: 'global' })
    }
    if (canLocal && canGlobal) {
      scopeItems.push({ label: 'All', description: allDescription, scopeId: 'all' })
    }
    return scopeItems
  }

  private canAddLocal(
    hasWorkspace: boolean,
    isTrusted: boolean,
    agents: string[],
    installedInfo: InstalledSkillInfo | null,
  ): boolean {
    if (!hasWorkspace || !isTrusted) return false
    return this.hasAgentSatisfying(agents, installedInfo, (installed) => !installed?.local)
  }

  private canAddGlobal(agents: string[], installedInfo: InstalledSkillInfo | null): boolean {
    return this.hasAgentSatisfying(agents, installedInfo, (installed) => !installed?.global)
  }

  private canRemoveLocal(
    hasWorkspace: boolean,
    isTrusted: boolean,
    agents: string[],
    installedInfo: InstalledSkillInfo | null,
  ): boolean {
    if (!hasWorkspace || !isTrusted) return false
    return this.hasAgentSatisfying(agents, installedInfo, (installed) => installed?.local === true)
  }

  private canRemoveGlobal(agents: string[], installedInfo: InstalledSkillInfo | null): boolean {
    return this.hasAgentSatisfying(agents, installedInfo, (installed) => installed?.global === true)
  }

  private canAddLocalForSkills(
    skillNames: string[],
    agents: string[],
    installedSkills: InstalledSkillsMap,
    hasWorkspace: boolean,
    isTrusted: boolean,
  ): boolean {
    if (!hasWorkspace || !isTrusted) return false
    return skillNames.some((skillName) =>
      this.hasAgentSatisfying(agents, installedSkills[skillName] ?? null, (installed) => !installed?.local),
    )
  }

  private canAddGlobalForSkills(skillNames: string[], agents: string[], installedSkills: InstalledSkillsMap): boolean {
    return skillNames.some((skillName) =>
      this.hasAgentSatisfying(agents, installedSkills[skillName] ?? null, (installed) => !installed?.global),
    )
  }

  private canRemoveLocalForSkills(
    skillNames: string[],
    agents: string[],
    installedSkills: InstalledSkillsMap,
    hasWorkspace: boolean,
    isTrusted: boolean,
  ): boolean {
    if (!hasWorkspace || !isTrusted) return false
    return skillNames.some((skillName) =>
      this.hasAgentSatisfying(agents, installedSkills[skillName] ?? null, (installed) => installed?.local === true),
    )
  }

  private canRemoveGlobalForSkills(
    skillNames: string[],
    agents: string[],
    installedSkills: InstalledSkillsMap,
  ): boolean {
    return skillNames.some((skillName) =>
      this.hasAgentSatisfying(agents, installedSkills[skillName] ?? null, (installed) => installed?.global === true),
    )
  }

  private hasAgentSatisfying(
    agents: string[],
    installedInfo: InstalledSkillInfo | null,
    predicate: (installed: AgentInstallInfo | undefined) => boolean,
  ): boolean {
    return agents.some((agentId) => predicate(installedInfo?.agents.find((ia) => ia.agent === agentId)))
  }
}
