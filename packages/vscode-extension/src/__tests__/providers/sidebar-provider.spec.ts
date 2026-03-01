import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import * as vscode from 'vscode'
import { SidebarProvider } from '../../providers/sidebar-provider'
import type { InstallationOrchestrator } from '../../services/installation-orchestrator'
import { LoggingService } from '../../services/logging-service'
import { SkillLockService } from '../../services/skill-lock-service'
import type { RegistryResult } from '../../services/skill-registry-service'
import { SkillRegistryService } from '../../services/skill-registry-service'
import type { StateReconciler } from '../../services/state-reconciler'
import { ExtensionMessage, WebviewMessage } from '../../shared/messages'
import type {
  AvailableAgent,
  InstalledSkillsMap,
  ScopePolicyEvaluation,
  Skill,
  SkillRegistry,
} from '../../shared/types'

const showQuickPickMock = vscode.window.showQuickPick as jest.Mock<(...args: Array<unknown>) => Promise<unknown>>
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

type SkillQuickPickItem = {
  skillName: string
  label: string
  categoryId: string
  description?: string
  detail?: string
}

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
      getRegistryWithMetadata: jest.fn<AsyncMockableFn<RegistryResult>>().mockResolvedValue(registryMetadata),
      dispose: jest.fn<SyncMockableFn>(),
    } as unknown as jest.Mocked<SkillRegistryService>
    registryService = mockRegistryService

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
      onStateChanged: jest
        .fn<SyncMockableFn<vscode.Disposable>>()
        .mockReturnValue({ dispose: jest.fn<SyncMockableFn>() }),
      start: jest.fn<SyncMockableFn>(),
      dispose: jest.fn<SyncMockableFn>(),
    } as unknown as jest.Mocked<StateReconciler>
    reconciler = mockReconciler

    const mockSkillLockService = {
      getInstalledHashes: jest.fn<AsyncMockableFn<Record<string, string | undefined>>>().mockResolvedValue({}),
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
          allAgents: expect.arrayContaining([]),
          hasWorkspace: expect.any(Boolean),
        }),
      }),
    )
    expect(webviewView.webview.postMessage).toHaveBeenCalledWith({
      type: 'reconcileState',
      payload: { installedSkills },
    })
  })

  it('hydrates installed-skill hashes before posting reconcile state', async () => {
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
    reconciler.getInstalledSkills.mockResolvedValue(installedSkills)
    skillLockService.getInstalledHashes.mockResolvedValue({ 'test-skill': 'hash-123' })

    provider.resolveWebviewView(webviewView)
    const message: WebviewMessage = { type: 'webviewDidMount' }

    await messageHandler(message)
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(webviewView.webview.postMessage).toHaveBeenCalledWith({
      type: 'reconcileState',
      payload: {
        installedSkills: {
          'test-skill': {
            ...installedInfo,
            contentHash: 'hash-123',
          },
        },
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
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to load registry'), expect.any(Error))
    expect(webviewView.webview.postMessage).toHaveBeenCalledWith({
      type: 'registryUpdate',
      payload: {
        status: 'error',
        registry: null,
        errorMessage: expect.stringContaining('Network error'),
      },
    })
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

    expect(orchestrator.installMany).toHaveBeenCalledWith(['test-skill'], 'local', ['cursor'])
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
      },
    })
  })

  it('posts refreshed reconcile state after operation completion', async () => {
    provider.resolveWebviewView(webviewView)

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

    reconciler.getInstalledSkills.mockResolvedValueOnce({
      seo: installedInfo,
    })
    skillLockService.getInstalledHashes.mockResolvedValueOnce({ seo: 'new-hash' })

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

    expect(reconciler.reconcile).toHaveBeenCalled()
    expect(webviewView.webview.postMessage).toHaveBeenCalledWith({
      type: 'reconcileState',
      payload: {
        installedSkills: {
          seo: {
            ...installedInfo,
            contentHash: 'new-hash',
          },
        },
      },
    })
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

    const addSkillWithoutDescription = (registry: SkillRegistry, skillName: string = 'no-description') => {
      const missingSkill: Skill = {
        name: skillName,
        description: undefined as unknown as string,
        category: 'general',
        path: `/skills/${skillName}`,
        files: ['SKILL.md'],
        contentHash: `${skillName}-hash`,
      } as Skill
      registry.skills.push(missingSkill)
    }

    it('enqueues install operations for the selected skills', async () => {
      const registry = createRegistry()
      registryService.getRegistry.mockResolvedValue(registry)
      reconciler.getInstalledSkills.mockResolvedValue({})
      reconciler.getAvailableAgents.mockResolvedValue([
        { agent: 'cursor', displayName: 'Cursor', company: 'Anysphere' },
      ])

      let skillItems: SkillQuickPickItem[] | undefined
      showQuickPickMock
        .mockImplementationOnce(async (items) => {
          skillItems = items as SkillQuickPickItem[]
          return skillItems
        })
        .mockResolvedValueOnce([{ label: 'Cursor', agentId: 'cursor' }])
        .mockResolvedValueOnce({ label: 'Locally', scopeId: 'local' })

      showWarningMessageMock.mockResolvedValue('Install')
      showWarningMessageMock.mockResolvedValue('Install')
      const commandPromise = provider.runCommandPaletteAdd()
      await flush()

      const seoItem = skillItems?.find((item) => item.skillName === 'seo')
      const accessibilityItem = skillItems?.find((item) => item.skillName === 'accessibility')
      expect(seoItem?.description).toBe('SEO helper')
      expect(accessibilityItem?.description).toBe('Accessibility helper')

      await commandPromise

      expect(orchestrator.installMany).toHaveBeenCalledWith(
        ['seo', 'accessibility'],
        'local',
        ['cursor'],
        'command-palette',
      )
      expect(orchestrator.installMany).toHaveBeenCalledTimes(1)
    })

    it('shows skill descriptions and fallback text in the add quick pick', async () => {
      const registry = createRegistry()
      addSkillWithoutDescription(registry, 'missing-description')
      registryService.getRegistry.mockResolvedValue(registry)
      reconciler.getInstalledSkills.mockResolvedValue({})
      reconciler.getAvailableAgents.mockResolvedValue([
        { agent: 'cursor', displayName: 'Cursor', company: 'Anysphere' },
      ])

      let skillItems: SkillQuickPickItem[] | undefined
      showQuickPickMock.mockImplementationOnce(async (items) => {
        skillItems = items as SkillQuickPickItem[]
        return null
      })

      showWarningMessageMock.mockResolvedValue('Install')
      const commandPromise = provider.runCommandPaletteAdd()
      await flush()

      const seoItem = skillItems?.find((item) => item.skillName === 'seo')
      const missingDescriptionItem = skillItems?.find((item) => item.skillName === 'missing-description')
      expect(seoItem?.description).toBe('SEO helper')
      expect(missingDescriptionItem?.description).toBe('No description')

      await commandPromise
    })

    it('prompts for removal confirmation before enqueuing removals', async () => {
      const registry = createRegistry()
      registryService.getRegistry.mockResolvedValue(registry)
      reconciler.getAvailableAgents.mockResolvedValue([
        { agent: 'cursor', displayName: 'Cursor', company: 'Anysphere' },
      ])
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
      showWarningMessageMock.mockResolvedValue('Remove')

      let skillItems: SkillQuickPickItem[] | undefined
      showQuickPickMock
        .mockImplementationOnce(async (items) => {
          skillItems = items as SkillQuickPickItem[]
          return skillItems
        })
        .mockResolvedValueOnce([{ label: 'Cursor', agentId: 'cursor' }])
        .mockResolvedValueOnce({ label: 'Locally', scopeId: 'local' })

      const commandPromise = provider.runCommandPaletteRemove()
      await flush()

      const seoItem = skillItems?.find((item) => item.skillName === 'seo')
      expect(seoItem?.description).toBe('SEO helper')

      await commandPromise

      expect(orchestrator.removeMany).toHaveBeenCalledWith(['seo'], 'local', ['cursor'], 'command-palette')
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

      let skillItems: SkillQuickPickItem[] | undefined
      showQuickPickMock.mockImplementationOnce(async (items) => {
        skillItems = items as SkillQuickPickItem[]
        return skillItems.filter((item) => item.skillName === 'seo')
      })

      showWarningMessageMock.mockResolvedValue('Update')
      const commandPromise = provider.runCommandPaletteUpdate()
      await flush()

      const seoItem = skillItems?.find((item) => item.skillName === 'seo')
      expect(seoItem?.description).toBe('SEO helper')

      await commandPromise

      expect(orchestrator.updateMany).toHaveBeenCalledTimes(1)
      expect(orchestrator.updateMany).toHaveBeenCalledWith(['seo'], 'command-palette')
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
              corrupted: true,
            },
          ],
        },
      } as InstalledSkillsMap)

      let skillItems: SkillQuickPickItem[] | undefined
      showQuickPickMock.mockImplementationOnce(async (items) => {
        skillItems = items as SkillQuickPickItem[]
        return skillItems.filter((item) => item.skillName === 'seo')
      })

      showWarningMessageMock.mockResolvedValue('Repair')
      const commandPromise = provider.runCommandPaletteRepair()
      await flush()

      const seoItem = skillItems?.find((item) => item.skillName === 'seo')
      expect(seoItem?.description).toBe('SEO helper')

      await commandPromise

      expect(orchestrator.repairMany).toHaveBeenCalledWith(['seo'], 'local', ['cursor'], 'command-palette')
      expect(orchestrator.repairMany).toHaveBeenCalledWith(['seo'], 'global', ['cursor'], 'command-palette')
    })

    it('does not show healthy installed skills in repair candidates', async () => {
      const registry = createRegistry()
      registryService.getRegistry.mockResolvedValue(registry)
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
      } as InstalledSkillsMap)

      await provider.runCommandPaletteRepair()

      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('No corrupted skills are available to repair.')
      expect(vscode.window.showQuickPick).not.toHaveBeenCalled()
      expect(orchestrator.repairMany).not.toHaveBeenCalled()
    })

    it('does nothing when skill selection is cancelled', async () => {
      const registry = createRegistry()
      registryService.getRegistry.mockResolvedValue(registry)
      reconciler.getInstalledSkills.mockResolvedValue({})
      reconciler.getAvailableAgents.mockResolvedValue([
        { agent: 'cursor', displayName: 'Cursor', company: 'Anysphere' },
      ])

      showQuickPickMock.mockResolvedValueOnce(null)
      const commandPromise = provider.runCommandPaletteAdd()
      await flush()
      await commandPromise

      expect(orchestrator.installMany).not.toHaveBeenCalled()
    })
  })

  it('should block command palette action if policy blocks everything', async () => {
    const policy: ScopePolicyEvaluation = {
      allowedScopes: 'none',
      environmentScopes: ['local', 'global'],
      effectiveScopes: [],
      blockedReason: 'policy-none',
    }

    provider.updatePolicy(policy)

    // Mock executeCommand for "Open Settings"
    const executeCommandMock = jest.spyOn(vscode.commands, 'executeCommand').mockImplementation(async () => {})
    showWarningMessageMock.mockResolvedValue(undefined)
    // Fix showErrorMessage mock signature mismatch by casting
    const showErrorMessageMock = jest
      .spyOn(vscode.window, 'showErrorMessage')
      .mockResolvedValue('Open Settings' as unknown as vscode.MessageItem)

    showWarningMessageMock.mockResolvedValue('Install')
    await provider.runCommandPaletteAdd()

    expect(showErrorMessageMock).toHaveBeenCalledWith(
      expect.stringContaining('Lifecycle actions are disabled'),
      'Open Settings' as unknown as vscode.MessageOptions,
    )
    expect(executeCommandMock).toHaveBeenCalledWith('agentSkills.openSettings')
    expect(orchestrator.installMany).not.toHaveBeenCalled()
  })

  it('should skip scope picker if only one scope is effective (local)', async () => {
    showWarningMessageMock.mockResolvedValue('Install')
    const policy: ScopePolicyEvaluation = {
      allowedScopes: 'local',
      environmentScopes: ['local', 'global'],
      effectiveScopes: ['local'],
      blockedReason: undefined,
    }

    provider.updatePolicy(policy)

    // Setup registry and agents
    const registry = {
      version: '1.0.0',
      categories: {},
      skills: [{ name: 'skill1', category: 'cat1', path: 'p', files: [], contentHash: 'h' }],
    }
    registryService.getRegistry.mockResolvedValue(registry as unknown as SkillRegistry)
    reconciler.getInstalledSkills.mockResolvedValue({})
    reconciler.getAvailableAgents.mockResolvedValue([{ agent: 'a1', displayName: 'A1', company: 'Acme' }])

    // Mocks
    showQuickPickMock
      .mockResolvedValueOnce([{ label: 'skill1', skillName: 'skill1' }]) // skill pick
      .mockResolvedValueOnce([{ label: 'A1', agentId: 'a1' }]) // agent pick
    // No scope pick expected!

    await provider.runCommandPaletteAdd()

    // Should auto-select 'local'
    expect(orchestrator.installMany).toHaveBeenCalledWith(['skill1'], 'local', ['a1'], 'command-palette')
    // Check that showQuickPick was called exactly twice (skill + agent)
    expect(showQuickPickMock).toHaveBeenCalledTimes(2)
  })
})
