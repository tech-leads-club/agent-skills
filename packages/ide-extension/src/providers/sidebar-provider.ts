import * as vscode from 'vscode'
import type { ActionRunner } from '../services/action-runner'
import type { InstalledStateSnapshot, InstalledStateStore } from '../services/installed-state-store'
import type { LoggingService } from '../services/logging-service'
import type { RegistryStore, RegistryStoreSnapshot } from '../services/registry-store'
import type { StateReconciler } from '../services/state-reconciler'
import type { ExtensionMessage, WebviewMessage } from '../shared/messages'
import type { ActionRequest, ScopePolicyEvaluation } from '../shared/types'
import { toPolicyStateMessage, toRegistryUpdateMessage } from './sidebar-provider-messages'
import { getSidebarWebviewHtml } from './sidebar-webview-html'

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'agentSkillsSidebar'

  private webviewView?: vscode.WebviewView
  private policy?: ScopePolicyEvaluation

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly logger: LoggingService,
    private readonly registryStore: RegistryStore,
    private readonly actionRunner: ActionRunner,
    private readonly reconciler: StateReconciler,
    private readonly installedStateStore: InstalledStateStore,
  ) {
    this.context.subscriptions.push(
      this.registryStore.subscribe((snapshot) => void this.postRegistrySnapshot(snapshot)),
      this.installedStateStore.subscribe((snapshot) => void this.postInstalledState(snapshot)),
      this.actionRunner.subscribe(() => void this.postActionState()),
    )
  }

  public updatePolicy(policy: ScopePolicyEvaluation): void {
    this.policy = policy
    void this.postPolicyState(policy)
  }

  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.logger.info('Resolving sidebar webview')
    this.webviewView = webviewView
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    }
    webviewView.webview.html = getSidebarWebviewHtml(this.context.extensionUri, webviewView.webview)

    this.context.subscriptions.push(
      webviewView.webview.onDidReceiveMessage((message: WebviewMessage) => this.handleMessage(message)),
      vscode.workspace.onDidGrantWorkspaceTrust(() => {
        void this.postMessage({ type: 'trustState', payload: { isTrusted: true } })
      }),
    )
  }

  private async handleMessage(message: WebviewMessage): Promise<void> {
    try {
      switch (message.type) {
        case 'webviewDidMount':
          await this.handleWebviewDidMount()
          return
        case 'requestRefresh':
          await this.handleRefreshRequest()
          return
        case 'requestRunAction':
          await this.handleRequestRunAction(message.payload)
          return
        default:
          this.logger.warn(`Unknown webview message type: ${(message as { type: string }).type}`)
      }
    } catch (error: unknown) {
      this.logger.error(`Failed to handle webview message: ${message.type}`, error)
    }
  }

  private async handleWebviewDidMount(): Promise<void> {
    this.logger.info('Webview did mount')
    const version = this.context.extension.packageJSON.version ?? 'unknown'
    const availableAgents = await this.reconciler.getAvailableAgents()
    const allAgents = this.reconciler.getAllAgents()
    const hasWorkspace = Boolean(vscode.workspace.workspaceFolders?.length)

    await this.postMessage({ type: 'initialize', payload: { version, availableAgents, allAgents, hasWorkspace } })
    await this.postInstalledState(this.installedStateStore.getSnapshot())
    await this.postActionState()
    await this.postMessage({ type: 'trustState', payload: { isTrusted: vscode.workspace.isTrusted } })

    if (this.policy) {
      await this.postPolicyState(this.policy)
    }

    await this.postRegistrySnapshot(this.registryStore.getSnapshot())
    void this.registryStore.prime()
    void this.installedStateStore.refresh()
  }

  private async handleRefreshRequest(): Promise<void> {
    this.logger.info('Refresh requested from webview')
    void this.registryStore.refresh()
    void this.installedStateStore.refresh()
  }

  private async handleRequestRunAction(request: ActionRequest): Promise<void> {
    const needsSelections = request.action === 'install' || request.action === 'remove'
    if (needsSelections && (request.skills.length === 0 || request.agents.length === 0)) {
      vscode.window.showErrorMessage('Select at least one skill and one agent before proceeding.')
      return
    }

    await this.runActionRequest(request)
  }

  private async runActionRequest(request: ActionRequest): Promise<void> {
    try {
      await this.actionRunner.run(request)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to start ${request.action}: ${message}`, error)
      const action = request.action === 'install' ? 'installation' : request.action === 'remove' ? 'removal' : 'update'
      vscode.window.showErrorMessage(`Failed to start ${action}: ${message}`)
    }
  }

  private async postMessage(message: ExtensionMessage): Promise<void> {
    if (this.webviewView?.webview) {
      await this.webviewView.webview.postMessage(message)
    }
  }

  private async postInstalledState(snapshot: InstalledStateSnapshot): Promise<void> {
    await this.postMessage({ type: 'reconcileState', payload: { installedSkills: snapshot.installedSkills } })
  }

  private async postActionState(): Promise<void> {
    await this.postMessage({ type: 'actionState', payload: this.actionRunner.getState() })
  }

  private async postRegistrySnapshot(snapshot: RegistryStoreSnapshot): Promise<void> {
    await this.postMessage(toRegistryUpdateMessage(snapshot))
  }

  private async postPolicyState(policy: ScopePolicyEvaluation): Promise<void> {
    await this.postMessage(toPolicyStateMessage(policy))
  }
}
