import { jest } from '@jest/globals'
import * as vscode from 'vscode'
import { SidebarProvider } from '../../providers/sidebar-provider'
import type { InstallationOrchestrator } from '../../services/installation-orchestrator'
import { LoggingService } from '../../services/logging-service'
import { SkillRegistryService } from '../../services/skill-registry-service'
import type { StateReconciler } from '../../services/state-reconciler'
import { WebviewMessage } from '../../shared/messages'
import type { SkillRegistry } from '../../shared/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockableFn = (...args: any[]) => any

// Mock vscode module (handled by jest.config.ts moduleNameMapper)

describe('SidebarProvider', () => {
  let provider: SidebarProvider
  let context: vscode.ExtensionContext
  let logger: LoggingService
  let registryService: SkillRegistryService
  let orchestrator: InstallationOrchestrator
  let reconciler: StateReconciler
  let webviewView: vscode.WebviewView
  let messageHandler: (message: WebviewMessage) => void

  const mockRegistry: SkillRegistry = {
    version: '1.0.0',
    categories: {},
    skills: [],
  }

  beforeEach(() => {
    // Reset all mocks (including module-level vscode mocks and their implementations)
    jest.resetAllMocks()

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
      info: jest.fn<MockableFn>(),
      warn: jest.fn<MockableFn>(),
      error: jest.fn<MockableFn>(),
      debug: jest.fn<MockableFn>(),
      dispose: jest.fn<MockableFn>(),
    } as unknown as LoggingService

    // Mock SkillRegistryService
    registryService = {
      getRegistry: jest.fn<MockableFn>().mockResolvedValue(mockRegistry),
      refresh: jest.fn<MockableFn>().mockResolvedValue(mockRegistry),
      dispose: jest.fn<MockableFn>(),
    } as unknown as SkillRegistryService

    // Mock InstallationOrchestrator
    orchestrator = {
      install: jest.fn<MockableFn>().mockResolvedValue(undefined),
      remove: jest.fn<MockableFn>().mockResolvedValue(undefined),
      update: jest.fn<MockableFn>().mockResolvedValue(undefined),
      cancel: jest.fn<MockableFn>(),
      onOperationEvent: jest.fn<MockableFn>().mockReturnValue({ dispose: jest.fn<MockableFn>() }),
      dispose: jest.fn<MockableFn>(),
    } as unknown as InstallationOrchestrator

    // Mock StateReconciler
    reconciler = {
      reconcile: jest.fn<MockableFn>().mockResolvedValue(undefined),
      getAvailableAgents: jest.fn<MockableFn>().mockResolvedValue([]),
      getInstalledSkills: jest.fn<MockableFn>().mockResolvedValue({}),
      onStateChanged: jest.fn<MockableFn>().mockReturnValue({ dispose: jest.fn<MockableFn>() }),
      start: jest.fn<MockableFn>(),
      dispose: jest.fn<MockableFn>(),
    } as unknown as StateReconciler

    // Mock WebviewView
    webviewView = {
      webview: {
        options: {},
        html: '',
        cspSource: 'vscode-webview:',
        asWebviewUri: jest.fn<MockableFn>((uri: { fsPath: string }) => uri.fsPath),
        onDidReceiveMessage: jest.fn<MockableFn>((handler: (message: WebviewMessage) => void) => {
          messageHandler = handler
          return { dispose: jest.fn<MockableFn>() }
        }),
        postMessage: jest.fn<MockableFn>(),
      },
    } as unknown as vscode.WebviewView

    provider = new SidebarProvider(context, logger, registryService, orchestrator, reconciler)
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
    expect(context.subscriptions).toHaveLength(2)
  })

  it('should handle webviewDidMount message', async () => {
    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = { type: 'webviewDidMount' }

    await messageHandler(message)

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(logger.info).toHaveBeenCalledWith('Webview did mount')
    expect(webviewView.webview.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'initialize',
        payload: expect.objectContaining({
          version: '1.2.3',
          availableAgents: expect.arrayContaining([]),
          hasWorkspace: expect.any(Boolean),
        }),
      }),
    )
  })

  it('should handle unknown messages gracefully', async () => {
    provider.resolveWebviewView(webviewView)
    const message = { type: 'unknown-type' } as unknown as WebviewMessage

    await messageHandler(message)

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Unknown webview message type'))
  })

  it('should log info when resolving webview view', () => {
    provider.resolveWebviewView(webviewView)
    expect(logger.info).toHaveBeenCalledWith('Resolving sidebar webview')
  })

  // TESTS FOR REGISTRY HANDLING

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
    ;(registryService.getRegistry as jest.Mock<MockableFn>).mockRejectedValueOnce(new Error('Network error'))

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

  // TESTS FOR QUICK PICK FLOW

  it('should show quick pick with available agents (no "All" option)', async () => {
    ;(reconciler.getAvailableAgents as jest.Mock<MockableFn>).mockResolvedValue([
      { agent: 'cursor', displayName: 'Cursor' },
      { agent: 'claude-code', displayName: 'Claude Code' },
    ])
    ;(vscode.window.showQuickPick as jest.Mock<MockableFn>).mockResolvedValue(null) // User cancels

    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = {
      type: 'requestAgentPick',
      payload: { skillName: 'test-skill', action: 'add' },
    }

    await messageHandler(message)
    await new Promise((resolve) => setTimeout(resolve, 10))

    const quickPickCall = (vscode.window.showQuickPick as jest.Mock<MockableFn>).mock.calls[0]
    const items = quickPickCall[0] as Array<{ label: string; agentId: string }>

    // Should NOT contain "All" option
    expect(items.find((i) => i.agentId === '__all__')).toBeUndefined()
    // Should contain both agents
    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Cursor', agentId: 'cursor' }),
        expect.objectContaining({ label: 'Claude Code', agentId: 'claude-code' }),
      ]),
    )
    expect(quickPickCall[1]).toEqual(
      expect.objectContaining({
        canPickMany: true,
        title: expect.stringContaining('test-skill'),
      }),
    )
  })

  it('should send null agents when agent pick is cancelled', async () => {
    ;(reconciler.getAvailableAgents as jest.Mock<MockableFn>).mockResolvedValue([
      { agent: 'cursor', displayName: 'Cursor' },
    ])
    ;(vscode.window.showQuickPick as jest.Mock<MockableFn>).mockResolvedValue(null)

    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = {
      type: 'requestAgentPick',
      payload: { skillName: 'test-skill', action: 'add' },
    }

    await messageHandler(message)
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(webviewView.webview.postMessage).toHaveBeenCalledWith({
      type: 'agentPickResult',
      payload: { skillName: 'test-skill', action: 'add', agents: null },
    })
  })

  it('should exclude fully saturated agents from ADD pick', async () => {
    ;(reconciler.getAvailableAgents as jest.Mock<MockableFn>).mockResolvedValue([
      { agent: 'cursor', displayName: 'Cursor' },
      { agent: 'claude-code', displayName: 'Claude Code' },
    ])
    // cursor is fully installed (local + global), claude-code is not
    ;(reconciler.getInstalledSkills as jest.Mock<MockableFn>).mockResolvedValue({
      'test-skill': {
        local: true,
        global: true,
        agents: [
          { agent: 'cursor', displayName: 'Cursor', local: true, global: true },
          { agent: 'claude-code', displayName: 'Claude Code', local: false, global: false },
        ],
      },
    })
    ;(vscode.window.showQuickPick as jest.Mock<MockableFn>).mockResolvedValue(null) // User cancels

    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = {
      type: 'requestAgentPick',
      payload: { skillName: 'test-skill', action: 'add' },
    }

    await messageHandler(message)
    await new Promise((resolve) => setTimeout(resolve, 10))

    const quickPickCall = (vscode.window.showQuickPick as jest.Mock<MockableFn>).mock.calls[0]
    const items = quickPickCall[0] as Array<{ label: string; agentId: string }>

    // cursor should be excluded (fully saturated)
    expect(items.find((i) => i.agentId === 'cursor')).toBeUndefined()
    // claude-code should be included
    expect(items).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: 'Claude Code', agentId: 'claude-code' })]),
    )
  })

  it('should only show installed agents in REMOVE pick', async () => {
    ;(reconciler.getAvailableAgents as jest.Mock<MockableFn>).mockResolvedValue([
      { agent: 'cursor', displayName: 'Cursor' },
      { agent: 'claude-code', displayName: 'Claude Code' },
      { agent: 'opencode', displayName: 'OpenCode' },
    ])
    // Only opencode has the skill installed
    ;(reconciler.getInstalledSkills as jest.Mock<MockableFn>).mockResolvedValue({
      'test-skill': {
        local: true,
        global: false,
        agents: [{ agent: 'opencode', displayName: 'OpenCode', local: true, global: false }],
      },
    })
    ;(vscode.window.showQuickPick as jest.Mock<MockableFn>).mockResolvedValue(null) // User cancels

    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = {
      type: 'requestAgentPick',
      payload: { skillName: 'test-skill', action: 'remove' },
    }

    await messageHandler(message)
    await new Promise((resolve) => setTimeout(resolve, 10))

    const quickPickCall = (vscode.window.showQuickPick as jest.Mock<MockableFn>).mock.calls[0]
    const items = quickPickCall[0] as Array<{ label: string; agentId: string }>

    // Only opencode should be in the list
    expect(items).toHaveLength(1)
    expect(items[0]).toEqual(expect.objectContaining({ label: 'OpenCode', agentId: 'opencode' }))
  })

  it('should only show "Locally" scope when skill is only installed locally for REMOVE', async () => {
    ;(reconciler.getAvailableAgents as jest.Mock<MockableFn>).mockResolvedValue([
      { agent: 'opencode', displayName: 'OpenCode' },
    ])
    ;(reconciler.getInstalledSkills as jest.Mock<MockableFn>).mockResolvedValue({
      'test-skill': {
        local: true,
        global: false,
        agents: [{ agent: 'opencode', displayName: 'OpenCode', local: true, global: false }],
      },
    })
    // User selects opencode for removal
    ;(vscode.window.showQuickPick as jest.Mock<MockableFn>).mockResolvedValueOnce([
      { label: 'OpenCode', agentId: 'opencode' },
    ]) // agent pick
    ;(vscode.window.showWarningMessage as jest.Mock<MockableFn>).mockResolvedValue('Remove')

    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = {
      type: 'requestAgentPick',
      payload: { skillName: 'test-skill', action: 'remove' },
    }

    await messageHandler(message)
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Scope pick should NOT have been shown (auto-selected since only 1 option)
    // showQuickPick called once for agent pick only
    expect(vscode.window.showQuickPick).toHaveBeenCalledTimes(1)

    // Should still call remove with local scope
    expect(orchestrator.remove).toHaveBeenCalledWith('test-skill', 'local', ['opencode'])
  })

  it('should chain to scope pick after agent selection', async () => {
    ;(reconciler.getAvailableAgents as jest.Mock<MockableFn>).mockResolvedValue([
      { agent: 'cursor', displayName: 'Cursor' },
    ])
    ;(reconciler.getInstalledSkills as jest.Mock<MockableFn>).mockResolvedValue({}) // not installed
    ;(vscode.window.showQuickPick as jest.Mock<MockableFn>)
      .mockResolvedValueOnce([{ label: 'Cursor', agentId: 'cursor' }]) // agent pick
      .mockResolvedValueOnce({ label: 'Locally', scopeId: 'local' }) // scope pick

    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = {
      type: 'requestAgentPick',
      payload: { skillName: 'test-skill', action: 'add' },
    }

    await messageHandler(message)
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Should have called showQuickPick twice (agent + scope)
    expect(vscode.window.showQuickPick).toHaveBeenCalledTimes(2)

    // Should install the skill
    expect(orchestrator.install).toHaveBeenCalledWith('test-skill', 'local', ['cursor'])
  })

  it('should handle "all" scope by installing both local and global', async () => {
    ;(reconciler.getAvailableAgents as jest.Mock<MockableFn>).mockResolvedValue([
      { agent: 'cursor', displayName: 'Cursor' },
    ])
    ;(reconciler.getInstalledSkills as jest.Mock<MockableFn>).mockResolvedValue({}) // not installed
    ;(vscode.window.showQuickPick as jest.Mock<MockableFn>)
      .mockResolvedValueOnce([{ label: 'Cursor', agentId: 'cursor' }]) // agent pick
      .mockResolvedValueOnce({ label: 'All', scopeId: 'all' }) // scope pick

    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = {
      type: 'requestAgentPick',
      payload: { skillName: 'test-skill', action: 'add' },
    }

    await messageHandler(message)
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(orchestrator.install).toHaveBeenCalledWith('test-skill', 'local', ['cursor'])
    expect(orchestrator.install).toHaveBeenCalledWith('test-skill', 'global', ['cursor'])
  })

  it('should confirm removal before executing remove action', async () => {
    ;(reconciler.getAvailableAgents as jest.Mock<MockableFn>).mockResolvedValue([
      { agent: 'cursor', displayName: 'Cursor' },
    ])
    ;(reconciler.getInstalledSkills as jest.Mock<MockableFn>).mockResolvedValue({
      'test-skill': {
        local: true,
        global: true,
        agents: [{ agent: 'cursor', displayName: 'Cursor', local: true, global: true }],
      },
    })
    ;(vscode.window.showQuickPick as jest.Mock<MockableFn>)
      .mockResolvedValueOnce([{ label: 'Cursor', agentId: 'cursor' }]) // agent pick
      .mockResolvedValueOnce({ label: 'Locally', scopeId: 'local' }) // scope pick
    ;(vscode.window.showWarningMessage as jest.Mock<MockableFn>).mockResolvedValue('Remove')

    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = {
      type: 'requestAgentPick',
      payload: { skillName: 'test-skill', action: 'remove' },
    }

    await messageHandler(message)
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(vscode.window.showWarningMessage).toHaveBeenCalled()
    expect(orchestrator.remove).toHaveBeenCalledWith('test-skill', 'local', ['cursor'])
  })

  it('should handle installSkill message with multiple agents', async () => {
    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = {
      type: 'installSkill',
      payload: { skillName: 'test-skill', agents: ['cursor', 'claude-code'], scope: 'local' },
    }

    await messageHandler(message)

    expect(orchestrator.install).toHaveBeenCalledWith('test-skill', 'local', ['cursor', 'claude-code'])
  })

  it('should handle installSkill with scope "all" by installing local and global', async () => {
    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = {
      type: 'installSkill',
      payload: { skillName: 'test-skill', agents: ['cursor'], scope: 'all' },
    }

    await messageHandler(message)

    expect(orchestrator.install).toHaveBeenCalledWith('test-skill', 'local', ['cursor'])
    expect(orchestrator.install).toHaveBeenCalledWith('test-skill', 'global', ['cursor'])
  })

  it('should show info message when all agents are saturated for ADD', async () => {
    ;(reconciler.getAvailableAgents as jest.Mock<MockableFn>).mockResolvedValue([
      { agent: 'cursor', displayName: 'Cursor' },
    ])
    ;(reconciler.getInstalledSkills as jest.Mock<MockableFn>).mockResolvedValue({
      'test-skill': {
        local: true,
        global: true,
        agents: [{ agent: 'cursor', displayName: 'Cursor', local: true, global: true }],
      },
    })

    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = {
      type: 'requestAgentPick',
      payload: { skillName: 'test-skill', action: 'add' },
    }

    await messageHandler(message)
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(expect.stringContaining('already installed'))
    // Should NOT show the quick pick
    expect(vscode.window.showQuickPick).not.toHaveBeenCalled()
  })
})
