import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import * as vscode from 'vscode'
import { SidebarProvider } from '../../providers/sidebar-provider'
import type { InstallationOrchestrator } from '../../services/installation-orchestrator'
import { InstalledStateStore } from '../../services/installed-state-store'
import { LoggingService } from '../../services/logging-service'
import { RegistryStore, type RegistryStoreSnapshot } from '../../services/registry-store'
import type { StateReconciler } from '../../services/state-reconciler'
import { ExtensionMessage, WebviewMessage } from '../../shared/messages'
import type { AvailableAgent, InstalledSkillsMap, SkillRegistry } from '../../shared/types'

const showWarningMessageMock = vscode.window.showWarningMessage as jest.Mock<
  (...args: Array<unknown>) => Promise<unknown>
>

type SyncMockableFn<TReturn = unknown, TArgs extends Array<unknown> = Array<unknown>> = (...args: TArgs) => TReturn

type AsyncMockableFn<TReturn = unknown, TArgs extends Array<unknown> = Array<unknown>> = (
  ...args: TArgs
) => Promise<TReturn>

type WebviewUriFn = (uri: { fsPath: string }) => string
type WebviewReceiveHandler = (handler: (message: WebviewMessage) => void) => vscode.Disposable
type PostMessageFn = (message: ExtensionMessage) => Promise<boolean>

describe('SidebarProvider', () => {
  let provider: SidebarProvider
  let context: vscode.ExtensionContext
  let logger: LoggingService
  let registryStore: jest.Mocked<RegistryStore>
  let installedStateStore: jest.Mocked<InstalledStateStore>
  let orchestrator: jest.Mocked<InstallationOrchestrator>
  let reconciler: jest.Mocked<StateReconciler>
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

    const mockLoggerImpl = {
      info: jest.fn<SyncMockableFn>(),
      warn: jest.fn<SyncMockableFn>(),
      error: jest.fn<SyncMockableFn>(),
      debug: jest.fn<SyncMockableFn>(),
      dispose: jest.fn<SyncMockableFn>(),
    }
    logger = mockLoggerImpl as unknown as jest.Mocked<LoggingService>

    const registrySnapshot: RegistryStoreSnapshot = {
      status: 'ready',
      registry: mockRegistry,
      fromCache: false,
      errorMessage: null,
    }
    registryStore = {
      getSnapshot: jest.fn<SyncMockableFn<RegistryStoreSnapshot>>().mockReturnValue(registrySnapshot),
      prime: jest.fn<AsyncMockableFn<void>>().mockResolvedValue(undefined),
      refresh: jest.fn<AsyncMockableFn<void>>().mockResolvedValue(undefined),
      subscribe: jest
        .fn<SyncMockableFn<vscode.Disposable, [(snapshot: RegistryStoreSnapshot) => void]>>()
        .mockReturnValue({ dispose: jest.fn<SyncMockableFn>() }),
    } as unknown as jest.Mocked<RegistryStore>

    const mockOrchestrator = {
      installMany: jest.fn<AsyncMockableFn<void>>().mockResolvedValue(undefined),
      removeMany: jest.fn<AsyncMockableFn<void>>().mockResolvedValue(undefined),
      updateMany: jest.fn<AsyncMockableFn<void>>().mockResolvedValue(undefined),
      repairMany: jest.fn<AsyncMockableFn<void>>().mockResolvedValue(undefined),
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
      getAvailableAgents: jest.fn<AsyncMockableFn<AvailableAgent[]>>().mockResolvedValue([]),
      getAllAgents: jest.fn<SyncMockableFn<AvailableAgent[]>>().mockReturnValue([]),
      getInstalledSkills: jest.fn<AsyncMockableFn<InstalledSkillsMap>>().mockResolvedValue({}),
      onStateChanged: jest.fn<SyncMockableFn<void, [(state: InstalledSkillsMap) => void]>>(),
      start: jest.fn<SyncMockableFn>(),
      dispose: jest.fn<SyncMockableFn>(),
    } as unknown as jest.Mocked<StateReconciler>
    reconciler = mockReconciler

    installedStateStore = {
      getSnapshot: jest
        .fn<SyncMockableFn<{ installedSkills: InstalledSkillsMap; lastUpdatedAt: string | null }>>()
        .mockReturnValue({ installedSkills: {}, lastUpdatedAt: null }),
      refresh: jest.fn<AsyncMockableFn<void>>().mockResolvedValue(undefined),
      subscribe: jest
        .fn<
          SyncMockableFn<
            vscode.Disposable,
            [(snapshot: { installedSkills: InstalledSkillsMap; lastUpdatedAt: string | null }) => void]
          >
        >()
        .mockReturnValue({ dispose: jest.fn<SyncMockableFn>() }),
    } as unknown as jest.Mocked<InstalledStateStore>

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

    provider = new SidebarProvider(context, logger, registryStore, orchestrator, reconciler, installedStateStore)
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
    expect(context.subscriptions).toHaveLength(4)
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
    installedStateStore.getSnapshot.mockReturnValue({
      installedSkills,
      lastUpdatedAt: '2026-03-16T00:00:00.000Z',
    })

    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = { type: 'webviewDidMount' }

    await messageHandler(message)

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(logger.info).toHaveBeenCalledWith('Webview did mount')
    expect(webviewView.webview.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'initialize',
        payload: expect.objectContaining({
          version: '1.2.3',
          availableAgents: expect.arrayContaining([]),
          allAgents: expect.arrayContaining([]),
          hasWorkspace: expect.any(Boolean),
        }),
      }),
    )
    expect(webviewView.webview.postMessage).toHaveBeenCalledWith({
      type: 'reconcileState',
      payload: { installedSkills },
    })
    expect(webviewView.webview.postMessage).toHaveBeenCalledWith({
      type: 'registryUpdate',
      payload: {
        status: 'ready',
        registry: mockRegistry,
        fromCache: false,
      },
    })
    expect(registryStore.prime).toHaveBeenCalled()
    expect(installedStateStore.refresh).toHaveBeenCalled()
  })

  it('posts the installed snapshot from the store', async () => {
    const installedInfo = {
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
    }
    const installedSkills: InstalledSkillsMap = {
      'test-skill': installedInfo,
    }
    installedStateStore.getSnapshot.mockReturnValue({
      installedSkills,
      lastUpdatedAt: '2026-03-16T00:00:00.000Z',
    })

    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = { type: 'webviewDidMount' }

    await messageHandler(message)
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(webviewView.webview.postMessage).toHaveBeenCalledWith({
      type: 'reconcileState',
      payload: {
        installedSkills,
      },
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

  it('should send the current registry snapshot on webviewDidMount', async () => {
    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = { type: 'webviewDidMount' }

    await messageHandler(message)

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(webviewView.webview.postMessage).toHaveBeenCalledWith({
      type: 'registryUpdate',
      payload: {
        status: 'ready',
        registry: mockRegistry,
        fromCache: false,
      },
    })
    expect(registryStore.prime).toHaveBeenCalled()
  })

  it('should notify the webview when registry data is served from cache during offline mode', async () => {
    registryStore.getSnapshot.mockReturnValue({
      status: 'offline',
      registry: mockRegistry,
      fromCache: true,
      errorMessage: 'Unable to refresh the skills registry. Showing cached data.',
    })

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

    expect(registryStore.refresh).toHaveBeenCalled()
    expect(installedStateStore.refresh).toHaveBeenCalled()
  })

  it('should post error snapshots exposed by the registry store', async () => {
    registryStore.getSnapshot.mockReturnValue({
      status: 'error',
      registry: null,
      fromCache: false,
      errorMessage: 'Network error',
    })

    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = { type: 'webviewDidMount' }

    await messageHandler(message)

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(webviewView.webview.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'registryUpdate',
        payload: expect.objectContaining({
          status: 'error',
          registry: null,
          errorMessage: expect.stringContaining('Network error'),
        }),
      }),
    )
  })

  // TESTS FOR WEBVIEW MESSAGE FLOW

  it('should treat legacy requestAgentPick messages as unknown', async () => {
    provider.resolveWebviewView(webviewView)
    const message = {
      type: 'requestAgentPick',
      payload: { skillName: 'test-skill', action: 'add' },
    } as unknown as WebviewMessage

    await messageHandler(message)

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Unknown webview message type'))
  })

  it('should treat legacy requestScopePick messages as unknown', async () => {
    provider.resolveWebviewView(webviewView)
    const message = {
      type: 'requestScopePick',
      payload: { skillName: 'test-skill', action: 'add', agents: ['cursor'] },
    } as unknown as WebviewMessage

    await messageHandler(message)

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Unknown webview message type'))
  })

  it('should handle executeBatch install message', async () => {
    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = {
      type: 'executeBatch',
      payload: { action: 'install', skills: ['test-skill'], agents: ['cursor'], scope: 'local' },
    }

    await messageHandler(message)

    expect(orchestrator.installMany).toHaveBeenCalledWith(['test-skill'], 'local', ['cursor'], 'card', 'copy')
  })

  it('should handle executeBatch remove message', async () => {
    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = {
      type: 'executeBatch',
      payload: { action: 'remove', skills: ['test-skill'], agents: ['cursor'], scope: 'global' },
    }

    await messageHandler(message)

    expect(orchestrator.removeMany).toHaveBeenCalledWith(['test-skill'], 'global', ['cursor'])
  })

  it('should post batchCompleted when final batched operation finishes', async () => {
    provider.resolveWebviewView(webviewView)

    const eventHandler = (orchestrator.onOperationEvent as jest.Mock).mock.calls[0][0] as (
      event: Parameters<NonNullable<InstallationOrchestrator['onOperationEvent']>>[0] extends (e: infer E) => void
        ? E
        : never,
    ) => void

    eventHandler({
      type: 'started',
      operationId: 'op-1',
      operation: 'install',
      skillName: 'test-skill',
      metadata: {
        batchId: 'batch-1',
        batchSize: 1,
        skillNames: ['test-skill'],
        scope: 'local',
        agents: ['cursor'],
      },
    })

    eventHandler({
      type: 'completed',
      operationId: 'op-1',
      operation: 'install',
      skillName: 'test-skill',
      success: true,
      metadata: {
        batchId: 'batch-1',
        batchSize: 1,
        skillNames: ['test-skill'],
        scope: 'local',
        agents: ['cursor'],
      },
    })

    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(webviewView.webview.postMessage).toHaveBeenCalledWith({
      type: 'batchCompleted',
      payload: {
        batchId: 'batch-1',
        success: true,
        failedSkills: undefined,
        errorMessage: undefined,
        results: [{ skillName: 'test-skill', success: true, errorMessage: undefined }],
        action: 'install',
      },
    })
  })

  it('posts refreshed reconcile state after operation completion', async () => {
    provider.resolveWebviewView(webviewView)

    const eventHandler = (orchestrator.onOperationEvent as jest.Mock).mock.calls[0][0] as (
      event: Parameters<NonNullable<InstallationOrchestrator['onOperationEvent']>>[0] extends (e: infer E) => void
        ? E
        : never,
    ) => void

    eventHandler({
      type: 'completed',
      operationId: 'op-update',
      operation: 'update',
      skillName: 'seo',
      success: true,
    })

    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(installedStateStore.refresh).toHaveBeenCalled()
  })

  it('should handle installSkill message with multiple agents', async () => {
    showWarningMessageMock.mockResolvedValue('Install')
    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = {
      type: 'installSkill',
      payload: { skillName: 'test-skill', agents: ['cursor', 'claude-code'], scope: 'local' },
    }

    await messageHandler(message)

    expect(orchestrator.installMany).toHaveBeenCalledWith(['test-skill'], 'local', ['cursor', 'claude-code'])
  })

  it('should handle installSkill with scope "all" by installing local and global', async () => {
    showWarningMessageMock.mockResolvedValue('Install')
    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = {
      type: 'installSkill',
      payload: { skillName: 'test-skill', agents: ['cursor'], scope: 'all' },
    }

    await messageHandler(message)

    expect(orchestrator.installMany).toHaveBeenCalledWith(['test-skill'], 'all', ['cursor'])
  })
})
