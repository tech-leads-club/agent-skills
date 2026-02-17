import Fuse from 'fuse.js'
import * as vscode from 'vscode'
import type { InstallationOrchestrator } from '../services/installation-orchestrator'
import { LoggingService } from '../services/logging-service'
import { SkillLockService } from '../services/skill-lock-service'
import { SkillRegistryService, type RegistryResult } from '../services/skill-registry-service'
import type { StateReconciler } from '../services/state-reconciler'
import type { ExtensionMessage, WebviewMessage, RegistryUpdatePayload } from '../shared/messages'
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

  private async postMessage(message: ExtensionMessage): Promise<void> {
    if (this.webviewView?.webview) {
      await this.webviewView.webview.postMessage(message)
    }
  }

  private async handleMessage(message: WebviewMessage, webview: vscode.Webview): Promise<void> {
    const handler = this.getMessageHandler(message.type)
    if (!handler) {
      this.logger.warn(`Unknown webview message type: ${(message as { type: string }).type}`)
      return
    }
    await handler(message, webview)
  }

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

  private async handleRefreshRequest(webview: vscode.Webview): Promise<void> {
    this.logger.info('Refresh requested from webview')
    void this.loadAndPushRegistry(webview, true)
    void this.reconciler.reconcile()
  }

  private async handleInstallSkill(skillName: string, scope: 'local' | 'global' | 'all', agents: string[]): Promise<void> {
    await this.runQueueAction('install', () => this.enqueueInstall(skillName, scope, agents))
  }

  private async handleRemoveSkill(skillName: string, scope: 'local' | 'global' | 'all', agents: string[]): Promise<void> {
    const agentNames = agents.join(', ')
    const confirmed = await this.confirmRemoval(skillName, agentNames, scope)
    if (!confirmed) return
    await this.runQueueAction('remove', () => this.enqueueRemove(skillName, scope, agents))
  }

  private async handleUpdateSkill(skillName: string): Promise<void> {
    await this.runQueueAction('update', () => this.orchestrator.update(skillName))
  }

  private async handleRepairSkill(skillName: string, scope: 'local' | 'global', agents: string[]): Promise<void> {
    await this.runQueueAction('repair', () => this.orchestrator.repair(skillName, scope, agents))
  }

  private handleCancelOperation(operationId: string): void {
    this.orchestrator.cancel(operationId)
  }

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

  async runCommandPaletteUpdate(): Promise<void> {
    const registry = await this.loadRegistryForCommand()
    if (!registry) return
    const installedSkills = await this.reconciler.getInstalledSkills()
    const installedHashes = await this.skillLockService.getInstalledHashes()
    const selectedSkills = await this.pickSkills(
      'update',
      registry,
      installedSkills,
      undefined,
      installedHashes,
    )
    if (!selectedSkills || selectedSkills.length === 0) return

    for (const skillName of selectedSkills) {
      await this.runQueueAction('update', () => this.orchestrator.update(skillName))
    }
  }

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

  private async enqueueInstall(
    skillName: string,
    scope: 'local' | 'global' | 'all',
    agents: string[],
  ): Promise<void> {
    if (scope === 'all') {
      await this.orchestrator.install(skillName, 'local', agents)
      await this.orchestrator.install(skillName, 'global', agents)
      return
    }
    await this.orchestrator.install(skillName, scope, agents)
  }

  private async enqueueRemove(
    skillName: string,
    scope: 'local' | 'global' | 'all',
    agents: string[],
  ): Promise<void> {
    if (scope === 'all') {
      await this.orchestrator.remove(skillName, 'local', agents)
      await this.orchestrator.remove(skillName, 'global', agents)
      return
    }
    await this.orchestrator.remove(skillName, scope, agents)
  }

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

  private describeAgentInstallStatus(installed?: AgentInstallInfo): string {
    if (!installed) return ''
    if (installed.local) return 'Installed locally'
    if (installed.global) return 'Installed globally'
    return ''
  }

  private describeInstalledScopes(installed: AgentInstallInfo): string {
    const scopes: string[] = []
    if (installed.local) scopes.push('Local')
    if (installed.global) scopes.push('Global')
    return scopes.join(' + ')
  }

  private findAgentInstall(installedInfo: InstalledSkillInfo | null, agentId: string): AgentInstallInfo | undefined {
    return installedInfo?.agents.find((ia) => ia.agent === agentId)
  }

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

  private hasAgentSatisfying(
    agents: string[],
    installedInfo: InstalledSkillInfo | null,
    predicate: (installed: AgentInstallInfo | undefined) => boolean,
  ): boolean {
    return agents.some((agentId) => predicate(this.findAgentInstall(installedInfo, agentId)))
  }

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

    const quickPick = vscode.window.createQuickPick<SkillQuickPickItem>()
    quickPick.canSelectMany = true
    quickPick.title = this.getSkillQuickPickTitle(mode)
    quickPick.placeholder = 'Filter skills or type @category'
    quickPick.matchOnDescription = true
    quickPick.matchOnDetail = true
    quickPick.items = items
    quickPick.show()

    const fuse = new Fuse(items, {
      keys: ['label', 'description', 'detail'],
      threshold: 0.4,
    })

    const disposables: vscode.Disposable[] = []
    let resolved = false

    disposables.push(
      quickPick.onDidChangeValue((value) => {
        const { categoryId, textQuery } = this.parseSkillQuery(value)
        let filtered = items
        const normalizedCategory = categoryId ? categoryId.toLowerCase() : null

        if (categoryId) {
          if (!this.categoryExists(registry, normalizedCategory)) {
            filtered = []
            quickPick.placeholder = `No category matches '@${categoryId}'`
          } else {
            filtered = filtered.filter((item) => this.normalizeCategoryId(item.categoryId) === normalizedCategory)
            quickPick.placeholder = 'Filter skills or type @category'
          }
        } else {
          quickPick.placeholder = 'Filter skills or type @category'
        }

        if (textQuery) {
          const results = fuse.search(textQuery)
          const matches = new Set(results.map((result) => result.item.skillName))
          filtered = filtered.filter((item) => matches.has(item.skillName))
        }

        quickPick.items = filtered
      }),
    )

    const selection = await new Promise<SkillQuickPickItem[] | null>((resolve) => {
      const accept = quickPick.onDidAccept(() => {
        if (resolved) return
        resolved = true
        resolve([...quickPick.selectedItems])
        quickPick.hide()
      })

      const hide = quickPick.onDidHide(() => {
        if (resolved) return
        resolved = true
        resolve(null)
      })

      disposables.push(accept, hide)
    })

    disposables.forEach((disposable) => disposable.dispose())
    quickPick.dispose()

    if (!selection || selection.length === 0) {
      return null
    }

    return selection.map((item) => item.skillName)
  }

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
      if (
        !this.isSkillCandidate(skill, installedInfo, mode, availableAgents, installedHashes ?? undefined)
      ) {
        continue
      }

      const categoryName = registry.categories[skill.category]?.name ?? skill.category
      const detail = this.getSkillDetailForMode(skill, installedHashes, installedInfo, mode)
      const description = mode === 'update' ? detail : categoryName
      const itemDetail = mode === 'update' ? categoryName : detail

      items.push({
        label: skill.name,
        description,
        detail: itemDetail,
        skillName: skill.name,
        categoryId: skill.category,
        registryHash: skill.contentHash,
        localHash: installedHashes?.[skill.name],
      })
    }

    return items
  }

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

  private parseSkillQuery(value: string): { categoryId: string | null; textQuery: string } {
    const tokens = value.split(/\s+/).filter((token) => token.length > 0)
    let categoryId: string | null = null
    const remaining: string[] = []
    for (const token of tokens) {
      if (categoryId === null && token.startsWith('@') && token.length > 1) {
        categoryId = token.slice(1)
        continue
      }
      remaining.push(token)
    }
    return { categoryId: categoryId?.toLowerCase() ?? null, textQuery: remaining.join(' ') }
  }

  private categoryExists(registry: SkillRegistry, categoryId: string | null): boolean {
    if (!categoryId) return false
    return Object.keys(registry.categories).some(
      (key) => this.normalizeCategoryId(key) === this.normalizeCategoryId(categoryId),
    )
  }

  private normalizeCategoryId(categoryId: string): string {
    return categoryId.trim().toLowerCase()
  }

  private shortenHash(hash: string | undefined): string {
    const normalized = hash ?? 'unknown'
    return normalized.length <= 7 ? normalized : normalized.slice(0, 7)
  }

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

  private canRemoveGlobalForSkills(skillNames: string[], agents: string[], installedSkills: InstalledSkillsMap): boolean {
    return skillNames.some((skillName) =>
      this.hasAgentSatisfying(agents, installedSkills[skillName] ?? null, (installed) => installed?.global === true),
    )
  }

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
      return this.hasAgentSatisfying(
        agents,
        installedInfo,
        (installed) => (action === 'add' ? !installed?.local : installed?.local === true),
      )
    }

    return this.hasAgentSatisfying(
      agents,
      installedInfo,
      (installed) => (action === 'add' ? !installed?.global : installed?.global === true),
    )
  }

  private getAgentDisplayNames(agentIds: string[], availableAgents: AvailableAgent[]): string[] {
    return agentIds.map(
      (id) => availableAgents.find((agent) => agent.agent === id)?.displayName ?? id,
    )
  }

  private async confirmBatchRemoval(skills: string[], agents: string, scope: ScopeQuickPickItem['scopeId']): Promise<boolean> {
    const scopeLabel = scope === 'all' ? 'Local + Global' : scope
    const skillList = skills.join(', ')
    const message = `Remove ${skills.length} skill(s) (${skillList}) from ${agents} (${scopeLabel})? This will delete the skill files.`
    const selection = await vscode.window.showWarningMessage(message, { modal: true }, 'Remove')
    return selection === 'Remove'
  }

  private getScopeAgents(installedInfo: InstalledSkillInfo, scope: 'local' | 'global'): string[] {
    return installedInfo.agents.filter((agent) => agent[scope]).map((agent) => agent.agent)
  }

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
   */
  private async loadAndPushRegistry(webview: vscode.Webview, forceRefresh = false): Promise<void> {
    // Send loading status
    await this.postMessage({
      type: 'registryUpdate',
      payload: { status: 'loading', registry: null },
    })

    try {
      const { data: registry, fromCache, offline }: RegistryResult = await this.registryService.getRegistryWithMetadata(
        forceRefresh,
      )
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

  private async confirmRemoval(skillName: string, agentNames: string, scope: string): Promise<boolean> {
    const message = `Remove skill '${skillName}' from ${agentNames} (${scope === 'all' ? 'Local + Global' : scope})? This will delete the skill files.`
    const selection = await vscode.window.showWarningMessage(message, { modal: true }, 'Remove')
    return selection === 'Remove'
  }

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

  private getNonce(): string {
    const array = new Uint32Array(4)
    crypto.getRandomValues(array)
    return Array.from(array, (n) => n.toString(36)).join('')
  }
}
