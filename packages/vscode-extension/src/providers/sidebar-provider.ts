import * as vscode from 'vscode'
import type { InstallationOrchestrator } from '../services/installation-orchestrator'
import { LoggingService } from '../services/logging-service'
import { SkillRegistryService } from '../services/skill-registry-service'
import type { StateReconciler } from '../services/state-reconciler'
import type { ExtensionMessage, WebviewMessage } from '../shared/messages'

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
      case 'installSkill': {
        const { skillName, agent, scope } = message.payload
        const agents = [agent]
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
        const { skillName, agent, scope } = message.payload
        const confirmed = await this.confirmRemoval(skillName, agent, scope)
        if (!confirmed) return

        const agents = [agent]
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

  private async confirmRemoval(skillName: string, agent: string, scope: string): Promise<boolean> {
    const message = `Remove skill '${skillName}' from ${agent} (${scope === 'all' ? 'Local + Global' : scope})? This will delete the skill files.`
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
