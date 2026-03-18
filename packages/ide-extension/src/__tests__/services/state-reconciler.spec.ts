import { jest } from '@jest/globals'
import { createNodeAdapters } from '@tech-leads-club/core'
import type { InstalledSkillsScanner } from '../../services/installed-skills-scanner'
import type { LoggingService } from '../../services/logging-service'
import type { SkillRegistryService } from '../../services/skill-registry-service'
import type {
  AvailableAgent,
  InstalledSkillsMap,
  ScopePolicyEvaluation,
  Skill,
  SkillRegistry,
} from '../../shared/types'

type SyncMockableFn<TReturn = unknown, TArgs extends Array<unknown> = Array<unknown>> = (...args: TArgs) => TReturn

type AsyncMockableFn<TReturn = unknown, TArgs extends Array<unknown> = Array<unknown>> = (
  ...args: TArgs
) => Promise<TReturn>

type Listener = () => void
type DisposableLike = { dispose: () => void }

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
  Uri: {
    file: jest.fn<SyncMockableFn<{ fsPath: string }, [string]>>((path) => ({ fsPath: path })),
  },
  RelativePattern: jest.fn<SyncMockableFn<{ baseUri: { fsPath: string }; pattern: string }, [{ fsPath: string }, string]>>(
    (baseUri, pattern) => ({ baseUri, pattern }),
  ),
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/workspace' } }],
    createFileSystemWatcher: jest.fn<SyncMockableFn<typeof mockWatcher, [unknown]>>(() => mockWatcher),
    isTrusted: true,
    onDidGrantWorkspaceTrust: jest.fn<SyncMockableFn<DisposableLike, [Listener]>>(() => ({ dispose: jest.fn() })),
  },
  window: {
    onDidChangeWindowState: jest.fn<SyncMockableFn<DisposableLike, [(_state: { focused: boolean }) => void]>>(() => ({
      dispose: jest.fn(),
    })),
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
  let localOnlyPolicy: ScopePolicyEvaluation
  const ports = createNodeAdapters()

  beforeEach(() => {
    jest.clearAllMocks()
    mockVscode.workspace.createFileSystemWatcher.mockClear()
    jest.useFakeTimers()
    changeHandler = undefined
    mockVscode.workspace.isTrusted = true
    localOnlyPolicy = {
      allowedScopes: 'all',
      environmentScopes: ['local', 'global'],
      effectiveScopes: ['local'],
      blockedReason: undefined,
    }
    reconciler = new StateReconciler(
      ports,
      mockScanner as InstalledSkillsScanner,
      mockRegistry as SkillRegistryService,
      mockLogger as LoggingService,
    )
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should create exactly 1 local lockfile watcher when policy allows local scope', () => {
    reconciler.updatePolicy(localOnlyPolicy)
    const callCount = mockVscode.workspace.createFileSystemWatcher.mock.calls.length
    expect(callCount).toBe(1)
    // Verify the pattern is a RelativePattern with .skill-lock.json
    const firstCall = mockVscode.workspace.createFileSystemWatcher.mock.calls[0]
    const pattern = firstCall[0] as { pattern: string }
    expect(pattern.pattern).toBe('.skill-lock.json')
  })

  it('should NOT create local watchers when policy excludes local scope', () => {
    reconciler.updatePolicy({
      ...localOnlyPolicy,
      effectiveScopes: ['global'] as any,
    })
    // Check that no local watchers were created (may have global)
    const allCalls = mockVscode.workspace.createFileSystemWatcher.mock.calls
    const localCalls = allCalls.filter((call) => {
      const patternArg = (call as unknown[])?.[0] as unknown
      if (!patternArg) return false
      const pattern = patternArg as { baseUri: { fsPath: string } }
      return pattern.baseUri.fsPath.includes('/workspace')
    })
    expect(localCalls.length).toBe(0)
  })

  it('should not recreate watchers on repeated policy updates', () => {
    reconciler.updatePolicy(localOnlyPolicy)
    const initialCalls = mockVscode.workspace.createFileSystemWatcher.mock.calls.length

    reconciler.updatePolicy(localOnlyPolicy)

    // Should not have created additional watchers
    expect(mockVscode.workspace.createFileSystemWatcher.mock.calls.length).toBe(initialCalls)
  })

  it('should reconcile on watcher events (debounced)', async () => {
    reconciler.updatePolicy(localOnlyPolicy)

    // Simulate event
    expect(changeHandler).toBeDefined()
    changeHandler?.()
    changeHandler?.() // Debounce check

    expect(mockScanner.scan).not.toHaveBeenCalled() // Not yet

    await jest.runAllTimersAsync()

    expect(mockScanner.scan).toHaveBeenCalledTimes(1)
  })

  it('should create global lockfile watcher when policy allows global scope', () => {
    const globalPolicy: ScopePolicyEvaluation = {
      ...localOnlyPolicy,
      effectiveScopes: ['global'] as any,
    }
    reconciler.updatePolicy(globalPolicy)
    const globalWatcherCalls = mockVscode.workspace.createFileSystemWatcher.mock.calls.filter((call) => {
      const patternArg = (call as unknown[])?.[0] as unknown
      if (!patternArg) return false
      const pattern = patternArg as { pattern: string }
      return pattern.pattern === '.skill-lock.json'
    })
    expect(globalWatcherCalls.length).toBeGreaterThan(0)
  })
})
