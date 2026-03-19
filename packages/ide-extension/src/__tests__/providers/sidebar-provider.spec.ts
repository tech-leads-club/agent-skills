import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import * as vscode from 'vscode'
import { SidebarProvider } from '../../providers/sidebar-provider'
import type { ActionRunner } from '../../services/action-runner'
import type { InstalledStateSnapshot } from '../../services/installed-state-store'
import { InstalledStateStore } from '../../services/installed-state-store'
import { LoggingService } from '../../services/logging-service'
import { RegistryStore, type RegistryStoreSnapshot } from '../../services/registry-store'
import type { StateReconciler } from '../../services/state-reconciler'
import type { WebviewMessage } from '../../shared/messages'
import type {
  ActionRequest,
  ActionState,
  AvailableAgent,
  InstalledSkillsMap,
  ScopePolicyEvaluation,
  SkillRegistry,
} from '../../shared/types'

type SyncMockableFn<TReturn = unknown, TArgs extends Array<unknown> = Array<unknown>> = (...args: TArgs) => TReturn
type AsyncMockableFn<TReturn = unknown, TArgs extends Array<unknown> = Array<unknown>> = (
  ...args: TArgs
) => Promise<TReturn>

describe('SidebarProvider', () => {
  let provider: SidebarProvider
  let context: vscode.ExtensionContext
  let logger: LoggingService
  let registryStore: jest.Mocked<RegistryStore>
  let installedStateStore: jest.Mocked<InstalledStateStore>
  let actionRunner: jest.Mocked<ActionRunner>
  let reconciler: jest.Mocked<StateReconciler>
  let webviewView: vscode.WebviewView
  let messageHandler: (message: WebviewMessage) => void | Promise<void>
  let registrySnapshotHandler: ((snapshot: RegistryStoreSnapshot) => void) | undefined
  let installedSnapshotHandler: ((snapshot: InstalledStateSnapshot) => void) | undefined
  let actionStateHandler: ((state: ActionState) => void) | undefined

  const showErrorMessageMock = vscode.window.showErrorMessage as unknown as jest.Mock<(message: string) => void>

  const mockRegistry: SkillRegistry = {
    version: '1.0.0',
    categories: {},
    skills: [],
  }

  const idleActionState: ActionState = {
    status: 'idle',
    actionId: null,
    action: null,
    currentStep: null,
    errorMessage: null,
    request: null,
    results: [],
    logs: [],
    rejectionMessage: null,
  }

  beforeEach(() => {
    jest.resetAllMocks()
    registrySnapshotHandler = undefined
    installedSnapshotHandler = undefined
    actionStateHandler = undefined

    context = {
      extensionUri: { fsPath: '/test/extension/uri' },
      subscriptions: [],
      extension: {
        packageJSON: {
          version: '1.2.3',
        },
      },
    } as unknown as vscode.ExtensionContext

    logger = {
      info: jest.fn<SyncMockableFn>(),
      warn: jest.fn<SyncMockableFn>(),
      error: jest.fn<SyncMockableFn>(),
      debug: jest.fn<SyncMockableFn>(),
      dispose: jest.fn<SyncMockableFn>(),
    } as unknown as jest.Mocked<LoggingService>

    registryStore = {
      getSnapshot: jest.fn<SyncMockableFn<RegistryStoreSnapshot>>().mockReturnValue({
        status: 'ready',
        registry: mockRegistry,
        fromCache: false,
        errorMessage: null,
      }),
      prime: jest.fn<AsyncMockableFn<void>>().mockResolvedValue(undefined),
      refresh: jest.fn<AsyncMockableFn<void>>().mockResolvedValue(undefined),
      subscribe: jest.fn((handler: (snapshot: RegistryStoreSnapshot) => void) => {
        registrySnapshotHandler = handler
        return { dispose: jest.fn<SyncMockableFn>() }
      }),
    } as unknown as jest.Mocked<RegistryStore>

    installedStateStore = {
      getSnapshot: jest
        .fn<SyncMockableFn<InstalledStateSnapshot>>()
        .mockReturnValue({ installedSkills: {}, lastUpdatedAt: null }),
      refresh: jest.fn<AsyncMockableFn<void>>().mockResolvedValue(undefined),
      subscribe: jest.fn((handler: (snapshot: InstalledStateSnapshot) => void) => {
        installedSnapshotHandler = handler
        return { dispose: jest.fn<SyncMockableFn>() }
      }),
    } as unknown as jest.Mocked<InstalledStateStore>

    actionRunner = {
      getState: jest.fn<SyncMockableFn<ActionState>>().mockReturnValue(idleActionState),
      run: jest.fn<AsyncMockableFn<{ accepted: boolean; state: ActionState }, [ActionRequest]>>().mockResolvedValue({
        accepted: true,
        state: idleActionState,
      }),
      subscribe: jest.fn((handler: (state: ActionState) => void) => {
        actionStateHandler = handler
        return { dispose: jest.fn<SyncMockableFn>() }
      }),
      dispose: jest.fn<SyncMockableFn>(),
    } as unknown as jest.Mocked<ActionRunner>

    reconciler = {
      reconcile: jest.fn<AsyncMockableFn<void>>().mockResolvedValue(undefined),
      getAvailableAgents: jest.fn<AsyncMockableFn<AvailableAgent[]>>().mockResolvedValue([]),
      getAllAgents: jest.fn<SyncMockableFn<AvailableAgent[]>>().mockReturnValue([]),
      getInstalledSkills: jest.fn<AsyncMockableFn<InstalledSkillsMap>>().mockResolvedValue({}),
      onStateChanged: jest.fn<SyncMockableFn<void, [(state: InstalledSkillsMap) => void]>>(),
      start: jest.fn<SyncMockableFn>(),
      dispose: jest.fn<SyncMockableFn>(),
      updatePolicy: jest.fn<SyncMockableFn>(),
    } as unknown as jest.Mocked<StateReconciler>

    webviewView = {
      webview: {
        options: {},
        html: '',
        cspSource: 'vscode-webview:',
        asWebviewUri: jest.fn((uri: { fsPath: string }) => uri.fsPath),
        onDidReceiveMessage: jest.fn((handler: (message: WebviewMessage) => void | Promise<void>) => {
          messageHandler = handler
          return { dispose: jest.fn<SyncMockableFn>() }
        }),
        postMessage: jest.fn<AsyncMockableFn<boolean, [unknown]>>().mockResolvedValue(true),
      },
    } as unknown as vscode.WebviewView

    provider = new SidebarProvider(context, logger, registryStore, actionRunner, reconciler, installedStateStore)
  })

  it('configures the webview shell and registers bridge listeners', () => {
    provider.resolveWebviewView(webviewView)

    expect(SidebarProvider.viewType).toBe('agentSkillsSidebar')
    expect(webviewView.webview.options).toEqual({
      enableScripts: true,
      localResourceRoots: [context.extensionUri],
    })
    expect(webviewView.webview.html).toContain('<div id="root">')
    expect(webviewView.webview.html).toContain('Loading')
    expect(webviewView.webview.html).toContain('src="/test/extension/uri/dist/webview/index.js"')
    expect(webviewView.webview.html).toContain('href="/test/extension/uri/dist/webview/index.css"')
    expect(webviewView.webview.onDidReceiveMessage).toHaveBeenCalledTimes(1)
    expect(context.subscriptions).toHaveLength(5)
  })

  it('bootstraps warm startup state when the webview mounts', async () => {
    const installedSkills: InstalledSkillsMap = {
      seo: {
        local: true,
        global: false,
        agents: [{ agent: 'cursor', displayName: 'Cursor', local: true, global: false, corrupted: false }],
      },
    }
    const policy: ScopePolicyEvaluation = {
      allowedScopes: 'all',
      environmentScopes: ['local', 'global'],
      effectiveScopes: ['local', 'global'],
    }

    installedStateStore.getSnapshot.mockReturnValue({
      installedSkills,
      lastUpdatedAt: '2026-03-16T00:00:00.000Z',
    })

    provider.updatePolicy(policy)
    provider.resolveWebviewView(webviewView)
    await messageHandler({ type: 'webviewDidMount' })

    expect(logger.info).toHaveBeenCalledWith('Webview did mount')
    expect(webviewView.webview.postMessage).toHaveBeenCalledWith({
      type: 'initialize',
      payload: { version: '1.2.3', availableAgents: [], allAgents: [], hasWorkspace: true },
    })
    expect(webviewView.webview.postMessage).toHaveBeenCalledWith({
      type: 'reconcileState',
      payload: { installedSkills },
    })
    expect(webviewView.webview.postMessage).toHaveBeenCalledWith({ type: 'actionState', payload: idleActionState })
    expect(webviewView.webview.postMessage).toHaveBeenCalledWith({ type: 'trustState', payload: { isTrusted: true } })
    expect(webviewView.webview.postMessage).toHaveBeenCalledWith({
      type: 'policyState',
      payload: { allowedScopes: 'all', effectiveScopes: ['local', 'global'], blockedReason: undefined },
    })
    expect(webviewView.webview.postMessage).toHaveBeenCalledWith({
      type: 'registryUpdate',
      payload: { status: 'ready', registry: mockRegistry, fromCache: false },
    })
    expect(registryStore.prime).toHaveBeenCalledTimes(1)
    expect(installedStateStore.refresh).toHaveBeenCalledTimes(1)
  })

  it('maps idle registry snapshots to loading during cold startup', async () => {
    registryStore.getSnapshot.mockReturnValue({
      status: 'idle',
      registry: null,
      fromCache: false,
      errorMessage: null,
    })

    provider.resolveWebviewView(webviewView)
    await messageHandler({ type: 'webviewDidMount' })

    expect(webviewView.webview.postMessage).toHaveBeenCalledWith({
      type: 'registryUpdate',
      payload: { status: 'loading', registry: null, fromCache: false },
    })
  })

  it('surfaces offline cached startup state', async () => {
    registryStore.getSnapshot.mockReturnValue({
      status: 'offline',
      registry: mockRegistry,
      fromCache: true,
      errorMessage: 'Unable to refresh the skills registry. Showing cached data.',
    })

    provider.resolveWebviewView(webviewView)
    await messageHandler({ type: 'webviewDidMount' })

    expect(webviewView.webview.postMessage).toHaveBeenCalledWith({
      type: 'registryUpdate',
      payload: {
        status: 'offline',
        registry: mockRegistry,
        fromCache: true,
        errorMessage: 'Unable to refresh the skills registry. Showing cached data.',
      },
    })
  })

  it('forwards store snapshots and action updates to the webview', async () => {
    provider.resolveWebviewView(webviewView)

    const runningState: ActionState = {
      status: 'running',
      actionId: 'action-1',
      action: 'install',
      currentStep: 'Installing seo (local)',
      errorMessage: null,
      request: { action: 'install', skills: ['seo'], agents: ['cursor'], scope: 'local', method: 'copy' },
      results: [],
      logs: [],
      rejectionMessage: null,
    }

    registrySnapshotHandler?.({
      status: 'ready',
      registry: mockRegistry,
      fromCache: false,
      errorMessage: null,
    })
    installedSnapshotHandler?.({ installedSkills: { seo: null }, lastUpdatedAt: '2026-03-16T00:00:00.000Z' })
    actionRunner.getState.mockReturnValue(runningState)
    actionStateHandler?.(runningState)

    expect(webviewView.webview.postMessage).toHaveBeenCalledWith({
      type: 'registryUpdate',
      payload: { status: 'ready', registry: mockRegistry, fromCache: false },
    })
    expect(webviewView.webview.postMessage).toHaveBeenCalledWith({
      type: 'reconcileState',
      payload: { installedSkills: { seo: null } },
    })
    expect(webviewView.webview.postMessage).toHaveBeenCalledWith({ type: 'actionState', payload: runningState })
  })

  it('refreshes catalog and installed snapshots on requestRefresh', async () => {
    provider.resolveWebviewView(webviewView)
    await messageHandler({ type: 'requestRefresh' })

    expect(logger.info).toHaveBeenCalledWith('Refresh requested from webview')
    expect(registryStore.refresh).toHaveBeenCalledTimes(1)
    // Called twice: once as early prefetch in resolveWebviewView, once from requestRefresh handler
    expect(installedStateStore.refresh).toHaveBeenCalledTimes(2)
  })

  it('awaits registry and installed refresh then sends refreshForUpdateComplete on requestRefreshForUpdate', async () => {
    let resolveRegistry: () => void
    let resolveInstalled: () => void
    registryStore.refresh.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveRegistry = resolve
        }),
    )
    installedStateStore.refresh.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveInstalled = resolve
        }),
    )

    provider.resolveWebviewView(webviewView)
    const refreshPromise = messageHandler({ type: 'requestRefreshForUpdate' })

    expect(registryStore.refresh).toHaveBeenCalledTimes(1)
    // Called twice: once as early prefetch in resolveWebviewView, once from requestRefreshForUpdate handler
    expect(installedStateStore.refresh).toHaveBeenCalledTimes(2)
    expect(webviewView.webview.postMessage).not.toHaveBeenCalledWith({
      type: 'refreshForUpdateComplete',
    })

    resolveRegistry!()
    resolveInstalled!()
    await refreshPromise

    expect(webviewView.webview.postMessage).toHaveBeenCalledWith({ type: 'refreshForUpdateComplete' })
  })

  it('runs valid requestRunAction messages through the action runner', async () => {
    provider.resolveWebviewView(webviewView)
    await messageHandler({
      type: 'requestRunAction',
      payload: { action: 'remove', skills: ['seo'], agents: ['cursor'], scope: 'global' },
    })

    expect(actionRunner.run).toHaveBeenCalledWith({
      action: 'remove',
      skills: ['seo'],
      agents: ['cursor'],
      scope: 'global',
    })
  })

  it('rejects invalid install or remove requests before they reach the runner', async () => {
    provider.resolveWebviewView(webviewView)
    await messageHandler({
      type: 'requestRunAction',
      payload: { action: 'install', skills: [], agents: [], scope: 'local' },
    })

    expect(showErrorMessageMock).toHaveBeenCalledWith('Select at least one skill and one agent before proceeding.')
    expect(actionRunner.run).not.toHaveBeenCalled()
  })

  it('treats removed lifecycle messages as unknown bridge input', async () => {
    provider.resolveWebviewView(webviewView)
    await messageHandler({ type: 'executeBatch' } as unknown as WebviewMessage)

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Unknown webview message type'))
  })
})
