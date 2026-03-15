import { jest } from '@jest/globals'
import * as vscode from 'vscode'
import type { InstalledSkillsScanner } from '../../services/installed-skills-scanner'
import type { LoggingService } from '../../services/logging-service'
import type { SkillRegistryService } from '../../services/skill-registry-service'
import { StateReconciler } from '../../services/state-reconciler'
import { AvailableAgent, InstalledSkillsMap, ScopePolicyEvaluation, SkillRegistry } from '../../shared/types'

type AsyncMockableFn<TReturn = unknown, TArgs extends Array<unknown> = Array<unknown>> = (
  ...args: TArgs
) => Promise<TReturn>

describe('StateReconciler Policy', () => {
  let reconciler: StateReconciler
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

    reconciler = new StateReconciler(scanner, registryService, logger)
  })

  it('should refresh watchers when policy is updated', () => {
    // Mock createFileSystemWatcher
    const disposeMock = jest.fn()
    const createWatcherMock = jest.fn().mockReturnValue({
      dispose: disposeMock,
      onDidCreate: jest.fn(),
      onDidDelete: jest.fn(),
      onDidChange: jest.fn(),
    })
    ;(vscode.workspace.createFileSystemWatcher as jest.Mock) = createWatcherMock

    const policy: ScopePolicyEvaluation = {
      allowedScopes: 'local',
      environmentScopes: ['local', 'global'],
      effectiveScopes: ['local'],
      blockedReason: undefined,
    }

    reconciler.updatePolicy(policy)

    // Should create local watchers because 'local' is in effectiveScopes
    expect(createWatcherMock).toHaveBeenCalled()
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
    // Mock createFileSystemWatcher
    const createWatcherMock = jest.fn().mockReturnValue({
      dispose: jest.fn(),
      onDidCreate: jest.fn(),
      onDidDelete: jest.fn(),
      onDidChange: jest.fn(),
    })
    ;(vscode.workspace.createFileSystemWatcher as jest.Mock) = createWatcherMock

    const policy: ScopePolicyEvaluation = {
      allowedScopes: 'global',
      environmentScopes: ['local', 'global'],
      effectiveScopes: ['global'],
      blockedReason: undefined,
    }

    reconciler.updatePolicy(policy)

    // Should NOT create local watchers
    expect(createWatcherMock).not.toHaveBeenCalled()
  })
})
