import * as vscode from 'vscode'
import type {
  AvailableAgent,
  InstalledSkillsMap,
  LifecycleBatchSelection,
  ScopePolicyEvaluation,
  SkillRegistry,
} from '../shared/types'
import type { InstallationOrchestrator } from './installation-orchestrator'
import type { ScopeQuickPickItem } from './scope-selection-service'

/**
 * Collaborator callbacks required by command palette flow orchestration.
 */
export interface CommandPaletteFlowContext {
  getPolicy(): ScopePolicyEvaluation | undefined
  checkPolicyBlocking(): boolean
  loadRegistryForCommand(): Promise<SkillRegistry | null>
  getInstalledSkills(): Promise<InstalledSkillsMap>
  getInstalledHashes(): Promise<Record<string, string | undefined>>
  getAvailableAgents(): Promise<AvailableAgent[]>
  pickSkills(
    mode: 'add' | 'remove' | 'update' | 'repair',
    registry: SkillRegistry,
    installedSkills: InstalledSkillsMap,
    availableAgents?: AvailableAgent[],
    installedHashes?: Record<string, string | undefined>,
  ): Promise<string[] | null>
  pickAgentsForSkills(
    action: 'add' | 'remove',
    skillNames: string[],
    availableAgents: AvailableAgent[],
    installedSkills: InstalledSkillsMap,
  ): Promise<string[] | null>
  pickScopeForSkills(
    action: 'add' | 'remove',
    skillNames: string[],
    agents: string[],
    installedSkills: InstalledSkillsMap,
    hasWorkspace: boolean,
    isTrusted: boolean,
  ): Promise<ScopeQuickPickItem | null>
  doesSkillNeedActionForScope(
    skillName: string,
    agents: string[],
    installedSkills: InstalledSkillsMap,
    scopeId: ScopeQuickPickItem['scopeId'],
    action: 'add' | 'remove',
  ): boolean
  getAgentDisplayNames(agentIds: string[], availableAgents: AvailableAgent[]): string[]
  confirmLifecycleAction(selection: LifecycleBatchSelection, agentNames: string[]): Promise<boolean>
  resolveSelectionScope(hasLocalTargets: boolean, hasGlobalTargets: boolean): 'local' | 'global' | 'all'
  runQueueAction(action: 'install' | 'remove' | 'update' | 'repair', work: () => Promise<void>): Promise<void>
}

/**
 * Encapsulates command-palette action flows (add/remove/update/repair).
 */
export class CommandPaletteFlowService {
  /**
   * Creates the command palette flow service.
   *
   * @param orchestrator - Orchestrator used to enqueue lifecycle operations.
   * @param context - Provider callbacks and shared helpers.
   */
  constructor(
    private readonly orchestrator: InstallationOrchestrator,
    private readonly context: CommandPaletteFlowContext,
  ) {}

  /**
   * Runs the add flow from the command palette.
   *
   * @returns A promise that resolves when the flow completes or is cancelled.
   */
  async runAddFlow(): Promise<void> {
    if (this.context.checkPolicyBlocking()) return

    const availableAgents = await this.context.getAvailableAgents()
    if (availableAgents.length === 0) {
      vscode.window.showInformationMessage('No agent hosts detected on this system.')
      return
    }

    const registry = await this.context.loadRegistryForCommand()
    if (!registry) return
    const installedSkills = await this.context.getInstalledSkills()
    const selectedSkills = await this.context.pickSkills('add', registry, installedSkills, availableAgents)
    if (!selectedSkills || selectedSkills.length === 0) return

    const selectedAgents = await this.context.pickAgentsForSkills(
      'add',
      selectedSkills,
      availableAgents,
      installedSkills,
    )
    if (!selectedAgents || selectedAgents.length === 0) return

    const hasWorkspace = !!vscode.workspace.workspaceFolders?.length
    const scopeItem = await this.context.pickScopeForSkills(
      'add',
      selectedSkills,
      selectedAgents,
      installedSkills,
      hasWorkspace,
      vscode.workspace.isTrusted,
    )
    if (!scopeItem) return

    const pendingSkills: string[] = []
    const skipped: string[] = []
    for (const skillName of selectedSkills) {
      const needsInstall = this.context.doesSkillNeedActionForScope(
        skillName,
        selectedAgents,
        installedSkills,
        scopeItem.scopeId,
        'add',
      )
      if (!needsInstall) {
        skipped.push(skillName)
        continue
      }
      pendingSkills.push(skillName)
    }

    if (pendingSkills.length === 0) {
      vscode.window.showInformationMessage(
        `Skipped ${skipped.length} skill(s) because they are already installed in the selected scope.`,
      )
      return
    }

    const agentNames = this.context.getAgentDisplayNames(selectedAgents, availableAgents)
    const selection: LifecycleBatchSelection = {
      action: 'install',
      skills: pendingSkills,
      agents: selectedAgents,
      scope: scopeItem.scopeId,
      source: 'command-palette',
    }

    const confirmed = await this.context.confirmLifecycleAction(selection, agentNames)
    if (!confirmed) return

    await this.context.runQueueAction('install', () =>
      this.orchestrator.installMany(pendingSkills, scopeItem.scopeId, selectedAgents, 'command-palette'),
    )

    if (skipped.length > 0) {
      vscode.window.showInformationMessage(
        `Skipped ${skipped.length} skill(s) because they are already installed in the selected scope.`,
      )
    }
  }

  /**
   * Runs the remove flow from the command palette.
   *
   * @returns A promise that resolves when the flow completes or is cancelled.
   */
  async runRemoveFlow(): Promise<void> {
    if (this.context.checkPolicyBlocking()) return

    const availableAgents = await this.context.getAvailableAgents()
    if (availableAgents.length === 0) {
      vscode.window.showInformationMessage('No agent hosts detected on this system.')
      return
    }

    const registry = await this.context.loadRegistryForCommand()
    if (!registry) return
    const installedSkills = await this.context.getInstalledSkills()
    const selectedSkills = await this.context.pickSkills('remove', registry, installedSkills, availableAgents)
    if (!selectedSkills || selectedSkills.length === 0) return

    const selectedAgents = await this.context.pickAgentsForSkills(
      'remove',
      selectedSkills,
      availableAgents,
      installedSkills,
    )
    if (!selectedAgents || selectedAgents.length === 0) return

    const hasWorkspace = !!vscode.workspace.workspaceFolders?.length
    const scopeItem = await this.context.pickScopeForSkills(
      'remove',
      selectedSkills,
      selectedAgents,
      installedSkills,
      hasWorkspace,
      vscode.workspace.isTrusted,
    )
    if (!scopeItem) return

    const pendingSkills: string[] = []
    const skipped: string[] = []
    for (const skillName of selectedSkills) {
      const needsRemoval = this.context.doesSkillNeedActionForScope(
        skillName,
        selectedAgents,
        installedSkills,
        scopeItem.scopeId,
        'remove',
      )
      if (!needsRemoval) {
        skipped.push(skillName)
        continue
      }
      pendingSkills.push(skillName)
    }

    if (pendingSkills.length === 0) {
      vscode.window.showInformationMessage(
        `Skipped ${skipped.length} skill(s) because they are no longer installed in the selected scope.`,
      )
      return
    }

    const agentNames = this.context.getAgentDisplayNames(selectedAgents, availableAgents)
    const selection: LifecycleBatchSelection = {
      action: 'remove',
      skills: pendingSkills,
      agents: selectedAgents,
      scope: scopeItem.scopeId,
      source: 'command-palette',
    }

    const confirmed = await this.context.confirmLifecycleAction(selection, agentNames)
    if (!confirmed) return

    await this.context.runQueueAction('remove', () =>
      this.orchestrator.removeMany(pendingSkills, scopeItem.scopeId, selectedAgents, 'command-palette'),
    )

    if (skipped.length > 0) {
      vscode.window.showInformationMessage(
        `Skipped ${skipped.length} skill(s) because they are no longer installed in the selected scope.`,
      )
    }
  }

  /**
   * Runs the update flow from the command palette.
   *
   * @returns A promise that resolves when the flow completes or is cancelled.
   */
  async runUpdateFlow(): Promise<void> {
    if (this.context.checkPolicyBlocking()) return

    const registry = await this.context.loadRegistryForCommand()
    if (!registry) return
    const installedSkills = await this.context.getInstalledSkills()
    const installedHashes = await this.context.getInstalledHashes()
    const selectedSkills = await this.context.pickSkills(
      'update',
      registry,
      installedSkills,
      undefined,
      installedHashes,
    )
    if (!selectedSkills || selectedSkills.length === 0) return

    const selection: LifecycleBatchSelection = {
      action: 'update',
      skills: selectedSkills,
      agents: [],
      scope: 'auto',
      source: 'command-palette',
    }
    const confirmed = await this.context.confirmLifecycleAction(selection, [])
    if (!confirmed) return

    await this.context.runQueueAction('update', () => this.orchestrator.updateMany(selectedSkills, 'command-palette'))
  }

  /**
   * Runs the repair flow from the command palette.
   *
   * @returns A promise that resolves when the flow completes or is cancelled.
   */
  async runRepairFlow(): Promise<void> {
    if (this.context.checkPolicyBlocking()) return

    const registry = await this.context.loadRegistryForCommand()
    if (!registry) return
    const installedSkills = await this.context.getInstalledSkills()
    const selectedSkills = await this.context.pickSkills('repair', registry, installedSkills)
    if (!selectedSkills || selectedSkills.length === 0) return

    const effectiveScopes = this.context.getPolicy()?.effectiveScopes ?? ['local', 'global']
    const allowLocal = effectiveScopes.includes('local')
    const allowGlobal = effectiveScopes.includes('global')

    const localSkills = new Set<string>()
    const globalSkills = new Set<string>()
    const localAgents = new Set<string>()
    const globalAgents = new Set<string>()
    const skipped: string[] = []

    for (const skillName of selectedSkills) {
      const installedInfo = installedSkills[skillName]
      if (!installedInfo) {
        skipped.push(skillName)
        continue
      }

      const localCorruptedAgents = installedInfo.agents
        .filter((agent) => agent.local && agent.corrupted)
        .map((a) => a.agent)
      const globalCorruptedAgents = installedInfo.agents
        .filter((agent) => agent.global && agent.corrupted)
        .map((a) => a.agent)

      let added = false
      if (allowLocal && localCorruptedAgents.length > 0) {
        localSkills.add(skillName)
        localCorruptedAgents.forEach((agentId) => localAgents.add(agentId))
        added = true
      }
      if (allowGlobal && globalCorruptedAgents.length > 0) {
        globalSkills.add(skillName)
        globalCorruptedAgents.forEach((agentId) => globalAgents.add(agentId))
        added = true
      }
      if (!added) {
        skipped.push(skillName)
      }
    }

    const hasLocalTargets = allowLocal && localSkills.size > 0 && localAgents.size > 0
    const hasGlobalTargets = allowGlobal && globalSkills.size > 0 && globalAgents.size > 0

    if (!hasLocalTargets && !hasGlobalTargets) {
      vscode.window.showInformationMessage('Skipped selected skills with no eligible installations to repair.')
      return
    }

    const unionAgents = Array.from(new Set([...localAgents, ...globalAgents]))
    const unionSkills = Array.from(new Set([...localSkills, ...globalSkills]))
    const selection: LifecycleBatchSelection = {
      action: 'repair',
      skills: unionSkills,
      agents: unionAgents,
      scope: this.context.resolveSelectionScope(hasLocalTargets, hasGlobalTargets),
      source: 'command-palette',
    }
    const agentNames = this.context.getAgentDisplayNames(unionAgents, await this.context.getAvailableAgents())
    const confirmed = await this.context.confirmLifecycleAction(selection, agentNames)
    if (!confirmed) return

    await this.context.runQueueAction('repair', async () => {
      const tasks: Promise<void>[] = []
      if (hasLocalTargets) {
        tasks.push(
          this.orchestrator.repairMany(Array.from(localSkills), 'local', Array.from(localAgents), 'command-palette'),
        )
      }
      if (hasGlobalTargets) {
        tasks.push(
          this.orchestrator.repairMany(Array.from(globalSkills), 'global', Array.from(globalAgents), 'command-palette'),
        )
      }
      await Promise.all(tasks)
    })

    if (skipped.length > 0) {
      vscode.window.showInformationMessage(
        `Skipped ${skipped.length} skill(s) with no remaining installations to repair.`,
      )
    }
  }
}
