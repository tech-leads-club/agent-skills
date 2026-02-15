import * as vscode from 'vscode'
import { SidebarProvider } from '../../providers/sidebar-provider'
import { LoggingService } from '../../services/logging-service'
import { SkillRegistryService } from '../../services/skill-registry-service'
import { WebviewMessage } from '../../shared/messages'
import type { SkillRegistry } from '../../shared/types'

// Mock vscode module (handled by jest.config.ts moduleNameMapper)

describe('SidebarProvider', () => {
  let provider: SidebarProvider
  let context: vscode.ExtensionContext
  let logger: LoggingService
  let registryService: SkillRegistryService
  let webviewView: vscode.WebviewView
  let messageHandler: (message: WebviewMessage) => void

  const mockRegistry: SkillRegistry = {
    version: '1.0.0',
    categories: {},
    skills: [],
  }

  beforeEach(() => {
    // Mock ExtensionContext
    context = {
      extensionUri: { fsPath: '/test/extension/uri' },
      subscriptions: [],
      extension: {
        packageJSON: {
          version: '1.2.3',
        },
      },
    } as unknown as vscode.ExtensionContext

    // Mock LoggingService
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      dispose: jest.fn(),
    } as unknown as LoggingService

    // Mock SkillRegistryService
    registryService = {
      getRegistry: jest.fn().mockResolvedValue(mockRegistry),
      refresh: jest.fn().mockResolvedValue(mockRegistry),
      dispose: jest.fn(),
    } as unknown as SkillRegistryService

    // Mock WebviewView
    webviewView = {
      webview: {
        options: {},
        html: '',
        cspSource: 'vscode-webview:',
        asWebviewUri: jest.fn((uri: { fsPath: string }) => uri.fsPath),
        onDidReceiveMessage: jest.fn((handler: (message: WebviewMessage) => void) => {
          messageHandler = handler
          return { dispose: jest.fn() }
        }),
        postMessage: jest.fn(),
      },
    } as unknown as vscode.WebviewView

    provider = new SidebarProvider(context, logger, registryService)
  })

  it('should have the correct viewType', () => {
    expect(SidebarProvider.viewType).toBe('agentSkillsSidebar')
  })

  it('should enable scripts in webview options', () => {
    provider.resolveWebviewView(webviewView)
    expect(webviewView.webview.options.enableScripts).toBe(true)
  })

  it('should set localResourceRoots in webview options', () => {
    provider.resolveWebviewView(webviewView)
    expect(webviewView.webview.options.localResourceRoots).toEqual([context.extensionUri])
  })

  it('should generate HTML with correct scripts and styles', () => {
    provider.resolveWebviewView(webviewView)
    const html = webviewView.webview.html

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<div id="root"></div>')
    expect(html).toContain('src="/test/extension/uri/dist/webview/index.js"')
    expect(html).toContain('href="/test/extension/uri/dist/webview/index.css"')
    expect(webviewView.webview.asWebviewUri).toHaveBeenCalledTimes(2)
  })

  it('should generate HTML with nonce-based CSP', () => {
    provider.resolveWebviewView(webviewView)
    const html = webviewView.webview.html

    // Extract nonce
    const nonceMatch = html.match(/nonce="([^"]+)"/)
    expect(nonceMatch).toBeTruthy()
    const nonce = nonceMatch![1]

    expect(html).toContain(`script-src 'nonce-${nonce}'`)
    expect(html).toContain(`style-src ${webviewView.webview.cspSource} 'unsafe-inline'`)
  })

  it('should register message handler', () => {
    provider.resolveWebviewView(webviewView)
    expect(webviewView.webview.onDidReceiveMessage).toHaveBeenCalled()
    expect(context.subscriptions).toHaveLength(1)
  })

  it('should handle webviewDidMount message', () => {
    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = { type: 'webviewDidMount' }

    messageHandler(message)

    expect(logger.info).toHaveBeenCalledWith('Webview did mount')
    expect(webviewView.webview.postMessage).toHaveBeenCalledWith({
      type: 'initialize',
      payload: { version: '1.2.3' },
    })
  })

  it('should handle unknown messages gracefully', () => {
    provider.resolveWebviewView(webviewView)
    const message = { type: 'unknown-type' } as unknown as WebviewMessage

    messageHandler(message)

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Unknown webview message type'))
    expect(webviewView.webview.postMessage).not.toHaveBeenCalled()
  })

  it('should log info when resolving webview view', () => {
    provider.resolveWebviewView(webviewView)
    expect(logger.info).toHaveBeenCalledWith('Resolving sidebar webview')
  })

  // NEW TESTS FOR REGISTRY HANDLING

  it('should send loading status then registryUpdate on webviewDidMount', async () => {
    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = { type: 'webviewDidMount' }

    await messageHandler(message)

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(webviewView.webview.postMessage).toHaveBeenCalledWith({
      type: 'registryUpdate',
      payload: { status: 'loading', registry: null },
    })
    expect(webviewView.webview.postMessage).toHaveBeenCalledWith({
      type: 'registryUpdate',
      payload: {
        status: 'ready',
        registry: mockRegistry,
        fromCache: false,
      },
    })
    expect(registryService.getRegistry).toHaveBeenCalled()
  })

  it('should trigger registry refresh on requestRefresh message', async () => {
    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = { type: 'requestRefresh' }

    await messageHandler(message)

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(registryService.refresh).toHaveBeenCalled()
    expect(webviewView.webview.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'registryUpdate',
      }),
    )
  })

  it('should handle registry service error gracefully', async () => {
    ;(registryService.getRegistry as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = { type: 'webviewDidMount' }

    await messageHandler(message)

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to load registry'))
    expect(webviewView.webview.postMessage).toHaveBeenCalledWith({
      type: 'registryUpdate',
      payload: {
        status: 'error',
        registry: null,
        errorMessage: expect.stringContaining('Network error'),
      },
    })
  })
})
