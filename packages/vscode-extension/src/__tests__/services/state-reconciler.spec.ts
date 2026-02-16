import { jest } from '@jest/globals'
import type { AvailableAgent, InstalledSkillsMap, Skill, SkillRegistry } from '../../shared/types'
import type { InstalledSkillsScanner } from '../../services/installed-skills-scanner'
import type { LoggingService } from '../../services/logging-service'
import type { SkillRegistryService } from '../../services/skill-registry-service'

type SyncMockableFn<TReturn = unknown, TArgs extends Array<unknown> = Array<unknown>> = (
  ...args: TArgs
) => TReturn

type AsyncMockableFn<TReturn = unknown, TArgs extends Array<unknown> = Array<unknown>> = (
  ...args: TArgs
) => Promise<TReturn>

type Listener = () => void
type DisposableLike = { dispose: () => void }

let trustGrantedHandler: Listener | undefined
let changeHandler: Listener | undefined

// Mock dependencies
const mockWatcher = {
  onDidCreate: jest.fn<SyncMockableFn<DisposableLike, [Listener]>>(() => ({ dispose: jest.fn() })),
  onDidDelete: jest.fn<SyncMockableFn<DisposableLike, [Listener]>>(() => ({ dispose: jest.fn() })),
  onDidChange: jest.fn<SyncMockableFn<DisposableLike, [Listener]>>((handler) => {
    changeHandler = handler
    return { dispose: jest.fn() }
  }),
  dispose: jest.fn<SyncMockableFn<void>>(),
}

const mockVscode = {
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/workspace' } }],
    createFileSystemWatcher: jest.fn<SyncMockableFn<typeof mockWatcher, [string]>>(() => mockWatcher),
    isTrusted: true,
    onDidGrantWorkspaceTrust: jest.fn<SyncMockableFn<DisposableLike, [Listener]>>((handler) => {
      trustGrantedHandler = handler
      return { dispose: jest.fn() }
    }),
  },
  window: {
    onDidChangeWindowState: jest.fn<SyncMockableFn<DisposableLike, [(_state: { focused: boolean }) => void]>>(
      () => ({ dispose: jest.fn() }),
    ),
  },
}

const mockScanner: Pick<InstalledSkillsScanner, 'scan' | 'getAvailableAgents'> = {
  scan: jest
    .fn<AsyncMockableFn<InstalledSkillsMap, [Skill[], string | null]>>()
    .mockResolvedValue({} as InstalledSkillsMap),
  getAvailableAgents: jest.fn<AsyncMockableFn<AvailableAgent[], [string | null]>>().mockResolvedValue([]),
}

const mockRegistry: Pick<SkillRegistryService, 'getRegistry'> = {
  getRegistry: jest
    .fn<AsyncMockableFn<SkillRegistry>>()
    .mockResolvedValue({ version: '1.0.0', categories: {}, skills: [] }),
}

const mockLogger: Pick<LoggingService, 'info' | 'debug' | 'error'> = {
  info: jest.fn<SyncMockableFn<void, [string]>>(),
  debug: jest.fn<SyncMockableFn<void, [string]>>(),
  error: jest.fn<SyncMockableFn<void, [string]>>(),
}

jest.unstable_mockModule('vscode', () => mockVscode)
jest.unstable_mockModule('../../services/installed-skills-scanner', () => ({
  InstalledSkillsScanner: jest.fn(() => mockScanner),
}))
jest.unstable_mockModule('../../services/skill-registry-service', () => ({
  SkillRegistryService: jest.fn(() => mockRegistry),
}))
jest.unstable_mockModule('../../services/logging-service', () => ({
  LoggingService: jest.fn(() => mockLogger),
}))

const { StateReconciler } = await import('../../services/state-reconciler')

describe('StateReconciler', () => {
  let reconciler: InstanceType<typeof StateReconciler>

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    trustGrantedHandler = undefined
    changeHandler = undefined
    mockVscode.workspace.isTrusted = true
    reconciler = new StateReconciler(
      mockScanner as InstalledSkillsScanner,
      mockRegistry as SkillRegistryService,
      mockLogger as LoggingService,
    )
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should create local watchers if workspace is trusted', () => {
    reconciler.start()
    expect(mockVscode.workspace.createFileSystemWatcher).toHaveBeenCalled()
  })

  it('should NOT create local watchers if workspace is untrusted', () => {
    mockVscode.workspace.isTrusted = false
    reconciler.start()
    expect(mockVscode.workspace.createFileSystemWatcher).not.toHaveBeenCalled()
  })

  it('should create watchers when trust is granted', () => {
    mockVscode.workspace.isTrusted = false
    reconciler.start()

    // Simulate trust grant
    expect(trustGrantedHandler).toBeDefined()
    mockVscode.workspace.isTrusted = true
    trustGrantedHandler?.()

    expect(mockVscode.workspace.createFileSystemWatcher).toHaveBeenCalled()
  })

  it('should not recreate watchers on repeated trust events', () => {
    reconciler.start()
    const initialCalls = mockVscode.workspace.createFileSystemWatcher.mock.calls.length

    expect(trustGrantedHandler).toBeDefined()
    trustGrantedHandler?.()

    expect(mockVscode.workspace.createFileSystemWatcher).toHaveBeenCalledTimes(initialCalls)
  })

  it('should reconcile on watcher events (debounced)', async () => {
    reconciler.start()

    // Simulate event
    expect(changeHandler).toBeDefined()
    changeHandler?.()
    changeHandler?.() // Debounce check

    expect(mockScanner.scan).not.toHaveBeenCalled() // Not yet

    await jest.runAllTimersAsync()

    expect(mockScanner.scan).toHaveBeenCalledTimes(2) // Initial + 1 debounced
  })
})
