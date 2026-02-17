import * as vscode from 'vscode'
import type { InstallationOrchestrator } from '../services/installation-orchestrator'
import { LoggingService } from '../services/logging-service'
import { SkillLockService } from '../services/skill-lock-service'
import { SkillRegistryService, type RegistryResult } from '../services/skill-registry-service'
import type { StateReconciler } from '../services/state-reconciler'
import type { ExtensionMessage, RegistryUpdatePayload, WebviewMessage } from '../shared/messages'
import type {
  AgentInstallInfo,
  AvailableAgent,
  InstalledSkillInfo,
  InstalledSkillsMap,
  Skill,
  SkillRegistry,
} from '../shared/types'

interface AgentQuickPickItem extends vscode.QuickPickItem {
  agentId: string
}

interface ScopeQuickPickItem extends vscode.QuickPickItem {
  scopeId: 'local' | 'global' | 'all'
}

interface SkillQuickPickItem extends vscode.QuickPickItem {
  skillName: string
  categoryId: string
  registryHash?: string
  localHash?: string
}

type SkillSelectionMode = 'add' | 'remove' | 'update' | 'repair'

/**
 * Manages the sidebar Webview life cycle, message routing, and registry synchronization.
 */
export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'agentSkillsSidebar'

  private webviewView?: vscode.WebviewView

  /**
   * Creates a sidebar provider and wires orchestrator/reconciler event forwarding to the webview.
   *
   * @param context - Extension context used for URIs and disposable registration.
   * @param logger - Logging service for telemetry and diagnostics.
   * @param registryService - Service that loads and caches the skills registry.
   * @param orchestrator - Operation orchestrator used for install/remove/update/repair flows.
   * @param reconciler - State reconciler that publishes installed-skill updates.
   * @param skillLockService - Service that reads installed lockfile hashes for update checks.
   */
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly logger: LoggingService,
    private readonly registryService: SkillRegistryService,
    private readonly orchestrator: InstallationOrchestrator,
    private readonly reconciler: StateReconciler,
    private readonly skillLockService: SkillLockService,
  ) {
    // Subscribe to state changes and push to webview
    this.reconciler.onStateChanged((installedSkills) => {
      this.postMessage({
        type: 'reconcileState',
        payload: { installedSkills },
      })
    })

    // Subscribe to orchestrator events
    this.orchestrator.onOperationEvent((event) => {
      if (event.type === 'started') {
        this.postMessage({
          type: 'operationStarted',
          payload: {
            operationId: event.operationId,
            operation: event.operation,
            skillName: event.skillName,
          },
        })
      } else if (event.type === 'progress') {
        this.postMessage({
          type: 'operationProgress',
          payload: {
            operationId: event.operationId,
            message: event.message || '',
            increment: undefined, // CLI doesn't support % yet
          },
        })
      } else if (event.type === 'completed') {
        this.postMessage({
          type: 'operationCompleted',
          payload: {
            operationId: event.operationId,
            operation: event.operation,
            skillName: event.skillName,
            success: event.success ?? false,
            errorMessage: event.errorMessage,
          },
        })
        // Reconcile installed state after operation completes to refresh UI
        void this.reconciler.reconcile()
      }
    })
  }

  /**
   * Resolves and initializes the sidebar webview instance.
   *
   * @param webviewView - Webview container provided by VS Code for this view contribution.
   * @returns Nothing. Side effects include HTML initialization and event subscriptions.
   */
  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.logger.info('Resolving sidebar webview')
    this.webviewView = webviewView

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    }

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview)

    // Wire message handler
    const messageDisposable = webviewView.webview.onDidReceiveMessage((message: WebviewMessage) =>
      this.handleMessage(message, webviewView.webview),
    )
    this.context.subscriptions.push(messageDisposable)

    // Listen for trust change
    const trustDisposable = vscode.workspace.onDidGrantWorkspaceTrust(() => {
      this.postMessage({
        type: 'trustState',
        payload: { isTrusted: true },
      })
    })
    this.context.subscriptions.push(trustDisposable)
  }

  /**
   * Posts a typed message to the active webview, if mounted.
   *
   * @param message - Extension-to-webview message payload.
   * @returns A promise that resolves after VS Code receives the message.
   */
  private async postMessage(message: ExtensionMessage): Promise<void> {
    if (this.webviewView?.webview) {
      await this.webviewView.webview.postMessage(message)
    }
  }

  /**
   * Dispatches an incoming webview message to its typed handler.
   *
   * @param message - Raw message received from the webview runtime.
   * @param webview - Webview instance that emitted the message.
   * @returns A promise that resolves when message handling completes.
   */
  private async handleMessage(message: WebviewMessage, webview: vscode.Webview): Promise<void> {
    const handler = this.getMessageHandler(message.type)
    if (!handler) {
      this.logger.warn(`Unknown webview message type: ${(message as { type: string }).type}`)
      return
    }
    await handler(message, webview)
  }

  /**
   * Resolves a handler function for a given message type.
   *
   * @param type - Discriminant from {@link WebviewMessage}.
   * @returns An async handler when supported; otherwise `undefined`.
   */
  private getMessageHandler(
    type: WebviewMessage['type'],
  ): ((message: WebviewMessage, webview: vscode.Webview) => Promise<void>) | undefined {
    switch (type) {
      case 'webviewDidMount':
        return (message, webview) => this.handleWebviewDidMount(message, webview)
      case 'requestRefresh':
        return (_, webview) => this.handleRefreshRequest(webview)
      case 'requestAgentPick':
        return (message) => {
          const typed = message as Extract<WebviewMessage, { type: 'requestAgentPick' }>
          return this.handleAgentPick(typed.payload.skillName, typed.payload.action)
        }
      case 'requestScopePick':
        return (message) => {
          const typed = message as Extract<WebviewMessage, { type: 'requestScopePick' }>
          return this.handleScopePick(typed.payload.skillName, typed.payload.action, typed.payload.agents)
        }
      case 'installSkill':
        return (message) => {
          const typed = message as Extract<WebviewMessage, { type: 'installSkill' }>
          return this.handleInstallSkill(typed.payload.skillName, typed.payload.scope, typed.payload.agents)
        }
      case 'removeSkill':
        return (message) => {
          const typed = message as Extract<WebviewMessage, { type: 'removeSkill' }>
          return this.handleRemoveSkill(typed.payload.skillName, typed.payload.scope, typed.payload.agents)
        }
      case 'updateSkill':
        return (message) => {
          const typed = message as Extract<WebviewMessage, { type: 'updateSkill' }>
          return this.handleUpdateSkill(typed.payload.skillName)
        }
      case 'repairSkill':
        return (message) => {
          const typed = message as Extract<WebviewMessage, { type: 'repairSkill' }>
          return this.handleRepairSkill(typed.payload.skillName, typed.payload.scope, typed.payload.agents)
        }
      case 'cancelOperation':
        return async (message) => {
          const typed = message as Extract<WebviewMessage, { type: 'cancelOperation' }>
          this.handleCancelOperation(typed.payload.operationId)
        }
      default:
        return undefined
    }
  }

  /**
   * Handles initial webview mount and sends bootstrap state.
   *
   * @param _message - Mount message payload (unused).
   * @param webview - Destination webview for bootstrap updates.
   * @returns A promise that resolves after initialization messages are posted.
   */
  private async handleWebviewDidMount(_message: WebviewMessage, webview: vscode.Webview): Promise<void> {
    this.logger.info('Webview did mount')
    const version = this.context.extension.packageJSON.version ?? 'unknown'
    const availableAgents = await this.reconciler.getAvailableAgents()
    const installedSkills = await this.reconciler.getInstalledSkills()
    const hasWorkspace = !!vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0

    await this.postMessage({
      type: 'initialize',
      payload: { version, availableAgents, hasWorkspace },
    })

    await this.postMessage({
      type: 'reconcileState',
      payload: { installedSkills },
    })

    await this.postMessage({
      type: 'trustState',
      payload: { isTrusted: vscode.workspace.isTrusted },
    })

    void this.loadAndPushRegistry(webview)
    void this.reconciler.reconcile()
  }

  /**
   * Handles refresh requests originating from the webview UI.
   *
   * @param webview - Destination webview used for registry updates.
   * @returns A promise that resolves once refresh orchestration is triggered.
   */
  private async handleRefreshRequest(webview: vscode.Webview): Promise<void> {
    this.logger.info('Refresh requested from webview')
    void this.loadAndPushRegistry(webview, true)
    void this.reconciler.reconcile()
  }

  /**
   * Enqueues an install operation for a skill.
   *
   * @param skillName - Skill identifier to install.
   * @param scope - Target installation scope.
   * @param agents - Agent identifiers to target.
   * @returns A promise that resolves when enqueueing logic completes.
   */
  private async handleInstallSkill(
    skillName: string,
    scope: 'local' | 'global' | 'all',
    agents: string[],
  ): Promise<void> {
    await this.runQueueAction('install', () => this.enqueueInstall(skillName, scope, agents))
  }

  /**
   * Enqueues a remove operation for a skill after user confirmation.
   *
   * @param skillName - Skill identifier to remove.
   * @param scope - Removal scope.
   * @param agents - Agent identifiers to target.
   * @returns A promise that resolves when enqueueing logic completes.
   */
  private async handleRemoveSkill(
    skillName: string,
    scope: 'local' | 'global' | 'all',
    agents: string[],
  ): Promise<void> {
    const agentNames = agents.join(', ')
    const confirmed = await this.confirmRemoval(skillName, agentNames, scope)
    if (!confirmed) return
    await this.runQueueAction('remove', () => this.enqueueRemove(skillName, scope, agents))
  }

  /**
   * Enqueues an update operation for a skill.
   *
   * @param skillName - Skill identifier to update.
   * @returns A promise that resolves when enqueueing logic completes.
   */
  private async handleUpdateSkill(skillName: string): Promise<void> {
    await this.runQueueAction('update', () => this.orchestrator.update(skillName))
  }

  /**
   * Enqueues a repair operation for a skill.
   *
   * @param skillName - Skill identifier to repair.
   * @param scope - Repair scope.
   * @param agents - Agent identifiers to target.
   * @returns A promise that resolves when enqueueing logic completes.
   */
  private async handleRepairSkill(skillName: string, scope: 'local' | 'global', agents: string[]): Promise<void> {
    await this.runQueueAction('repair', () => this.orchestrator.repair(skillName, scope, agents))
  }

  /**
   * Cancels a queued or active operation.
   *
   * @param operationId - Operation identifier generated by the orchestrator.
   * @returns Nothing.
   */
  private handleCancelOperation(operationId: string): void {
    this.orchestrator.cancel(operationId)
  }

  /**
   * Runs the command-palette flow for adding one or more skills.
   *
   * @returns A promise that resolves when the flow completes or is cancelled.
   */
  async runCommandPaletteAdd(): Promise<void> {
    const availableAgents = await this.reconciler.getAvailableAgents()
    if (availableAgents.length === 0) {
      vscode.window.showInformationMessage('No agent hosts detected on this system.')
      return
    }

    const registry = await this.loadRegistryForCommand()
    if (!registry) return
    const installedSkills = await this.reconciler.getInstalledSkills()
    const selectedSkills = await this.pickSkills('add', registry, installedSkills, availableAgents)
    if (!selectedSkills || selectedSkills.length === 0) return

    const selectedAgents = await this.pickAgentsForSkills('add', selectedSkills, availableAgents, installedSkills)
    if (!selectedAgents || selectedAgents.length === 0) return

    const hasWorkspace = !!vscode.workspace.workspaceFolders?.length
    const scopeItem = await this.pickScopeForSkills(
      'add',
      selectedSkills,
      selectedAgents,
      installedSkills,
      hasWorkspace,
      vscode.workspace.isTrusted,
    )
    if (!scopeItem) return

    const skipped: string[] = []
    for (const skillName of selectedSkills) {
      const needsInstall = this.doesSkillNeedActionForScope(
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
      await this.runQueueAction('install', () => this.enqueueInstall(skillName, scopeItem.scopeId, selectedAgents))
    }

    if (skipped.length > 0) {
      vscode.window.showInformationMessage(
        `Skipped ${skipped.length} skill(s) because they are already installed in the selected scope.`,
      )
    }
  }

  /**
   * Runs the command-palette flow for removing one or more skills.
   *
   * @returns A promise that resolves when the flow completes or is cancelled.
   */
  async runCommandPaletteRemove(): Promise<void> {
    const availableAgents = await this.reconciler.getAvailableAgents()
    if (availableAgents.length === 0) {
      vscode.window.showInformationMessage('No agent hosts detected on this system.')
      return
    }

    const registry = await this.loadRegistryForCommand()
    if (!registry) return
    const installedSkills = await this.reconciler.getInstalledSkills()
    const selectedSkills = await this.pickSkills('remove', registry, installedSkills, availableAgents)
    if (!selectedSkills || selectedSkills.length === 0) return

    const selectedAgents = await this.pickAgentsForSkills('remove', selectedSkills, availableAgents, installedSkills)
    if (!selectedAgents || selectedAgents.length === 0) return

    const hasWorkspace = !!vscode.workspace.workspaceFolders?.length
    const scopeItem = await this.pickScopeForSkills(
      'remove',
      selectedSkills,
      selectedAgents,
      installedSkills,
      hasWorkspace,
      vscode.workspace.isTrusted,
    )
    if (!scopeItem) return

    const agentNames = this.getAgentDisplayNames(selectedAgents, availableAgents).join(', ')
    const confirmed = await this.confirmBatchRemoval(selectedSkills, agentNames, scopeItem.scopeId)
    if (!confirmed) return

    const skipped: string[] = []
    for (const skillName of selectedSkills) {
      const needsRemoval = this.doesSkillNeedActionForScope(
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
      await this.runQueueAction('remove', () => this.enqueueRemove(skillName, scopeItem.scopeId, selectedAgents))
    }

    if (skipped.length > 0) {
      vscode.window.showInformationMessage(
        `Skipped ${skipped.length} skill(s) because they are no longer installed in the selected scope.`,
      )
    }
  }

  /**
   * Runs the command-palette flow for updating one or more skills.
   *
   * @returns A promise that resolves when the flow completes or is cancelled.
   */
  async runCommandPaletteUpdate(): Promise<void> {
    const registry = await this.loadRegistryForCommand()
    if (!registry) return
    const installedSkills = await this.reconciler.getInstalledSkills()
    const installedHashes = await this.skillLockService.getInstalledHashes()
    const selectedSkills = await this.pickSkills('update', registry, installedSkills, undefined, installedHashes)
    if (!selectedSkills || selectedSkills.length === 0) return

    for (const skillName of selectedSkills) {
      await this.runQueueAction('update', () => this.orchestrator.update(skillName))
    }
  }

  /**
   * Runs the command-palette flow for repairing corrupted skills.
   *
   * @returns A promise that resolves when the flow completes or is cancelled.
   */
  async runCommandPaletteRepair(): Promise<void> {
    const registry = await this.loadRegistryForCommand()
    if (!registry) return
    const installedSkills = await this.reconciler.getInstalledSkills()
    const selectedSkills = await this.pickSkills('repair', registry, installedSkills)
    if (!selectedSkills || selectedSkills.length === 0) return

    const skipped: string[] = []
    for (const skillName of selectedSkills) {
      const installedInfo = installedSkills[skillName]
      if (!installedInfo) {
        skipped.push(skillName)
        continue
      }
      const localAgents = this.getScopeAgents(installedInfo, 'local')
      const globalAgents = this.getScopeAgents(installedInfo, 'global')

      if (localAgents.length === 0 && globalAgents.length === 0) {
        skipped.push(skillName)
        continue
      }

      if (localAgents.length > 0) {
        await this.runQueueAction('repair', () => this.orchestrator.repair(skillName, 'local', localAgents))
      }
      if (globalAgents.length > 0) {
        await this.runQueueAction('repair', () => this.orchestrator.repair(skillName, 'global', globalAgents))
      }
    }

    if (skipped.length > 0) {
      vscode.window.showInformationMessage(
        `Skipped ${skipped.length} skill(s) with no remaining installations to repair.`,
      )
    }
  }

  /**
   * Shows a multi-select QuickPick for agent selection.
   *
   * @param skillName - Skill being acted on.
   * @param action - Whether the flow is adding or removing the skill.
   * @returns A promise that resolves after agent selection is handled.
   */
  private async handleAgentPick(skillName: string, action: 'add' | 'remove'): Promise<void> {
    const availableAgents = await this.reconciler.getAvailableAgents()
    const installedSkills = await this.reconciler.getInstalledSkills()
    const installedInfo: InstalledSkillInfo | null = installedSkills[skillName] || null

    const agentItems = this.buildAgentPickItems(availableAgents, installedInfo, action)

    if (agentItems.length === 0) {
      const emptyMessage =
        action === 'add'
          ? 'This skill is already installed for all agents in every scope.'
          : 'This skill is not installed for any agent.'
      vscode.window.showInformationMessage(emptyMessage)
      return
    }

    const selected = await vscode.window.showQuickPick(agentItems, {
      title: `${action === 'add' ? 'Add' : 'Remove'} skill: ${skillName}`,
      placeHolder: 'Select agents',
      canPickMany: true,
    })

    if (!selected || selected.length === 0) {
      await this.postMessage({
        type: 'agentPickResult',
        payload: { skillName, action, agents: null },
      })
      return
    }

    const selectedAgentIds = selected.map((item) => item.agentId)

    await this.postMessage({
      type: 'agentPickResult',
      payload: { skillName, action, agents: selectedAgentIds },
    })

    void this.handleScopePick(skillName, action, selectedAgentIds)
  }

  /**
   * Shows a QuickPick for scope selection (Local, Global, All).
   *
   * @param skillName - Skill being acted on.
   * @param action - Whether the flow is adding or removing the skill.
   * @param agents - Agents selected in the previous picker.
   * @returns A promise that resolves after scope selection and execution.
   */
  private async handleScopePick(skillName: string, action: 'add' | 'remove', agents: string[]): Promise<void> {
    const hasWorkspace = !!vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
    const installedSkills = await this.reconciler.getInstalledSkills()
    const installedInfo: InstalledSkillInfo | null = installedSkills[skillName] || null
    const isTrusted = vscode.workspace.isTrusted

    const scopeItems = this.buildScopeQuickPickItems(action, agents, installedInfo, hasWorkspace, isTrusted)

    if (scopeItems.length === 0) {
      const message = this.getScopePickEmptyMessage(action, isTrusted, installedInfo, agents)
      vscode.window.showInformationMessage(message)
      return
    }

    const selectedScope = await this.selectScopeItem(scopeItems, skillName, action)
    if (!selectedScope) {
      await this.postMessage({
        type: 'scopePickResult',
        payload: { skillName, action, agents, scope: null },
      })
      return
    }

    await this.postMessage({
      type: 'scopePickResult',
      payload: { skillName, action, agents, scope: selectedScope.scopeId },
    })

    await this.executeScopeAction(skillName, action, agents, selectedScope.scopeId)
  }

  /**
   * Executes an enqueue action and handles user-facing enqueue failures.
   *
   * @param action - Operation label used for logging and UI errors.
   * @param executor - Async callback that performs the enqueue call.
   * @returns A promise that resolves when enqueueing completes or errors are surfaced.
   */
  private async runQueueAction(
    action: 'install' | 'remove' | 'update' | 'repair',
    executor: () => Promise<void>,
  ): Promise<void> {
    try {
      await executor()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      this.logger.error(`Failed to enqueue ${action}: ${msg}`)
      const userFacing = action === 'install' ? 'installation' : action === 'remove' ? 'removal' : action
      vscode.window.showErrorMessage(`Failed to start ${userFacing}: ${msg}`)
    }
  }

  /**
   * Enqueues install operations for one or both scopes.
   *
   * @param skillName - Skill to install.
   * @param scope - Target scope or both scopes.
   * @param agents - Selected agent identifiers.
   * @returns A promise that resolves after all required enqueue calls are made.
   */
  private async enqueueInstall(skillName: string, scope: 'local' | 'global' | 'all', agents: string[]): Promise<void> {
    if (scope === 'all') {
      await this.orchestrator.install(skillName, 'local', agents)
      await this.orchestrator.install(skillName, 'global', agents)
      return
    }
    await this.orchestrator.install(skillName, scope, agents)
  }

  /**
   * Enqueues remove operations for one or both scopes.
   *
   * @param skillName - Skill to remove.
   * @param scope - Target scope or both scopes.
   * @param agents - Selected agent identifiers.
   * @returns A promise that resolves after all required enqueue calls are made.
   */
  private async enqueueRemove(skillName: string, scope: 'local' | 'global' | 'all', agents: string[]): Promise<void> {
    if (scope === 'all') {
      await this.orchestrator.remove(skillName, 'local', agents)
      await this.orchestrator.remove(skillName, 'global', agents)
      return
    }
    await this.orchestrator.remove(skillName, scope, agents)
  }

  /**
   * Builds per-agent quick pick items based on current install state and action.
   *
   * @param availableAgents - Agents detected on the machine.
   * @param installedInfo - Installation metadata for the selected skill.
   * @param action - Whether the picker is for add or remove.
   * @returns Filtered quick pick items that represent valid actions.
   */
  private buildAgentPickItems(
    availableAgents: AvailableAgent[],
    installedInfo: InstalledSkillInfo | null,
    action: 'add' | 'remove',
  ): AgentQuickPickItem[] {
    const items: AgentQuickPickItem[] = []
    for (const agent of availableAgents) {
      const installed = this.findAgentInstall(installedInfo, agent.agent)

      if (action === 'add') {
        if (installed?.local && installed?.global) continue
        items.push({
          label: agent.displayName,
          description: this.describeAgentInstallStatus(installed),
          agentId: agent.agent,
        })
      } else {
        if (!installed || (!installed.local && !installed.global)) continue
        items.push({
          label: agent.displayName,
          description: this.describeInstalledScopes(installed),
          agentId: agent.agent,
        })
      }
    }

    return items
  }

  /**
   * Produces a short install-state description used by add-agent picker items.
   *
   * @param installed - Agent installation state, when present.
   * @returns A human-readable status string.
   */
  private describeAgentInstallStatus(installed?: AgentInstallInfo): string {
    if (!installed) return ''
    if (installed.local) return 'Installed locally'
    if (installed.global) return 'Installed globally'
    return ''
  }

  /**
   * Formats scope labels for remove-agent picker items.
   *
   * @param installed - Agent installation state.
   * @returns Scope label string such as `Local`, `Global`, or `Local + Global`.
   */
  private describeInstalledScopes(installed: AgentInstallInfo): string {
    const scopes: string[] = []
    if (installed.local) scopes.push('Local')
    if (installed.global) scopes.push('Global')
    return scopes.join(' + ')
  }

  /**
   * Looks up an agent installation entry by agent id.
   *
   * @param installedInfo - Skill installation metadata.
   * @param agentId - Agent identifier to resolve.
   * @returns Matching install info, when available.
   */
  private findAgentInstall(installedInfo: InstalledSkillInfo | null, agentId: string): AgentInstallInfo | undefined {
    return installedInfo?.agents.find((ia) => ia.agent === agentId)
  }

  /**
   * Builds scope quick pick items for single-skill add/remove flows.
   *
   * @param action - Whether the flow is add or remove.
   * @param agents - Selected agents.
   * @param installedInfo - Current installation metadata for the skill.
   * @param hasWorkspace - Whether a workspace folder is open.
   * @param isTrusted - Whether the workspace is trusted.
   * @returns Scope options that are valid for the current state.
   */
  private buildScopeQuickPickItems(
    action: 'add' | 'remove',
    agents: string[],
    installedInfo: InstalledSkillInfo | null,
    hasWorkspace: boolean,
    isTrusted: boolean,
  ): ScopeQuickPickItem[] {
    const scopeItems: ScopeQuickPickItem[] = []

    if (action === 'add') {
      const canAddLocal = this.canAddLocal(hasWorkspace, isTrusted, agents, installedInfo)
      const canAddGlobal = this.canAddGlobal(agents, installedInfo)
      if (canAddLocal) {
        scopeItems.push({ label: 'Locally', description: 'Install in the current workspace', scopeId: 'local' })
      }
      if (canAddGlobal) {
        scopeItems.push({ label: 'Globally', description: 'Install in the home directory', scopeId: 'global' })
      }
      if (canAddLocal && canAddGlobal) {
        scopeItems.push({ label: 'All', description: 'Install both locally and globally', scopeId: 'all' })
      }
    } else {
      const canRemoveLocal = this.canRemoveLocal(hasWorkspace, isTrusted, agents, installedInfo)
      const canRemoveGlobal = this.canRemoveGlobal(agents, installedInfo)
      if (canRemoveLocal) {
        scopeItems.push({ label: 'Locally', description: 'Remove from the current workspace', scopeId: 'local' })
      }
      if (canRemoveGlobal) {
        scopeItems.push({ label: 'Globally', description: 'Remove from the home directory', scopeId: 'global' })
      }
      if (canRemoveLocal && canRemoveGlobal) {
        scopeItems.push({ label: 'All', description: 'Remove from both local and global', scopeId: 'all' })
      }
    }

    return scopeItems
  }

  /**
   * Checks whether local installation is possible for at least one selected agent.
   *
   * @param hasWorkspace - Whether a workspace folder is open.
   * @param isTrusted - Whether the workspace is trusted.
   * @param agents - Selected agents.
   * @param installedInfo - Current installation metadata for the skill.
   * @returns `true` when local install should be offered.
   */
  private canAddLocal(
    hasWorkspace: boolean,
    isTrusted: boolean,
    agents: string[],
    installedInfo: InstalledSkillInfo | null,
  ): boolean {
    if (!hasWorkspace || !isTrusted) return false
    return this.hasAgentSatisfying(agents, installedInfo, (installed) => !installed?.local)
  }

  /**
   * Checks whether global installation is possible for at least one selected agent.
   *
   * @param agents - Selected agents.
   * @param installedInfo - Current installation metadata for the skill.
   * @returns `true` when global install should be offered.
   */
  private canAddGlobal(agents: string[], installedInfo: InstalledSkillInfo | null): boolean {
    return this.hasAgentSatisfying(agents, installedInfo, (installed) => !installed?.global)
  }

  /**
   * Checks whether local removal is possible for at least one selected agent.
   *
   * @param hasWorkspace - Whether a workspace folder is open.
   * @param isTrusted - Whether the workspace is trusted.
   * @param agents - Selected agents.
   * @param installedInfo - Current installation metadata for the skill.
   * @returns `true` when local removal should be offered.
   */
  private canRemoveLocal(
    hasWorkspace: boolean,
    isTrusted: boolean,
    agents: string[],
    installedInfo: InstalledSkillInfo | null,
  ): boolean {
    if (!hasWorkspace || !isTrusted) return false
    return this.hasAgentSatisfying(agents, installedInfo, (installed) => installed?.local === true)
  }

  /**
   * Checks whether global removal is possible for at least one selected agent.
   *
   * @param agents - Selected agents.
   * @param installedInfo - Current installation metadata for the skill.
   * @returns `true` when global removal should be offered.
   */
  private canRemoveGlobal(agents: string[], installedInfo: InstalledSkillInfo | null): boolean {
    return this.hasAgentSatisfying(agents, installedInfo, (installed) => installed?.global === true)
  }

  /**
   * Evaluates whether any selected agent satisfies the provided predicate.
   *
   * @param agents - Selected agent identifiers.
   * @param installedInfo - Skill installation metadata.
   * @param predicate - Predicate evaluated for each agent installation record.
   * @returns `true` when at least one agent satisfies the predicate.
   */
  private hasAgentSatisfying(
    agents: string[],
    installedInfo: InstalledSkillInfo | null,
    predicate: (installed: AgentInstallInfo | undefined) => boolean,
  ): boolean {
    return agents.some((agentId) => predicate(this.findAgentInstall(installedInfo, agentId)))
  }

  /**
   * Opens a scope picker for single-skill flows.
   *
   * @param scopeItems - Available scope options.
   * @param skillName - Skill being acted on.
   * @param action - Whether the flow is add or remove.
   * @returns The selected scope item, or `null` if cancelled.
   */
  private async selectScopeItem(
    scopeItems: ScopeQuickPickItem[],
    skillName: string,
    action: 'add' | 'remove',
  ): Promise<ScopeQuickPickItem | null> {
    if (scopeItems.length === 1) {
      return scopeItems[0]
    }

    const picked = await vscode.window.showQuickPick(scopeItems, {
      title: `${action === 'add' ? 'Add' : 'Remove'} skill: ${skillName} — Select scope`,
      placeHolder:
        action === 'add' ? 'Where should the skill be installed?' : 'Where should the skill be removed from?',
    })

    return picked ?? null
  }

  /**
   * Opens a scope picker for multi-skill command-palette flows.
   *
   * @param scopeItems - Available scope options.
   * @param action - Whether the flow is add or remove.
   * @returns The selected scope item, or `null` if cancelled.
   */
  private async selectScopeItemForCommand(
    scopeItems: ScopeQuickPickItem[],
    action: 'add' | 'remove',
  ): Promise<ScopeQuickPickItem | null> {
    if (scopeItems.length === 1) {
      return scopeItems[0]
    }

    const picked = await vscode.window.showQuickPick(scopeItems, {
      title: `${action === 'add' ? 'Add skills' : 'Remove skills'} — select scope`,
      placeHolder:
        action === 'add' ? 'Where should the skills be installed?' : 'Where should the skills be removed from?',
    })

    return picked ?? null
  }

  /**
   * Shows a multi-select skill picker filtered by action mode.
   *
   * @param mode - Selection mode that controls candidate filtering.
   * @param registry - Registry data used to build picker entries.
   * @param installedSkills - Current installed-skill state.
   * @param availableAgents - Optional detected agents used for add eligibility.
   * @param installedHashes - Optional lockfile hashes used for update eligibility.
   * @returns Selected skill names, or `null` if cancelled/empty.
   */
  private async pickSkills(
    mode: SkillSelectionMode,
    registry: SkillRegistry,
    installedSkills: InstalledSkillsMap,
    availableAgents?: AvailableAgent[],
    installedHashes?: Record<string, string | undefined>,
  ): Promise<string[] | null> {
    const items = this.buildSkillQuickPickItems(registry, installedSkills, mode, availableAgents, installedHashes)
    if (items.length === 0) {
      vscode.window.showInformationMessage(this.getEmptySkillMessage(mode))
      return null
    }

    const selection = await vscode.window.showQuickPick(items, {
      title: this.getSkillQuickPickTitle(mode),
      placeHolder: 'Filter skills',
      canPickMany: true,
      matchOnDescription: true,
      matchOnDetail: true,
    })

    if (!selection || selection.length === 0) {
      return null
    }

    return selection.map((item) => item.skillName)
  }

  /**
   * Builds quick pick items for the skill-selection dialog.
   *
   * @param registry - Registry data used to source skills and categories.
   * @param installedSkills - Current installed-skill state.
   * @param mode - Selection mode that controls filtering and labels.
   * @param availableAgents - Optional detected agents for add-mode filtering.
   * @param installedHashes - Optional lockfile hashes for update-mode details.
   * @returns Quick pick entries matching the current mode.
   */
  private buildSkillQuickPickItems(
    registry: SkillRegistry,
    installedSkills: InstalledSkillsMap,
    mode: SkillSelectionMode,
    availableAgents?: AvailableAgent[],
    installedHashes?: Record<string, string | undefined>,
  ): SkillQuickPickItem[] {
    const items: SkillQuickPickItem[] = []
    for (const skill of registry.skills) {
      const installedInfo = installedSkills[skill.name] ?? null
      if (!this.isSkillCandidate(skill, installedInfo, mode, availableAgents, installedHashes ?? undefined)) {
        continue
      }

      const categoryName = registry.categories[skill.category]?.name ?? skill.category
      const modeDetail = this.getSkillDetailForMode(skill, installedHashes, installedInfo, mode)
      const detailParts: string[] = []
      if (modeDetail) {
        detailParts.push(modeDetail)
      }
      if (categoryName) {
        detailParts.push(categoryName)
      }
      const detail = detailParts.length > 0 ? detailParts.join(' — ') : undefined
      const description = skill.description?.trim() || 'No description'

      items.push({
        label: skill.name,
        description,
        detail,
        skillName: skill.name,
        categoryId: skill.category,
        registryHash: skill.contentHash,
        localHash: installedHashes?.[skill.name],
      })
    }

    return items
  }

  /**
   * Determines whether a skill should be shown for the given selection mode.
   *
   * @param skill - Candidate registry skill.
   * @param installedInfo - Installed metadata for the candidate skill.
   * @param mode - Selection mode.
   * @param availableAgents - Optional detected agents.
   * @param installedHashes - Optional installed hash map.
   * @returns `true` when the skill is a valid candidate for the mode.
   */
  private isSkillCandidate(
    skill: Skill,
    installedInfo: InstalledSkillInfo | null,
    mode: SkillSelectionMode,
    availableAgents?: AvailableAgent[],
    installedHashes?: Record<string, string | undefined>,
  ): boolean {
    switch (mode) {
      case 'add': {
        if (!availableAgents || availableAgents.length === 0) {
          return false
        }
        return this.buildAgentPickItems(availableAgents, installedInfo, 'add').length > 0
      }
      case 'remove':
        return !!installedInfo && (installedInfo.local || installedInfo.global)
      case 'update': {
        if (!installedInfo || !skill.contentHash) return false
        const localHash = installedHashes?.[skill.name]
        return localHash !== skill.contentHash || localHash === undefined
      }
      case 'repair':
        return !!installedInfo && installedInfo.agents.some((agent) => agent.corrupted)
    }
  }

  /**
   * Builds mode-specific detail text for a skill quick pick item.
   *
   * @param skill - Candidate registry skill.
   * @param installedHashes - Optional installed hash map.
   * @param installedInfo - Installed metadata for the candidate skill.
   * @param mode - Selection mode.
   * @returns Detail text for the quick pick entry, when available.
   */
  private getSkillDetailForMode(
    skill: Skill,
    installedHashes: Record<string, string | undefined> | undefined,
    installedInfo: InstalledSkillInfo | null,
    mode: SkillSelectionMode,
  ): string | undefined {
    if (mode === 'update') {
      const localHash = this.shortenHash(installedHashes?.[skill.name] ?? 'unknown')
      const registryHash = this.shortenHash(skill.contentHash ?? 'unknown')
      return `${localHash} -> ${registryHash}`
    }

    if (mode === 'repair' && installedInfo) {
      const scopes: string[] = []
      if (installedInfo.local) scopes.push('Local')
      if (installedInfo.global) scopes.push('Global')
      return scopes.length > 0 ? `Installed: ${scopes.join(' + ')}` : undefined
    }

    return undefined
  }

  /**
   * Returns the title used by the skill picker for a given mode.
   *
   * @param mode - Selection mode.
   * @returns User-facing quick pick title.
   */
  private getSkillQuickPickTitle(mode: SkillSelectionMode): string {
    switch (mode) {
      case 'add':
        return 'Select skills to add'
      case 'remove':
        return 'Select skills to remove'
      case 'update':
        return 'Select skills to update'
      case 'repair':
        return 'Select skills to repair'
    }
  }

  /**
   * Returns the message shown when no skills are available for a mode.
   *
   * @param mode - Selection mode.
   * @returns User-facing empty-state message.
   */
  private getEmptySkillMessage(mode: SkillSelectionMode): string {
    switch (mode) {
      case 'add':
        return 'All skills are already installed for the available agents.'
      case 'remove':
        return 'No installed skills were detected.'
      case 'update':
        return 'All installed skills are up to date.'
      case 'repair':
        return 'No corrupted skills are available to repair.'
    }
  }

  /**
   * Shortens a content hash for display in quick pick metadata.
   *
   * @param hash - Full hash value.
   * @returns A compact hash string, or `unknown` fallback.
   */
  private shortenHash(hash: string | undefined): string {
    const normalized = hash ?? 'unknown'
    return normalized.length <= 7 ? normalized : normalized.slice(0, 7)
  }

  /**
   * Shows an agent picker for multi-skill command-palette actions.
   *
   * @param action - Whether the flow is add or remove.
   * @param skillNames - Skills selected in the first picker.
   * @param availableAgents - Agents detected on the machine.
   * @param installedSkills - Current installed-skill state.
   * @returns Selected agent ids, or `null` if cancelled.
   */
  private async pickAgentsForSkills(
    action: 'add' | 'remove',
    skillNames: string[],
    availableAgents: AvailableAgent[],
    installedSkills: InstalledSkillsMap,
  ): Promise<string[] | null> {
    const agentItems = this.buildMultiSkillAgentPickItems(skillNames, availableAgents, installedSkills, action)
    if (agentItems.length === 0) {
      const message =
        action === 'add'
          ? 'The selected skills cannot be added to any of the detected agents.'
          : 'The selected skills are not installed for any detected agents.'
      vscode.window.showInformationMessage(message)
      return null
    }

    const picker = await vscode.window.showQuickPick(agentItems, {
      title: `${action === 'add' ? 'Add' : 'Remove'} skills — select agents`,
      placeHolder: 'Select agents',
      canPickMany: true,
    })

    if (!picker || picker.length === 0) return null
    return picker.map((item) => item.agentId)
  }

  /**
   * Builds deduplicated agent picker items across multiple selected skills.
   *
   * @param skillNames - Selected skill names.
   * @param availableAgents - Agents detected on the machine.
   * @param installedSkills - Current installed-skill state.
   * @param action - Whether the flow is add or remove.
   * @returns Unique agent quick pick items.
   */
  private buildMultiSkillAgentPickItems(
    skillNames: string[],
    availableAgents: AvailableAgent[],
    installedSkills: InstalledSkillsMap,
    action: 'add' | 'remove',
  ): AgentQuickPickItem[] {
    const uniqueAgents = new Map<string, AgentQuickPickItem>()

    for (const skillName of skillNames) {
      const installedInfo = installedSkills[skillName] ?? null
      for (const item of this.buildAgentPickItems(availableAgents, installedInfo, action)) {
        if (!uniqueAgents.has(item.agentId)) {
          uniqueAgents.set(item.agentId, item)
        }
      }
    }

    return Array.from(uniqueAgents.values())
  }

  /**
   * Shows a scope picker for multi-skill command-palette actions.
   *
   * @param action - Whether the flow is add or remove.
   * @param skillNames - Selected skills.
   * @param agents - Selected agents.
   * @param installedSkills - Current installed-skill state.
   * @param hasWorkspace - Whether a workspace folder is open.
   * @param isTrusted - Whether the workspace is trusted.
   * @returns Selected scope item, or `null` if no valid scope/cancelled.
   */
  private async pickScopeForSkills(
    action: 'add' | 'remove',
    skillNames: string[],
    agents: string[],
    installedSkills: InstalledSkillsMap,
    hasWorkspace: boolean,
    isTrusted: boolean,
  ): Promise<ScopeQuickPickItem | null> {
    const scopeItems = this.buildScopeQuickPickItemsForSkills(
      action,
      skillNames,
      agents,
      installedSkills,
      hasWorkspace,
      isTrusted,
    )

    if (scopeItems.length === 0) {
      vscode.window.showInformationMessage(
        action === 'add'
          ? 'The selected skills cannot be installed in any available scope.'
          : 'The selected skills are not installed in any available scope.',
      )
      return null
    }

    return this.selectScopeItemForCommand(scopeItems, action)
  }

  /**
   * Builds scope options for multi-skill command-palette actions.
   *
   * @param action - Whether the flow is add or remove.
   * @param skillNames - Selected skills.
   * @param agents - Selected agents.
   * @param installedSkills - Current installed-skill state.
   * @param hasWorkspace - Whether a workspace folder is open.
   * @param isTrusted - Whether the workspace is trusted.
   * @returns Scope quick pick entries that are currently valid.
   */
  private buildScopeQuickPickItemsForSkills(
    action: 'add' | 'remove',
    skillNames: string[],
    agents: string[],
    installedSkills: InstalledSkillsMap,
    hasWorkspace: boolean,
    isTrusted: boolean,
  ): ScopeQuickPickItem[] {
    const scopeItems: ScopeQuickPickItem[] = []

    if (action === 'add') {
      const canLocal = this.canAddLocalForSkills(skillNames, agents, installedSkills, hasWorkspace, isTrusted)
      const canGlobal = this.canAddGlobalForSkills(skillNames, agents, installedSkills)
      if (canLocal) {
        scopeItems.push({ label: 'Locally', description: 'Install in the current workspace', scopeId: 'local' })
      }
      if (canGlobal) {
        scopeItems.push({ label: 'Globally', description: 'Install in the home directory', scopeId: 'global' })
      }
      if (canLocal && canGlobal) {
        scopeItems.push({ label: 'All', description: 'Install both locally and globally', scopeId: 'all' })
      }
    } else {
      const canLocal = this.canRemoveLocalForSkills(skillNames, agents, installedSkills, hasWorkspace, isTrusted)
      const canGlobal = this.canRemoveGlobalForSkills(skillNames, agents, installedSkills)
      if (canLocal) {
        scopeItems.push({ label: 'Locally', description: 'Remove from the current workspace', scopeId: 'local' })
      }
      if (canGlobal) {
        scopeItems.push({ label: 'Globally', description: 'Remove from the home directory', scopeId: 'global' })
      }
      if (canLocal && canGlobal) {
        scopeItems.push({ label: 'All', description: 'Remove from both local and global', scopeId: 'all' })
      }
    }

    return scopeItems
  }

  /**
   * Checks whether at least one selected skill supports local installation.
   *
   * @param skillNames - Selected skills.
   * @param agents - Selected agents.
   * @param installedSkills - Current installed-skill state.
   * @param hasWorkspace - Whether a workspace folder is open.
   * @param isTrusted - Whether the workspace is trusted.
   * @returns `true` when local add should be offered.
   */
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

  /**
   * Checks whether at least one selected skill supports global installation.
   *
   * @param skillNames - Selected skills.
   * @param agents - Selected agents.
   * @param installedSkills - Current installed-skill state.
   * @returns `true` when global add should be offered.
   */
  private canAddGlobalForSkills(skillNames: string[], agents: string[], installedSkills: InstalledSkillsMap): boolean {
    return skillNames.some((skillName) =>
      this.hasAgentSatisfying(agents, installedSkills[skillName] ?? null, (installed) => !installed?.global),
    )
  }

  /**
   * Checks whether at least one selected skill supports local removal.
   *
   * @param skillNames - Selected skills.
   * @param agents - Selected agents.
   * @param installedSkills - Current installed-skill state.
   * @param hasWorkspace - Whether a workspace folder is open.
   * @param isTrusted - Whether the workspace is trusted.
   * @returns `true` when local remove should be offered.
   */
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

  /**
   * Checks whether at least one selected skill supports global removal.
   *
   * @param skillNames - Selected skills.
   * @param agents - Selected agents.
   * @param installedSkills - Current installed-skill state.
   * @returns `true` when global remove should be offered.
   */
  private canRemoveGlobalForSkills(
    skillNames: string[],
    agents: string[],
    installedSkills: InstalledSkillsMap,
  ): boolean {
    return skillNames.some((skillName) =>
      this.hasAgentSatisfying(agents, installedSkills[skillName] ?? null, (installed) => installed?.global === true),
    )
  }

  /**
   * Determines whether an action is still needed for a skill in the selected scope.
   *
   * @param skillName - Skill being evaluated.
   * @param agents - Selected agents.
   * @param installedSkills - Current installed-skill state.
   * @param scopeId - Scope selected by the user.
   * @param action - Whether the action is add or remove.
   * @returns `true` when an operation should be enqueued.
   */
  private doesSkillNeedActionForScope(
    skillName: string,
    agents: string[],
    installedSkills: InstalledSkillsMap,
    scopeId: ScopeQuickPickItem['scopeId'],
    action: 'add' | 'remove',
  ): boolean {
    if (scopeId === 'all') {
      return (
        this.doesSkillNeedActionForScope(skillName, agents, installedSkills, 'local', action) ||
        this.doesSkillNeedActionForScope(skillName, agents, installedSkills, 'global', action)
      )
    }

    const installedInfo = installedSkills[skillName] ?? null
    if (scopeId === 'local') {
      return this.hasAgentSatisfying(agents, installedInfo, (installed) =>
        action === 'add' ? !installed?.local : installed?.local === true,
      )
    }

    return this.hasAgentSatisfying(agents, installedInfo, (installed) =>
      action === 'add' ? !installed?.global : installed?.global === true,
    )
  }

  /**
   * Maps agent ids to user-facing display names.
   *
   * @param agentIds - Agent identifiers to resolve.
   * @param availableAgents - Available agents list used for lookup.
   * @returns Ordered display names with id fallback when unknown.
   */
  private getAgentDisplayNames(agentIds: string[], availableAgents: AvailableAgent[]): string[] {
    return agentIds.map((id) => availableAgents.find((agent) => agent.agent === id)?.displayName ?? id)
  }

  /**
   * Shows a modal confirmation for batch removal operations.
   *
   * @param skills - Skill names selected for removal.
   * @param agents - Preformatted agent names.
   * @param scope - Target scope selection.
   * @returns `true` when the user confirms removal.
   */
  private async confirmBatchRemoval(
    skills: string[],
    agents: string,
    scope: ScopeQuickPickItem['scopeId'],
  ): Promise<boolean> {
    const scopeLabel = scope === 'all' ? 'Local + Global' : scope
    const skillList = skills.join(', ')
    const message = `Remove ${skills.length} skill(s) (${skillList}) from ${agents} (${scopeLabel})? This will delete the skill files.`
    const selection = await vscode.window.showWarningMessage(message, { modal: true }, 'Remove')
    return selection === 'Remove'
  }

  /**
   * Returns agent ids that currently have a skill installed in a given scope.
   *
   * @param installedInfo - Installation metadata for a skill.
   * @param scope - Scope to filter by.
   * @returns Agent ids that are installed in the requested scope.
   */
  private getScopeAgents(installedInfo: InstalledSkillInfo, scope: 'local' | 'global'): string[] {
    return installedInfo.agents.filter((agent) => agent[scope]).map((agent) => agent.agent)
  }

  /**
   * Loads registry data for command-palette flows with error handling.
   *
   * @returns Registry payload, or `null` when loading fails.
   */
  private async loadRegistryForCommand(): Promise<SkillRegistry | null> {
    try {
      return await this.registryService.getRegistry()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      this.logger.error(`Unable to load registry for command palette: ${message}`)
      vscode.window.showErrorMessage(`Unable to load skills registry: ${message}`)
      return null
    }
  }

  /**
   * Returns a user-facing empty-state message for scope selection.
   *
   * @param action - Whether the flow is add or remove.
   * @param isTrusted - Whether the workspace is trusted.
   * @param installedInfo - Installed metadata for the skill.
   * @param agents - Selected agent identifiers.
   * @returns Scope-specific informational message.
   */
  private getScopePickEmptyMessage(
    action: 'add' | 'remove',
    isTrusted: boolean,
    installedInfo: InstalledSkillInfo | null,
    agents: string[],
  ): string {
    if (action === 'add') {
      if (!isTrusted) {
        let message = 'Workspace is restricted. You can only install skills globally.'
        if (this.canRemoveGlobal(agents, installedInfo)) {
          message += ' The selected agents already have this skill installed globally.'
        }
        return message
      }
      return 'This skill is already installed in all available scopes for the selected agents.'
    }
    return 'This skill is not installed in any scope for the selected agents.'
  }

  /**
   * Executes the selected add/remove action for a chosen scope.
   *
   * @param skillName - Skill to mutate.
   * @param action - Action type selected by the user.
   * @param agents - Target agent identifiers.
   * @param scopeId - Selected scope.
   * @returns A promise that resolves when execution completes or is cancelled.
   */
  private async executeScopeAction(
    skillName: string,
    action: 'add' | 'remove',
    agents: string[],
    scopeId: 'local' | 'global' | 'all',
  ): Promise<void> {
    if (action === 'add') {
      await this.runQueueAction('install', () => this.enqueueInstall(skillName, scopeId, agents))
      return
    }

    const agentNames = agents.join(', ')
    const confirmed = await this.confirmRemoval(skillName, agentNames, scopeId)
    if (!confirmed) return
    await this.runQueueAction('remove', () => this.enqueueRemove(skillName, scopeId, agents))
  }

  /**
   * Load registry from service and push to webview.
   * Sends loading status first, then ready/error/offline.
   *
   * @param webview - Destination webview for registry state messages.
   * @param forceRefresh - When true, bypasses cache TTL during fetch.
   * @returns A promise that resolves once status messages are posted.
   */
  private async loadAndPushRegistry(webview: vscode.Webview, forceRefresh = false): Promise<void> {
    // Send loading status
    await this.postMessage({
      type: 'registryUpdate',
      payload: { status: 'loading', registry: null },
    })

    try {
      const {
        data: registry,
        fromCache,
        offline,
      }: RegistryResult = await this.registryService.getRegistryWithMetadata(forceRefresh)
      const status: RegistryUpdatePayload['status'] = offline ? 'offline' : 'ready'
      const payload = {
        status,
        registry,
        fromCache,
        ...(offline
          ? {
              errorMessage:
                'Unable to refresh the skills registry. Showing cached data. Please check your connection and retry.',
            }
          : {}),
      }

      await this.postMessage({
        type: 'registryUpdate',
        payload,
      })
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      this.logger.error(`Failed to load registry: ${errorMessage}`)
      await this.postMessage({
        type: 'registryUpdate',
        payload: {
          status: 'error',
          registry: null,
          errorMessage: errorMessage || 'Failed to load skill registry',
        },
      })
    }
  }

  /**
   * Shows a modal confirmation for single-skill removal actions.
   *
   * @param skillName - Skill selected for removal.
   * @param agentNames - Agent labels included in the confirmation text.
   * @param scope - Scope selection (`local`, `global`, or `all`).
   * @returns `true` when the user confirms removal.
   */
  private async confirmRemoval(skillName: string, agentNames: string, scope: string): Promise<boolean> {
    const message = `Remove skill '${skillName}' from ${agentNames} (${scope === 'all' ? 'Local + Global' : scope})? This will delete the skill files.`
    const selection = await vscode.window.showWarningMessage(message, { modal: true }, 'Remove')
    return selection === 'Remove'
  }

  /**
   * Generates the webview HTML shell and CSP for the sidebar app.
   *
   * @param webview - Webview instance used to resolve resource URIs.
   * @returns Fully composed HTML document string.
   */
  private getHtmlForWebview(webview: vscode.Webview): string {
    const distUri = vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview')
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, 'index.js'))
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, 'index.css'))
    const nonce = this.getNonce()

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
    <link rel="stylesheet" href="${styleUri}">
    <title>Agent Skills Manager</title>
</head>
<body>
    <div id="root"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`
  }

  /**
   * Generates a nonce value for CSP script whitelisting.
   *
   * @returns Random nonce string suitable for CSP script tags.
   */
  private getNonce(): string {
    const array = new Uint32Array(4)
    crypto.getRandomValues(array)
    return Array.from(array, (n) => n.toString(36)).join('')
  }
}
