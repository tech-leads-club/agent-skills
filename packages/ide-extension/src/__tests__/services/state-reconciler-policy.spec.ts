import { jest } from '@jest/globals'
import { createNodeAdapters } from '@tech-leads-club/core'
import type { InstalledSkillsScanner } from '../../services/installed-skills-scanner'
import type { LoggingService } from '../../services/logging-service'
import type { SkillRegistryService } from '../../services/skill-registry-service'
import { AvailableAgent, InstalledSkillsMap, ScopePolicyEvaluation, SkillRegistry } from '../../shared/types'

type AsyncMockableFn<TReturn = unknown, TArgs extends Array<unknown> = Array<unknown>> = (
  ...args: TArgs
) => Promise<TReturn>

type Listener = () => void
type DisposableLike = { dispose: () => void }

const mockVscode = {
  Uri: {
    file: jest.fn<(_path: string) => { fsPath: string }>((_path: string) => ({ fsPath: _path })),
  },
  RelativePattern: jest.fn<
    (_baseUri: { fsPath: string }, _pattern: string) => { baseUri: { fsPath: string }; pattern: string }
  >((_baseUri, _pattern) => ({ baseUri: _baseUri, pattern: _pattern })),
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/workspace' } }],
    createFileSystemWatcher: jest.fn(() => ({
      dispose: jest.fn(),
      onDidCreate: jest.fn(() => ({ dispose: jest.fn() })),
      onDidDelete: jest.fn(() => ({ dispose: jest.fn() })),
      onDidChange: jest.fn(() => ({ dispose: jest.fn() })),
    })),
    isTrusted: true,
    onDidGrantWorkspaceTrust: jest.fn<(_listener: Listener) => DisposableLike>((_listener) => ({ dispose: jest.fn() })),
  },
  window: {
    onDidChangeWindowState: jest.fn<(_listener: (_state: { focused: boolean }) => void) => DisposableLike>(
      (_listener) => ({
        dispose: jest.fn(),
      }),
    ),
  },
}

jest.unstable_mockModule('vscode', () => mockVscode)

const { StateReconciler } = await import('../../services/state-reconciler')

describe('StateReconciler Policy', () => {
  let reconciler: InstanceType<typeof StateReconciler>
  let scanner: jest.Mocked<InstalledSkillsScanner>
  let registryService: jest.Mocked<SkillRegistryService>
  let logger: jest.Mocked<LoggingService>

  beforeEach(() => {
    jest.clearAllMocks()

    scanner = {
      scan: jest.fn<AsyncMockableFn<InstalledSkillsMap>>().mockResolvedValue({}),
      getAvailableAgents: jest.fn<AsyncMockableFn<AvailableAgent[]>>().mockResolvedValue([]),
    } as unknown as jest.Mocked<InstalledSkillsScanner>

    registryService = {
      getRegistry: jest
        .fn<AsyncMockableFn<SkillRegistry>>()
        .mockResolvedValue({ version: '1', categories: {}, skills: [] }),
    } as unknown as jest.Mocked<SkillRegistryService>

    logger = {
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<LoggingService>

    reconciler = new StateReconciler(createNodeAdapters(), scanner, registryService, logger)
  })

  it('should refresh watchers when policy is updated', () => {
    const policy: ScopePolicyEvaluation = {
      allowedScopes: 'local',
      environmentScopes: ['local', 'global'],
      effectiveScopes: ['local'],
      blockedReason: undefined,
    }

    reconciler.updatePolicy(policy)

    // Should create local watchers because 'local' is in effectiveScopes
    expect(mockVscode.workspace.createFileSystemWatcher).toHaveBeenCalled()
  })

  it('should pass scope options to scanner based on policy', async () => {
    const policy: ScopePolicyEvaluation = {
      allowedScopes: 'local',
      environmentScopes: ['local', 'global'],
      effectiveScopes: ['local'],
      blockedReason: undefined,
    }

    reconciler.updatePolicy(policy)

    // Trigger reconcile
    await reconciler.reconcile()

    expect(scanner.scan).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ includeLocal: true, includeGlobal: false }),
    )
  })

  it('should disable local watchers if policy excludes local', () => {
    mockVscode.workspace.createFileSystemWatcher.mockClear()

    const policy: ScopePolicyEvaluation = {
      allowedScopes: 'global',
      environmentScopes: ['local', 'global'],
      effectiveScopes: ['global'],
      blockedReason: undefined,
    }

    reconciler.updatePolicy(policy)

    // Should NOT create local watchers
    expect(mockVscode.workspace.createFileSystemWatcher).not.toHaveBeenCalled()
  })
})
