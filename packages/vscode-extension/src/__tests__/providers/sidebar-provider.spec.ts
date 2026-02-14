import * as vscode from 'vscode'
import { SidebarProvider } from '../../providers/sidebar-provider'
import { LoggingService } from '../../services/logging-service'

// Mock vscode module (handled by jest.config.ts moduleNameMapper)

describe('SidebarProvider', () => {
  let provider: SidebarProvider
  let context: vscode.ExtensionContext
  let logger: LoggingService
  let webviewView: vscode.WebviewView

  beforeEach(() => {
    // Mock ExtensionContext
    context = {
      extensionUri: { fsPath: '/test/extension/uri' },
      subscriptions: [],
    } as unknown as vscode.ExtensionContext

    // Mock LoggingService
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      dispose: jest.fn(),
    } as unknown as LoggingService

    // Mock WebviewView
    webviewView = {
      webview: {
        options: {},
        html: '',
      },
    } as unknown as vscode.WebviewView

    provider = new SidebarProvider(context, logger)
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

  it('should set HTML content with correct title', () => {
    provider.resolveWebviewView(webviewView)
    expect(webviewView.webview.html).toContain('Agent Skills Manager')
    expect(webviewView.webview.html).toContain('<!DOCTYPE html>')
  })

  it('should set HTML content with Content-Security-Policy', () => {
    provider.resolveWebviewView(webviewView)
    expect(webviewView.webview.html).toContain(
      '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\';">',
    )
  })

  it('should log info when resolving webview view', () => {
    provider.resolveWebviewView(webviewView)
    expect(logger.info).toHaveBeenCalledWith('Resolving sidebar webview')
  })
})
