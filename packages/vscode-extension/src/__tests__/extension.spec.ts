import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import * as vscode from 'vscode'
import type { CliHealthStatus, SkillRegistry } from '../shared/types'

type MockableFn<T = unknown> = (...args: Array<unknown>) => T

const mockRegistryPayload: SkillRegistry = {
  version: '1.0.0',
  categories: {},
  skills: [],
}

const mockHealthStatus: CliHealthStatus = { status: 'ok', version: '1.0.0' }

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

const mockCliSpawner = { dispose: jest.fn<MockableFn<void>>() }
const mockOperationQueue = { dispose: jest.fn<MockableFn<void>>() }
const mockOrchestrator = {
  setCliHealthy: jest.fn<MockableFn<void>>(),
  dispose: jest.fn<MockableFn<void>>(),
}
const mockHealthChecker = {
  check: jest.fn<MockableFn<Promise<CliHealthStatus>>>().mockResolvedValue(mockHealthStatus),
  dispose: jest.fn<MockableFn<void>>(),
}
const mockScanner = {}
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

jest.unstable_mockModule('../services/cli-spawner', () => ({
  CliSpawner: jest.fn<MockableFn<typeof mockCliSpawner>>(() => mockCliSpawner),
}))

jest.unstable_mockModule('../services/operation-queue', () => ({
  OperationQueue: jest.fn<MockableFn<typeof mockOperationQueue>>(() => mockOperationQueue),
}))

jest.unstable_mockModule('../services/installation-orchestrator', () => ({
  InstallationOrchestrator: jest.fn<MockableFn<typeof mockOrchestrator>>(() => mockOrchestrator),
}))

jest.unstable_mockModule('../services/cli-health-checker', () => ({
  CliHealthChecker: jest.fn<MockableFn<typeof mockHealthChecker>>(() => mockHealthChecker),
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
const { SidebarProvider } = await import('../providers/sidebar-provider')
const { StateReconciler } = await import('../services/state-reconciler')

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
    ;(SkillLockService as unknown as jest.Mock<() => typeof mockSkillLockService>).mockImplementation(
      () => mockSkillLockService,
    )

    // Reset mock return values
    mockRegistryService.getRegistry.mockResolvedValue({ version: '1.0.0', categories: {}, skills: [] })
    mockRegistryService.refresh.mockResolvedValue({ version: '1.0.0', categories: {}, skills: [] })
    mockReconciler.reconcile.mockResolvedValue(undefined)

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

    expect(SidebarProvider).toHaveBeenCalledTimes(1)
    expect(vscode.window.registerWebviewViewProvider).toHaveBeenCalledWith('agentSkillsSidebar', expect.anything())
    expect(context.subscriptions.length).toBeGreaterThanOrEqual(3)
  })

  it('should register extension commands', () => {
    activate(context)

    expect(vscode.commands.registerCommand).toHaveBeenCalledWith('agentSkills.refresh', expect.any(Function))
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith('agentSkills.openSettings', expect.any(Function))
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith('agentSkills.add', expect.any(Function))
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith('agentSkills.remove', expect.any(Function))
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith('agentSkills.update', expect.any(Function))
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith('agentSkills.repair', expect.any(Function))
    expect(context.subscriptions.length).toBeGreaterThanOrEqual(4)
  })

  it('should log diagnostic info on activation', () => {
    activate(context)

    expect(mockLoggingService.info).toHaveBeenCalledWith(expect.stringContaining('v1.2.3 activated'))
    expect(mockLoggingService.info).toHaveBeenCalledWith(expect.stringContaining('VS Code'))
    expect(mockLoggingService.info).toHaveBeenCalledWith(expect.stringContaining('Workspace trusted'))
  })

  it('should handle agentSkills.refresh command', async () => {
    activate(context)
    const calls = (vscode.commands.registerCommand as unknown as jest.Mock<(...args: Array<unknown>) => unknown>).mock
      .calls
    const refreshCall = calls.find((c: unknown[]) => c[0] === 'agentSkills.refresh')
    const handler = refreshCall?.[1] as (...args: unknown[]) => Promise<void>

    await handler()

    expect(mockLoggingService.info).toHaveBeenCalledWith('Refresh command invoked')
    expect(mockRegistryService.refresh).toHaveBeenCalled()
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Agent Skills: Registry refreshed')
  })

  it('should handle agentSkills.openSettings command', () => {
    activate(context)
    const calls = (vscode.commands.registerCommand as unknown as jest.Mock<(...args: Array<unknown>) => unknown>).mock
      .calls
    const settingsCall = calls.find((c: unknown[]) => c[0] === 'agentSkills.openSettings')
    const handler = settingsCall?.[1] as (...args: unknown[]) => unknown

    handler()

    expect(mockLoggingService.info).toHaveBeenCalledWith('Open Settings command invoked')
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
      'workbench.action.openSettings',
      '@ext:tech-leads-club.agent-skills',
    )
  })

  it('should start reconciler on activation', () => {
    activate(context)
    expect(mockReconciler.start).toHaveBeenCalled()
  })

  it('should deactivate without error', () => {
    expect(() => deactivate()).not.toThrow()
  })
})
