import { jest } from '@jest/globals'
import * as vscode from 'vscode'
import { SidebarProvider } from '../../providers/sidebar-provider'
import type { InstallationOrchestrator } from '../../services/installation-orchestrator'
import { LoggingService } from '../../services/logging-service'
import { SkillLockService } from '../../services/skill-lock-service'
import { SkillRegistryService } from '../../services/skill-registry-service'
import type { RegistryResult } from '../../services/skill-registry-service'
import type { StateReconciler } from '../../services/state-reconciler'
import { ExtensionMessage, WebviewMessage } from '../../shared/messages'
import type { AvailableAgent, InstalledSkillsMap, SkillRegistry } from '../../shared/types'

const showQuickPickMock = vscode.window.showQuickPick as jest.Mock<
  (...args: Array<unknown>) => Promise<unknown>
>
const showWarningMessageMock = vscode.window.showWarningMessage as jest.Mock<
  (...args: Array<unknown>) => Promise<unknown>
>

type SyncMockableFn<TReturn = unknown, TArgs extends Array<unknown> = Array<unknown>> = (
  ...args: TArgs
) => TReturn

type AsyncMockableFn<TReturn = unknown, TArgs extends Array<unknown> = Array<unknown>> = (
  ...args: TArgs
) => Promise<TReturn>

type WebviewUriFn = (uri: { fsPath: string }) => string
type WebviewReceiveHandler = (handler: (message: WebviewMessage) => void) => vscode.Disposable
type PostMessageFn = (message: ExtensionMessage) => Promise<boolean>

const createQuickPickMock = () => {
  const changeHandlers: Array<(value: string) => void> = []
  const acceptHandlers: Array<() => void> = []
  const hideHandlers: Array<() => void> = []

  return {
    canSelectMany: false,
    title: '',
    placeholder: '',
    matchOnDescription: false,
    matchOnDetail: false,
    selectedItems: [] as Array<{ label: string; skillName: string; categoryId: string }>,
    items: [] as Array<{ label: string; detail?: string; description?: string; skillName: string; categoryId: string }>,
    show: jest.fn<SyncMockableFn>(),
    hide: jest.fn<SyncMockableFn>(() => {
      hideHandlers.forEach((handler) => handler())
    }),
    onDidChangeValue: jest.fn<SyncMockableFn<vscode.Disposable, [(value: string) => void]>>((handler) => {
      changeHandlers.push(handler)
      return { dispose: jest.fn<SyncMockableFn>() }
    }),
    onDidAccept: jest.fn<SyncMockableFn<vscode.Disposable, [() => void]>>((handler) => {
      acceptHandlers.push(handler)
      return { dispose: jest.fn<SyncMockableFn>() }
    }),
    onDidHide: jest.fn<SyncMockableFn<vscode.Disposable, [() => void]>>((handler) => {
      hideHandlers.push(handler)
      return { dispose: jest.fn<SyncMockableFn>() }
    }),
    dispose: jest.fn<SyncMockableFn>(),
    triggerChangeValue(value: string) {
      changeHandlers.forEach((handler) => handler(value))
    },
    triggerAccept() {
      acceptHandlers.forEach((handler) => handler())
    },
    triggerHide() {
      hideHandlers.forEach((handler) => handler())
    },
  }
}

// Mock vscode module (handled by jest.config.ts moduleNameMapper)

describe('SidebarProvider', () => {
  let provider: SidebarProvider
  let context: vscode.ExtensionContext
  let logger: LoggingService
  let registryService: jest.Mocked<SkillRegistryService>
  let orchestrator: jest.Mocked<InstallationOrchestrator>
  let reconciler: jest.Mocked<StateReconciler>
  let webviewView: vscode.WebviewView
  let messageHandler: (message: WebviewMessage) => void
  let skillLockService: jest.Mocked<SkillLockService>

  const mockRegistry: SkillRegistry = {
    version: '1.0.0',
    categories: {},
    skills: [],
  }

  beforeEach(() => {
    // Reset all mocks (including module-level vscode mocks and their implementations)
    jest.resetAllMocks()
    ;(vscode.window.createQuickPick as jest.Mock).mockImplementation(() => createQuickPickMock())

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

    const mockLoggerImpl = {
      info: jest.fn<SyncMockableFn>(),
      warn: jest.fn<SyncMockableFn>(),
      error: jest.fn<SyncMockableFn>(),
      debug: jest.fn<SyncMockableFn>(),
      dispose: jest.fn<SyncMockableFn>(),
    }
    logger = mockLoggerImpl as unknown as jest.Mocked<LoggingService>

    const registryMetadata: RegistryResult = {
      data: mockRegistry,
      fromCache: false,
      offline: false,
    }
    const mockRegistryService = {
      getRegistry: jest.fn<AsyncMockableFn<SkillRegistry>>().mockResolvedValue(mockRegistry),
      refresh: jest.fn<AsyncMockableFn<SkillRegistry>>().mockResolvedValue(mockRegistry),
      getRegistryWithMetadata: jest
        .fn<AsyncMockableFn<RegistryResult>>()
        .mockResolvedValue(registryMetadata),
      dispose: jest.fn<SyncMockableFn>(),
    } as unknown as jest.Mocked<SkillRegistryService>
    registryService = mockRegistryService

    const mockOrchestrator = {
      install: jest.fn<AsyncMockableFn<void>>().mockResolvedValue(undefined),
      remove: jest.fn<AsyncMockableFn<void>>().mockResolvedValue(undefined),
      update: jest.fn<AsyncMockableFn<void>>().mockResolvedValue(undefined),
      repair: jest.fn<AsyncMockableFn<void>>().mockResolvedValue(undefined),
      cancel: jest.fn<SyncMockableFn>(),
      onOperationEvent: jest
        .fn<SyncMockableFn<vscode.Disposable>>()
        .mockReturnValue({ dispose: jest.fn<SyncMockableFn>() }),
      dispose: jest.fn<SyncMockableFn>(),
    } as unknown as jest.Mocked<InstallationOrchestrator>
    orchestrator = mockOrchestrator

    const mockReconciler = {
      reconcile: jest.fn<AsyncMockableFn<void>>().mockResolvedValue(undefined),
      getAvailableAgents: jest
        .fn<AsyncMockableFn<AvailableAgent[]>>()
        .mockResolvedValue([]),
      getInstalledSkills: jest
        .fn<AsyncMockableFn<InstalledSkillsMap>>()
        .mockResolvedValue({}),
      onStateChanged: jest
        .fn<SyncMockableFn<vscode.Disposable>>()
        .mockReturnValue({ dispose: jest.fn<SyncMockableFn>() }),
      start: jest.fn<SyncMockableFn>(),
      dispose: jest.fn<SyncMockableFn>(),
    } as unknown as jest.Mocked<StateReconciler>
    reconciler = mockReconciler

    const mockSkillLockService = {
      getInstalledHashes: jest
        .fn<AsyncMockableFn<Record<string, string | undefined>>>()
        .mockResolvedValue({}),
      getInstalledHash: jest.fn<AsyncMockableFn<string | undefined>>().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<SkillLockService>
    skillLockService = mockSkillLockService

    // Mock WebviewView
    webviewView = {
      webview: {
        options: {},
        html: '',
        cspSource: 'vscode-webview:',
        asWebviewUri: jest.fn<WebviewUriFn>((uri) => uri.fsPath),
        onDidReceiveMessage: jest.fn<WebviewReceiveHandler>((handler) => {
          messageHandler = handler
          return { dispose: jest.fn<SyncMockableFn>() }
        }),
        postMessage: jest.fn<PostMessageFn>(),
      },
    } as unknown as vscode.WebviewView

    provider = new SidebarProvider(context, logger, registryService, orchestrator, reconciler, skillLockService)
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
    const installedSkills: InstalledSkillsMap = {
      'test-skill': {
        local: true,
        global: false,
        agents: [
          {
            agent: 'cursor',
            displayName: 'Cursor',
            local: true,
            global: false,
            corrupted: false,
          },
        ],
      },
    }
    reconciler.getInstalledSkills.mockResolvedValue(installedSkills)

    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = { type: 'webviewDidMount' }

    await messageHandler(message)

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(logger.info).toHaveBeenCalledWith('Webview did mount')
    expect(reconciler.getInstalledSkills).toHaveBeenCalled()
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
    expect(webviewView.webview.postMessage).toHaveBeenCalledWith({
      type: 'reconcileState',
      payload: { installedSkills },
    })
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
    expect(registryService.getRegistryWithMetadata).toHaveBeenCalled()
  })

  it('should notify the webview when registry data is served from cache during offline mode', async () => {
    const offlineMetadata: RegistryResult = {
      data: mockRegistry,
      fromCache: true,
      offline: true,
    }
    registryService.getRegistryWithMetadata.mockResolvedValueOnce(offlineMetadata)

    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = { type: 'webviewDidMount' }

    await messageHandler(message)
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(webviewView.webview.postMessage).toHaveBeenCalledWith({
      type: 'registryUpdate',
      payload: {
        status: 'offline',
        registry: mockRegistry,
        fromCache: true,
        errorMessage: expect.stringContaining('Unable to refresh'),
      },
    })
  })

  it('should trigger registry refresh on requestRefresh message', async () => {
    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = { type: 'requestRefresh' }

    await messageHandler(message)

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(registryService.getRegistryWithMetadata).toHaveBeenCalledWith(true)
    expect(webviewView.webview.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'registryUpdate',
      }),
    )
  })

  it('should handle registry service error gracefully', async () => {
    registryService.getRegistryWithMetadata.mockRejectedValueOnce(new Error('Network error'))

    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = { type: 'webviewDidMount' }

    await messageHandler(message)

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(registryService.getRegistryWithMetadata).toHaveBeenCalled()
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
    reconciler.getAvailableAgents.mockResolvedValue([
      { agent: 'cursor', displayName: 'Cursor' },
      { agent: 'claude-code', displayName: 'Claude Code' },
    ])
    showQuickPickMock.mockResolvedValue(null) // User cancels

    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = {
      type: 'requestAgentPick',
      payload: { skillName: 'test-skill', action: 'add' },
    }

    await messageHandler(message)
    await new Promise((resolve) => setTimeout(resolve, 10))

    const quickPickCall = showQuickPickMock.mock.calls[0]
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
    reconciler.getAvailableAgents.mockResolvedValue([
      { agent: 'cursor', displayName: 'Cursor' },
    ])
    showQuickPickMock.mockResolvedValue(null)

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
    reconciler.getAvailableAgents.mockResolvedValue([
      { agent: 'cursor', displayName: 'Cursor' },
      { agent: 'claude-code', displayName: 'Claude Code' },
    ])
    // cursor is fully installed (local + global), claude-code is not
    reconciler.getInstalledSkills.mockResolvedValue({
      'test-skill': {
        local: true,
        global: true,
        agents: [
          { agent: 'cursor', displayName: 'Cursor', local: true, global: true, corrupted: false },
          {
            agent: 'claude-code',
            displayName: 'Claude Code',
            local: false,
            global: false,
            corrupted: false,
          },
        ],
      },
    })
    showQuickPickMock.mockResolvedValue(null) // User cancels

    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = {
      type: 'requestAgentPick',
      payload: { skillName: 'test-skill', action: 'add' },
    }

    await messageHandler(message)
    await new Promise((resolve) => setTimeout(resolve, 10))

    const quickPickCall = showQuickPickMock.mock.calls[0]
    const items = quickPickCall[0] as Array<{ label: string; agentId: string }>

    // cursor should be excluded (fully saturated)
    expect(items.find((i) => i.agentId === 'cursor')).toBeUndefined()
    // claude-code should be included
    expect(items).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: 'Claude Code', agentId: 'claude-code' })]),
    )
  })

  it('should only show installed agents in REMOVE pick', async () => {
    reconciler.getAvailableAgents.mockResolvedValue([
      { agent: 'cursor', displayName: 'Cursor' },
      { agent: 'claude-code', displayName: 'Claude Code' },
      { agent: 'opencode', displayName: 'OpenCode' },
    ])
    // Only opencode has the skill installed
    reconciler.getInstalledSkills.mockResolvedValue({
      'test-skill': {
        local: true,
        global: false,
        agents: [
          {
            agent: 'opencode',
            displayName: 'OpenCode',
            local: true,
            global: false,
            corrupted: false,
          },
        ],
      },
    })
    showQuickPickMock.mockResolvedValue(null) // User cancels

    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = {
      type: 'requestAgentPick',
      payload: { skillName: 'test-skill', action: 'remove' },
    }

    await messageHandler(message)
    await new Promise((resolve) => setTimeout(resolve, 10))

    const quickPickCall = showQuickPickMock.mock.calls[0]
    const items = quickPickCall[0] as Array<{ label: string; agentId: string }>

    // Only opencode should be in the list
    expect(items).toHaveLength(1)
    expect(items[0]).toEqual(expect.objectContaining({ label: 'OpenCode', agentId: 'opencode' }))
  })

  it('should only show "Locally" scope when skill is only installed locally for REMOVE', async () => {
    reconciler.getAvailableAgents.mockResolvedValue([
      { agent: 'opencode', displayName: 'OpenCode' },
    ])
    reconciler.getInstalledSkills.mockResolvedValue({
      'test-skill': {
        local: true,
        global: false,
        agents: [
          {
            agent: 'opencode',
            displayName: 'OpenCode',
            local: true,
            global: false,
            corrupted: false,
          },
        ],
      },
    })
    // User selects opencode for removal
    showQuickPickMock.mockResolvedValueOnce([
      { label: 'OpenCode', agentId: 'opencode' },
    ]) // agent pick
    showWarningMessageMock.mockResolvedValue('Remove')

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
    reconciler.getAvailableAgents.mockResolvedValue([
      { agent: 'cursor', displayName: 'Cursor' },
    ])
    reconciler.getInstalledSkills.mockResolvedValue({}) // not installed
    showQuickPickMock
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
    reconciler.getAvailableAgents.mockResolvedValue([
      { agent: 'cursor', displayName: 'Cursor' },
    ])
    reconciler.getInstalledSkills.mockResolvedValue({}) // not installed
    showQuickPickMock
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
    reconciler.getAvailableAgents.mockResolvedValue([
      { agent: 'cursor', displayName: 'Cursor' },
    ])
    reconciler.getInstalledSkills.mockResolvedValue({
      'test-skill': {
        local: true,
        global: true,
        agents: [
          {
            agent: 'cursor',
            displayName: 'Cursor',
            local: true,
            global: true,
            corrupted: false,
          },
        ],
      },
    })
    showQuickPickMock
      .mockResolvedValueOnce([{ label: 'Cursor', agentId: 'cursor' }]) // agent pick
      .mockResolvedValueOnce({ label: 'Locally', scopeId: 'local' }) // scope pick
    showWarningMessageMock.mockResolvedValue('Remove')

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
    reconciler.getAvailableAgents.mockResolvedValue([
      { agent: 'cursor', displayName: 'Cursor' },
    ])
    reconciler.getInstalledSkills.mockResolvedValue({
      'test-skill': {
        local: true,
        global: true,
        agents: [
          {
            agent: 'cursor',
            displayName: 'Cursor',
            local: true,
            global: true,
            corrupted: false,
          },
        ],
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

  describe('Command palette flows', () => {
    const createRegistry = (): SkillRegistry => ({
      version: '1.0.0',
      categories: {
        general: { name: 'General', description: 'General category' },
        tools: { name: 'Tools', description: 'Tools category' },
      },
      skills: [
        {
          name: 'seo',
          description: 'SEO helper',
          category: 'general',
          path: '/skills/seo',
          files: ['SKILL.md'],
          contentHash: 'abcde12345',
        },
        {
          name: 'accessibility',
          description: 'Accessibility helper',
          category: 'tools',
          path: '/skills/accessibility',
          files: ['SKILL.md'],
          contentHash: 'fghij67890',
        },
      ],
    })

    const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

    const getLatestQuickPick = () =>
      (vscode.window.createQuickPick as jest.Mock).mock.results[0].value as {
        items: Array<{ skillName: string; label: string; categoryId: string }>
        selectedItems: Array<{ skillName: string; label: string; categoryId: string }>
        placeholder: string
        triggerAccept: () => void
        triggerChangeValue: (value: string) => void
        triggerHide: () => void
      }

    it('enqueues install operations for the selected skills', async () => {
      const registry = createRegistry()
      registryService.getRegistry.mockResolvedValue(registry)
      reconciler.getInstalledSkills.mockResolvedValue({})
      reconciler.getAvailableAgents.mockResolvedValue([{ agent: 'cursor', displayName: 'Cursor' }])
      showQuickPickMock
        .mockResolvedValueOnce([{ label: 'Cursor', agentId: 'cursor' }])
        .mockResolvedValueOnce({ label: 'Locally', scopeId: 'local' })

      const commandPromise = provider.runCommandPaletteAdd()
      await flush()
      const quickPick = getLatestQuickPick()
      quickPick.selectedItems = [...quickPick.items]
      quickPick.triggerAccept()
      await commandPromise

      expect(orchestrator.install).toHaveBeenCalledWith('seo', 'local', ['cursor'])
      expect(orchestrator.install).toHaveBeenCalledWith('accessibility', 'local', ['cursor'])
      expect(orchestrator.install).toHaveBeenCalledTimes(2)
    })

    it('respects @category filters in the skill picker', async () => {
      const registry = createRegistry()
      registryService.getRegistry.mockResolvedValue(registry)
      reconciler.getInstalledSkills.mockResolvedValue({})
      reconciler.getAvailableAgents.mockResolvedValue([{ agent: 'cursor', displayName: 'Cursor' }])
      showQuickPickMock
        .mockResolvedValueOnce([{ label: 'Cursor', agentId: 'cursor' }])
        .mockResolvedValueOnce({ label: 'Locally', scopeId: 'local' })

      const commandPromise = provider.runCommandPaletteAdd()
      await flush()
      const quickPick = getLatestQuickPick()
      quickPick.triggerChangeValue('@nonexistent')
      expect(quickPick.items).toHaveLength(0)
      expect(quickPick.placeholder).toContain("No category matches '@nonexistent'")
      quickPick.triggerChangeValue('@tools')
      expect(quickPick.items.every((item) => item.categoryId === 'tools')).toBe(true)
      quickPick.selectedItems = [...quickPick.items]
      quickPick.triggerAccept()
      await commandPromise

      expect(orchestrator.install).toHaveBeenCalled()
    })

    it('prompts for removal confirmation before enqueuing removals', async () => {
      const registry = createRegistry()
      registryService.getRegistry.mockResolvedValue(registry)
      reconciler.getAvailableAgents.mockResolvedValue([{ agent: 'cursor', displayName: 'Cursor' }])
      reconciler.getInstalledSkills.mockResolvedValue({
        seo: {
          local: true,
          global: false,
          agents: [
            {
              agent: 'cursor',
              displayName: 'Cursor',
              local: true,
              global: false,
              corrupted: false,
            },
          ],
        },
      })
      showQuickPickMock
        .mockResolvedValueOnce([{ label: 'Cursor', agentId: 'cursor' }])
        .mockResolvedValueOnce({ label: 'Locally', scopeId: 'local' })
      showWarningMessageMock.mockResolvedValue('Remove')

      const commandPromise = provider.runCommandPaletteRemove()
      await flush()
      const quickPick = getLatestQuickPick()
      quickPick.selectedItems = [...quickPick.items]
      quickPick.triggerAccept()
      await commandPromise

      expect(orchestrator.remove).toHaveBeenCalledWith('seo', 'local', ['cursor'])
    })

    it('selects only outdated skills for update operations', async () => {
      const registry = createRegistry()
      registryService.getRegistry.mockResolvedValue(registry)
      reconciler.getInstalledSkills.mockResolvedValue({
        seo: {
          local: true,
          global: false,
          agents: [],
        },
      } as InstalledSkillsMap)
      skillLockService.getInstalledHashes.mockResolvedValue({ seo: 'old-hash', accessibility: 'fghij67890' })

      const commandPromise = provider.runCommandPaletteUpdate()
      await flush()
      const quickPick = getLatestQuickPick()
      quickPick.selectedItems = quickPick.items.filter((item) => item.skillName === 'seo')
      quickPick.triggerAccept()
      await commandPromise

      expect(orchestrator.update).toHaveBeenCalledTimes(1)
      expect(orchestrator.update).toHaveBeenCalledWith('seo')
    })

    it('enqueues repairs per scope for selected skills', async () => {
      const registry = createRegistry()
      registryService.getRegistry.mockResolvedValue(registry)
      reconciler.getInstalledSkills.mockResolvedValue({
        seo: {
          local: true,
          global: true,
          agents: [
            {
              agent: 'cursor',
              displayName: 'Cursor',
              local: true,
              global: true,
              corrupted: false,
            },
          ],
        },
      } as InstalledSkillsMap)

      const commandPromise = provider.runCommandPaletteRepair()
      await flush()
      const quickPick = getLatestQuickPick()
      quickPick.selectedItems = quickPick.items.filter((item) => item.skillName === 'seo')
      quickPick.triggerAccept()
      await commandPromise

      expect(orchestrator.repair).toHaveBeenCalledWith('seo', 'local', ['cursor'])
      expect(orchestrator.repair).toHaveBeenCalledWith('seo', 'global', ['cursor'])
    })

    it('does nothing when skill selection is cancelled', async () => {
      const registry = createRegistry()
      registryService.getRegistry.mockResolvedValue(registry)
      reconciler.getInstalledSkills.mockResolvedValue({})
      reconciler.getAvailableAgents.mockResolvedValue([{ agent: 'cursor', displayName: 'Cursor' }])

      const commandPromise = provider.runCommandPaletteAdd()
      await flush()
      const quickPick = getLatestQuickPick()
      quickPick.triggerHide()
      await commandPromise

      expect(orchestrator.install).not.toHaveBeenCalled()
    })
  })
})
