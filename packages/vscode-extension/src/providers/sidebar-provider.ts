import * as vscode from 'vscode'
import type { InstallationOrchestrator } from '../services/installation-orchestrator'
import { LoggingService } from '../services/logging-service'
import { SkillRegistryService } from '../services/skill-registry-service'
import type { StateReconciler } from '../services/state-reconciler'
import type { ExtensionMessage, WebviewMessage } from '../shared/messages'
import type { AgentInstallInfo, AvailableAgent, InstalledSkillInfo } from '../shared/types'

interface AgentQuickPickItem extends vscode.QuickPickItem {
  agentId: string
}

interface ScopeQuickPickItem extends vscode.QuickPickItem {
  scopeId: 'local' | 'global' | 'all'
}

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
    const hasWorkspace = !!vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0

    await this.postMessage({
      type: 'initialize',
      payload: { version, availableAgents, hasWorkspace },
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
      const registry = forceRefresh ? await this.registryService.refresh() : await this.registryService.getRegistry()

      await this.postMessage({
        type: 'registryUpdate',
          payload: {
            status: 'ready',
            registry,
            fromCache: false, // #TODO: Propagate registry metadata so we know when cache data is returned.
          },
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
