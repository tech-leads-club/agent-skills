import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { readFileSync } from 'node:fs'
import * as vscode from 'vscode'
import type { SkillRegistry } from '../shared/types'

type MockableFn<T = unknown> = (...args: Array<unknown>) => T

const mockRegistryPayload: SkillRegistry = {
  version: '1.0.0',
  categories: {},
  skills: [],
}

// ---- Mock Instances (shared across all tests) ----
const mockLoggingService = {
  info: jest.fn<MockableFn<void>>(),
  dispose: jest.fn<MockableFn<void>>(),
}

const mockRegistryService = {
  getRegistry: jest.fn<MockableFn<Promise<SkillRegistry>>>().mockResolvedValue(mockRegistryPayload),
  refresh: jest.fn<MockableFn<Promise<SkillRegistry>>>().mockResolvedValue(mockRegistryPayload),
  dispose: jest.fn<MockableFn<void>>(),
}

const mockActionRunner = { dispose: jest.fn<MockableFn<void>>() }
const mockScanner = { dispose: jest.fn<MockableFn<void>>() }
const mockReconciler = {
  reconcile: jest.fn<MockableFn<Promise<void>>>().mockResolvedValue(undefined),
  updatePolicy: jest.fn<MockableFn<void>>(),
  start: jest.fn<MockableFn<void>>(),
  dispose: jest.fn<MockableFn<void>>(),
}
const mockSidebarProvider = {
  updatePolicy: jest.fn<MockableFn<void>>(),
}

const mockSkillLockService = {
  getInstalledHashes: jest.fn<MockableFn<Promise<Record<string, string | undefined>>>>().mockResolvedValue({}),
  getInstalledHash: jest.fn<MockableFn<Promise<string | undefined>>>().mockResolvedValue(undefined),
}

const mockRegistryStore = {
  prime: jest.fn<MockableFn<Promise<void>>>().mockResolvedValue(undefined),
  getSnapshot: jest.fn<MockableFn>(),
  refresh: jest.fn<MockableFn<Promise<void>>>().mockResolvedValue(undefined),
  subscribe: jest.fn<MockableFn<{ dispose: () => void }>>(() => ({ dispose: jest.fn() })),
}

const mockInstalledStateStore = {
  refresh: jest.fn<MockableFn<Promise<void>>>().mockResolvedValue(undefined),
  getSnapshot: jest.fn<MockableFn>(),
  subscribe: jest.fn<MockableFn<{ dispose: () => void }>>(() => ({ dispose: jest.fn() })),
  dispose: jest.fn<MockableFn<void>>(),
}

// ---- ESM Module Mocks (must be before dynamic imports) ----
jest.unstable_mockModule('../services/logging-service', () => ({
  LoggingService: jest.fn<MockableFn<typeof mockLoggingService>>(() => mockLoggingService),
}))

jest.unstable_mockModule('../services/skill-registry-service', () => ({
  SkillRegistryService: jest.fn<MockableFn<typeof mockRegistryService>>(() => mockRegistryService),
}))

jest.unstable_mockModule('../services/skill-lock-service', () => ({
  SkillLockService: jest.fn<MockableFn<typeof mockSkillLockService>>(() => mockSkillLockService),
}))

jest.unstable_mockModule('../services/registry-store', () => ({
  RegistryStore: jest.fn<MockableFn<typeof mockRegistryStore>>(() => mockRegistryStore),
}))

jest.unstable_mockModule('../services/installed-state-store', () => ({
  InstalledStateStore: jest.fn<MockableFn<typeof mockInstalledStateStore>>(() => mockInstalledStateStore),
}))

jest.unstable_mockModule('../services/action-runner', () => ({
  ActionRunner: jest.fn<MockableFn<typeof mockActionRunner>>(() => mockActionRunner),
}))

jest.unstable_mockModule('../services/installed-skills-scanner', () => ({
  InstalledSkillsScanner: jest.fn<MockableFn<typeof mockScanner>>(() => mockScanner),
  AGENT_CONFIGS: [],
}))

jest.unstable_mockModule('../services/state-reconciler', () => ({
  StateReconciler: jest.fn<MockableFn<typeof mockReconciler>>(() => mockReconciler),
}))

const MockSidebarProviderFn = jest.fn<MockableFn<typeof mockSidebarProvider>>(() => mockSidebarProvider)
// @ts-expect-error - we are assigning a static property to a mock function
MockSidebarProviderFn.viewType = 'agentSkillsSidebar'
jest.unstable_mockModule('../providers/sidebar-provider', () => ({
  SidebarProvider: MockSidebarProviderFn,
}))

// ---- Dynamic Imports (AFTER all mocks are set up) ----
const { activate, deactivate } = await import('../extension')
const { LoggingService } = await import('../services/logging-service')
const { SkillRegistryService } = await import('../services/skill-registry-service')
const { SkillLockService } = await import('../services/skill-lock-service')
const { RegistryStore } = await import('../services/registry-store')
const { InstalledStateStore } = await import('../services/installed-state-store')
const { SidebarProvider } = await import('../providers/sidebar-provider')
const { StateReconciler } = await import('../services/state-reconciler')
const { ActionRunner } = await import('../services/action-runner')

describe('Extension Activation', () => {
  let context: vscode.ExtensionContext

  beforeEach(() => {
    jest.clearAllMocks()

    // Re-apply mock implementations after clearAllMocks
    ;(LoggingService as unknown as jest.Mock<() => typeof mockLoggingService>).mockImplementation(
      () => mockLoggingService,
    )
    ;(SkillRegistryService as unknown as jest.Mock<() => typeof mockRegistryService>).mockImplementation(
      () => mockRegistryService,
    )
    ;(SidebarProvider as unknown as jest.Mock<() => typeof mockSidebarProvider>).mockImplementation(
      () => mockSidebarProvider,
    )
    ;(StateReconciler as unknown as jest.Mock<() => typeof mockReconciler>).mockImplementation(() => mockReconciler)
    ;(ActionRunner as unknown as jest.Mock<() => typeof mockActionRunner>).mockImplementation(() => mockActionRunner)
    ;(SkillLockService as unknown as jest.Mock<() => typeof mockSkillLockService>).mockImplementation(
      () => mockSkillLockService,
    )
    ;(RegistryStore as unknown as jest.Mock<() => typeof mockRegistryStore>).mockImplementation(() => mockRegistryStore)
    ;(InstalledStateStore as unknown as jest.Mock<() => typeof mockInstalledStateStore>).mockImplementation(
      () => mockInstalledStateStore,
    )

    // Reset mock return values
    mockRegistryService.getRegistry.mockResolvedValue({ version: '1.0.0', categories: {}, skills: [] })
    mockRegistryService.refresh.mockResolvedValue({ version: '1.0.0', categories: {}, skills: [] })
    mockReconciler.reconcile.mockResolvedValue(undefined)
    mockRegistryStore.prime.mockResolvedValue(undefined)
    mockInstalledStateStore.refresh.mockResolvedValue(undefined)

    context = {
      subscriptions: [],
      extensionUri: { fsPath: '/mock/path' },
      extension: {
        packageJSON: {
          version: '1.2.3',
        },
      },
    } as unknown as vscode.ExtensionContext
  })

  it('should create services and register webview provider', () => {
    activate(context)

    expect(vscode.window.createOutputChannel).toHaveBeenCalledWith('Agent Skills', { log: true })
    expect(LoggingService).toHaveBeenCalledTimes(1)
    expect(context.subscriptions).toContain(mockLoggingService)
    expect(context.subscriptions).toContain(mockScanner)
    expect(context.subscriptions).toContain(mockInstalledStateStore)

    expect(SidebarProvider).toHaveBeenCalledTimes(1)
    expect(vscode.window.registerWebviewViewProvider).toHaveBeenCalledWith('agentSkillsSidebar', expect.anything(), {
      webviewOptions: { retainContextWhenHidden: true },
    })
    expect(context.subscriptions.length).toBeGreaterThanOrEqual(3)
  })

  it('should not register command palette lifecycle commands', () => {
    activate(context)

    expect(vscode.commands.registerCommand).not.toHaveBeenCalled()
  })

  it('should not contribute command palette lifecycle commands in the manifest', () => {
    const packageJsonPath = new URL('../../package.json', import.meta.url)
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      contributes?: { commands?: Array<{ command: string }> }
    }

    const contributedCommands = packageJson.contributes?.commands?.map((command) => command.command) ?? []

    expect(contributedCommands).not.toContain('agentSkills.add')
    expect(contributedCommands).not.toContain('agentSkills.remove')
    expect(contributedCommands).not.toContain('agentSkills.update')
  })

  it('should log diagnostic info on activation', () => {
    activate(context)

    expect(mockLoggingService.info).toHaveBeenCalledWith(expect.stringContaining('v1.2.3 activated'))
    expect(mockLoggingService.info).toHaveBeenCalledWith(expect.stringContaining('VS Code'))
    expect(mockLoggingService.info).toHaveBeenCalledWith(expect.stringContaining('Workspace trusted'))
  })

  it('should start background priming and installed-state refresh on activation', () => {
    activate(context)

    expect(mockRegistryStore.prime).toHaveBeenCalled()
    expect(mockInstalledStateStore.refresh).toHaveBeenCalled()
  })

  it('should deactivate without error', () => {
    expect(() => deactivate()).not.toThrow()
  })
})
