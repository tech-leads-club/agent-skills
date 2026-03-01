import type * as vscode from 'vscode'
import type { WebviewMessage } from '../shared/messages'
import type { LoggingService } from './logging-service'

/**
 * Callback contract used by {@link MessageRouter} for webview message dispatch.
 */
export interface MessageRouteHandlers {
  handleWebviewDidMount(message: WebviewMessage, webview: vscode.Webview): Promise<void>
  handleRefreshRequest(webview: vscode.Webview): Promise<void>
  handleInstallSkill(skillName: string, scope: 'local' | 'global' | 'all', agents: string[]): Promise<void>
  handleRemoveSkill(skillName: string, scope: 'local' | 'global' | 'all', agents: string[]): Promise<void>
  handleExecuteBatch(
    action: 'install' | 'remove' | 'update' | 'repair',
    skills: string[],
    agents: string[],
    scope: 'local' | 'global',
  ): Promise<void>
  handleUpdateSkill(skillName: string): Promise<void>
  handleRepairSkill(skillName: string, scope: 'local' | 'global', agents: string[]): Promise<void>
  handleCancelOperation(operationId: string): void
}

/**
 * Routes validated webview messages to their typed handlers.
 */
export class MessageRouter {
  /**
   * Creates a message router.
   *
   * @param logger - Logger used for unsupported-message diagnostics.
   * @param handlers - Handler callbacks invoked by message type.
   */
  constructor(
    private readonly logger: LoggingService,
    private readonly handlers: MessageRouteHandlers,
  ) {}

  /**
   * Routes a single webview message to a typed handler.
   *
   * @param message - Message received from the webview runtime.
   * @param webview - Source webview instance.
   * @returns A promise that resolves when routing completes.
   *
   * @example
   * ```ts
   * await router.route({ type: 'requestRefresh' }, webview)
   * ```
   */
  async route(message: WebviewMessage, webview: vscode.Webview): Promise<void> {
    switch (message.type) {
      case 'webviewDidMount':
        await this.handlers.handleWebviewDidMount(message, webview)
        return
      case 'requestRefresh':
        await this.handlers.handleRefreshRequest(webview)
        return
      case 'installSkill':
        await this.handlers.handleInstallSkill(message.payload.skillName, message.payload.scope, message.payload.agents)
        return
      case 'removeSkill':
        await this.handlers.handleRemoveSkill(message.payload.skillName, message.payload.scope, message.payload.agents)
        return
      case 'executeBatch':
        await this.handlers.handleExecuteBatch(
          message.payload.action,
          message.payload.skills,
          message.payload.agents,
          message.payload.scope,
        )
        return
      case 'updateSkill':
        await this.handlers.handleUpdateSkill(message.payload.skillName)
        return
      case 'repairSkill':
        await this.handlers.handleRepairSkill(message.payload.skillName, message.payload.scope, message.payload.agents)
        return
      case 'cancelOperation':
        this.handlers.handleCancelOperation(message.payload.operationId)
        return
      default:
        this.logger.warn(`Unknown webview message type: ${(message as { type: string }).type}`)
    }
  }
}
