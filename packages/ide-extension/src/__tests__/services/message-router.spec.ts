import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type * as vscode from 'vscode'
import type { LoggingService } from '../../services/logging-service'
import { MessageRouter, type MessageRouteHandlers } from '../../services/message-router'
import type { WebviewMessage } from '../../shared/messages'

describe('MessageRouter', () => {
  let handlers: MessageRouteHandlers
  let logger: jest.Mocked<LoggingService>
  let router: MessageRouter
  let webview: vscode.Webview

  beforeEach(() => {
    handlers = {
      handleWebviewDidMount: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      handleRefreshRequest: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      handleInstallSkill: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      handleRemoveSkill: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      handleExecuteBatch: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      handleUpdateSkill: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      handleRepairSkill: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      handleCancelOperation: jest.fn<() => void>(),
    }
    logger = { warn: jest.fn() } as unknown as jest.Mocked<LoggingService>
    router = new MessageRouter(logger, handlers)
    webview = {} as vscode.Webview
  })

  it('routes installSkill messages to install handler', async () => {
    const message: WebviewMessage = {
      type: 'installSkill',
      payload: { skillName: 'abc', scope: 'local', agents: ['cursor'] },
    }

    await router.route(message, webview)

    expect(handlers.handleInstallSkill as jest.Mock).toHaveBeenCalledWith('abc', 'local', ['cursor'])
  })

  it('warns and no-ops on unsupported message types', async () => {
    await router.route({ type: 'unknown' } as unknown as WebviewMessage, webview)

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Unknown webview message type'))
  })
})
