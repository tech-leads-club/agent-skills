import * as vscode from 'vscode'
import type { InstallationOrchestrator } from '../services/installation-orchestrator'
import { LoggingService } from '../services/logging-service'
import { SkillRegistryService } from '../services/skill-registry-service'
import type { StateReconciler } from '../services/state-reconciler'
import type { ExtensionMessage, WebviewMessage } from '../shared/messages'
import type { InstalledSkillInfo } from '../shared/types'

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
  }

  private async postMessage(message: ExtensionMessage): Promise<void> {
    if (this.webviewView?.webview) {
      await this.webviewView.webview.postMessage(message)
    }
  }

  private async handleMessage(message: WebviewMessage, webview: vscode.Webview): Promise<void> {
    switch (message.type) {
      case 'webviewDidMount': {
        this.logger.info('Webview did mount')
        const version = this.context.extension.packageJSON.version ?? 'unknown'
        const availableAgents = await this.reconciler.getAvailableAgents()
        const hasWorkspace = !!vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0

        await this.postMessage({
          type: 'initialize',
          payload: { version, availableAgents, hasWorkspace },
        })
        // Trigger registry load and push to webview
        void this.loadAndPushRegistry(webview)
        // Trigger initial state reconciliation push
        void this.reconciler.reconcile()
        break
      }
      case 'requestRefresh': {
        this.logger.info('Refresh requested from webview')
        void this.loadAndPushRegistry(webview, true)
        void this.reconciler.reconcile()
        break
      }
      case 'requestAgentPick': {
        const { skillName, action } = message.payload
        void this.handleAgentPick(skillName, action)
        break
      }
      case 'requestScopePick': {
        const { skillName, action, agents } = message.payload
        void this.handleScopePick(skillName, action, agents)
        break
      }
      case 'installSkill': {
        const { skillName, agents, scope } = message.payload
        try {
          if (scope === 'all') {
            await this.orchestrator.install(skillName, 'local', agents)
            await this.orchestrator.install(skillName, 'global', agents)
          } else {
            await this.orchestrator.install(skillName, scope, agents)
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          this.logger.error(`Failed to enqueue install: ${msg}`)
          vscode.window.showErrorMessage(`Failed to start installation: ${msg}`)
        }
        break
      }
      case 'removeSkill': {
        const { skillName, agents, scope } = message.payload
        const agentNames = agents.join(', ')
        const confirmed = await this.confirmRemoval(skillName, agentNames, scope)
        if (!confirmed) return

        try {
          if (scope === 'all') {
            await this.orchestrator.remove(skillName, 'local', agents)
            await this.orchestrator.remove(skillName, 'global', agents)
          } else {
            await this.orchestrator.remove(skillName, scope, agents)
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          this.logger.error(`Failed to enqueue remove: ${msg}`)
          vscode.window.showErrorMessage(`Failed to start removal: ${msg}`)
        }
        break
      }
      case 'updateSkill': {
        const { skillName } = message.payload
        try {
          await this.orchestrator.update(skillName)
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          this.logger.error(`Failed to enqueue update: ${msg}`)
          vscode.window.showErrorMessage(`Failed to start update: ${msg}`)
        }
        break
      }
      case 'cancelOperation': {
        const { operationId } = message.payload
        this.orchestrator.cancel(operationId)
        break
      }
      default:
        this.logger.warn(`Unknown webview message type: ${(message as { type: string }).type}`)
    }
  }

  /**
   * Shows a multi-select QuickPick for agent selection.
   * For ADD: only agents with available (non-saturated) scope combinations are shown.
   * For REMOVE: only agents where the skill is currently installed are shown.
   */
  private async handleAgentPick(skillName: string, action: 'add' | 'remove'): Promise<void> {
    const availableAgents = await this.reconciler.getAvailableAgents()
    const installedSkills = await this.reconciler.getInstalledSkills()
    const installedInfo: InstalledSkillInfo | null = installedSkills[skillName] || null

    interface AgentQuickPickItem extends vscode.QuickPickItem {
      agentId: string
    }

    const agentItems: AgentQuickPickItem[] = []

    for (const agent of availableAgents) {
      const installed = installedInfo?.agents.find((ia) => ia.agent === agent.agent)

      if (action === 'add') {
        // Skip agents that are fully saturated (installed in both local + global)
        if (installed?.local && installed?.global) continue

        let description = ''
        if (installed) {
          if (installed.local) description = 'Installed locally'
          else if (installed.global) description = 'Installed globally'
        }

        agentItems.push({
          label: agent.displayName,
          description,
          agentId: agent.agent,
        })
      } else {
        // REMOVE: only show agents where the skill is installed
        if (!installed || (!installed.local && !installed.global)) continue

        const scopes = []
        if (installed.local) scopes.push('Local')
        if (installed.global) scopes.push('Global')

        agentItems.push({
          label: agent.displayName,
          description: scopes.join(' + '),
          agentId: agent.agent,
        })
      }
    }

    if (agentItems.length === 0) {
      const message =
        action === 'add'
          ? 'This skill is already installed for all agents in every scope.'
          : 'This skill is not installed for any agent.'
      vscode.window.showInformationMessage(message)
      return
    }

    const selected = await vscode.window.showQuickPick(agentItems, {
      title: `${action === 'add' ? 'Add' : 'Remove'} skill: ${skillName}`,
      placeHolder: 'Select agents',
      canPickMany: true,
    })

    if (!selected || selected.length === 0) {
      // User cancelled
      await this.postMessage({
        type: 'agentPickResult',
        payload: { skillName, action, agents: null },
      })
      return
    }

    const selectedAgentIds = selected.map((item) => item.agentId)

    // Send result and immediately proceed to scope pick
    await this.postMessage({
      type: 'agentPickResult',
      payload: { skillName, action, agents: selectedAgentIds },
    })

    // Automatically chain into scope pick
    void this.handleScopePick(skillName, action, selectedAgentIds)
  }

  /**
   * Shows a QuickPick for scope selection (Local, Global, All).
   * For ADD: only scopes where at least one selected agent is NOT yet installed are shown.
   * For REMOVE: only scopes where at least one selected agent IS installed are shown.
   */
  private async handleScopePick(skillName: string, action: 'add' | 'remove', agents: string[]): Promise<void> {
    const hasWorkspace = !!vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
    const installedSkills = await this.reconciler.getInstalledSkills()
    const installedInfo: InstalledSkillInfo | null = installedSkills[skillName] || null

    interface ScopeQuickPickItem extends vscode.QuickPickItem {
      scopeId: 'local' | 'global' | 'all'
    }

    const scopeItems: ScopeQuickPickItem[] = []

    if (action === 'add') {
      // Check if at least one selected agent is NOT installed locally
      const canAddLocal =
        hasWorkspace &&
        agents.some((agentId) => {
          const installed = installedInfo?.agents.find((ia) => ia.agent === agentId)
          return !installed || !installed.local
        })

      // Check if at least one selected agent is NOT installed globally
      const canAddGlobal = agents.some((agentId) => {
        const installed = installedInfo?.agents.find((ia) => ia.agent === agentId)
        return !installed || !installed.global
      })

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
      // REMOVE: only show scopes where at least one selected agent IS installed
      const canRemoveLocal =
        hasWorkspace &&
        agents.some((agentId) => {
          const installed = installedInfo?.agents.find((ia) => ia.agent === agentId)
          return installed?.local === true
        })

      const canRemoveGlobal = agents.some((agentId) => {
        const installed = installedInfo?.agents.find((ia) => ia.agent === agentId)
        return installed?.global === true
      })

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

    if (scopeItems.length === 0) {
      const message =
        action === 'add'
          ? 'This skill is already installed in all available scopes for the selected agents.'
          : 'This skill is not installed in any scope for the selected agents.'
      vscode.window.showInformationMessage(message)
      return
    }

    // If only one scope option is available, auto-select it
    let selectedScope: ScopeQuickPickItem
    if (scopeItems.length === 1) {
      selectedScope = scopeItems[0]
    } else {
      const picked = await vscode.window.showQuickPick(scopeItems, {
        title: `${action === 'add' ? 'Add' : 'Remove'} skill: ${skillName} — Select scope`,
        placeHolder:
          action === 'add' ? 'Where should the skill be installed?' : 'Where should the skill be removed from?',
      })

      if (!picked) {
        // User cancelled
        await this.postMessage({
          type: 'scopePickResult',
          payload: { skillName, action, agents, scope: null },
        })
        return
      }
      selectedScope = picked
    }

    // Send result back to webview
    await this.postMessage({
      type: 'scopePickResult',
      payload: { skillName, action, agents, scope: selectedScope.scopeId },
    })

    // Execute the action directly
    if (action === 'add') {
      try {
        if (selectedScope.scopeId === 'all') {
          await this.orchestrator.install(skillName, 'local', agents)
          await this.orchestrator.install(skillName, 'global', agents)
        } else {
          await this.orchestrator.install(skillName, selectedScope.scopeId, agents)
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        this.logger.error(`Failed to enqueue install: ${msg}`)
        vscode.window.showErrorMessage(`Failed to start installation: ${msg}`)
      }
    } else {
      const agentNames = agents.join(', ')
      const confirmed = await this.confirmRemoval(skillName, agentNames, selectedScope.scopeId)
      if (!confirmed) return

      try {
        if (selectedScope.scopeId === 'all') {
          await this.orchestrator.remove(skillName, 'local', agents)
          await this.orchestrator.remove(skillName, 'global', agents)
        } else {
          await this.orchestrator.remove(skillName, selectedScope.scopeId, agents)
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        this.logger.error(`Failed to enqueue remove: ${msg}`)
        vscode.window.showErrorMessage(`Failed to start removal: ${msg}`)
      }
    }
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
          fromCache: false, // TODO: detect if from cache
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
