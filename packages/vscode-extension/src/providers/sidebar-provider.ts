import * as vscode from 'vscode'
import { LoggingService } from '../services/logging-service'
import { SkillRegistryService } from '../services/skill-registry-service'
import type { ExtensionMessage, WebviewMessage } from '../shared/messages'

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'agentSkillsSidebar'

  private webviewView?: vscode.WebviewView

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly logger: LoggingService,
    private readonly registryService: SkillRegistryService,
  ) {}

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

  private async handleMessage(message: WebviewMessage, webview: vscode.Webview): Promise<void> {
    switch (message.type) {
      case 'webviewDidMount': {
        this.logger.info('Webview did mount')
        const version = this.context.extension.packageJSON.version ?? 'unknown'
        const response: ExtensionMessage = {
          type: 'initialize',
          payload: { version },
        }
        await webview.postMessage(response)
        // Trigger registry load and push to webview
        void this.loadAndPushRegistry(webview)
        break
      }
      case 'requestRefresh': {
        this.logger.info('Refresh requested from webview')
        void this.loadAndPushRegistry(webview, true)
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
    const loadingMsg: ExtensionMessage = {
      type: 'registryUpdate',
      payload: { status: 'loading', registry: null },
    }
    await webview.postMessage(loadingMsg)

    try {
      const registry = forceRefresh ? await this.registryService.refresh() : await this.registryService.getRegistry()

      const successMsg: ExtensionMessage = {
        type: 'registryUpdate',
        payload: {
          status: 'ready',
          registry,
          fromCache: false, // TODO: detect if from cache
        },
      }
      await webview.postMessage(successMsg)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      this.logger.error(`Failed to load registry: ${errorMessage}`)
      const errorMsg: ExtensionMessage = {
        type: 'registryUpdate',
        payload: {
          status: 'error',
          registry: null,
          errorMessage: errorMessage || 'Failed to load skill registry',
        },
      }
      await webview.postMessage(errorMsg)
    }
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
