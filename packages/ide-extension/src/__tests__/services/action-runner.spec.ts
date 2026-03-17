import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { InstalledStateSnapshot } from '../../services/installed-state-store'
import type { LoggingService } from '../../services/logging-service'
import type { JobExecutor, JobProgressCallback, JobResult, QueuedJob } from '../../services/operation-queue'
import type { PostInstallVerifier } from '../../services/post-install-verifier'
import type { RegistryStore, RegistryStoreSnapshot } from '../../services/registry-store'
import type { VerifyResult } from '../../shared/types'

const mockVscode = {
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/workspace' } }],
  },
}

jest.unstable_mockModule('vscode', () => mockVscode)

const { ActionRunner } = await import('../../services/action-runner')

type AsyncMock<TReturn, TArgs extends Array<unknown>> = jest.Mock<(...args: TArgs) => Promise<TReturn>>
type ExecuteMock = AsyncMock<JobResult, [QueuedJob, JobProgressCallback?]>

describe('ActionRunner', () => {
  const logger: Pick<LoggingService, 'debug' | 'error' | 'info' | 'warn'> = {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  }

  const verifier: Pick<PostInstallVerifier, 'verify'> = {
    verify: jest.fn<() => Promise<VerifyResult>>(),
  }

  const installedStateStore = {
    getSnapshot: jest.fn<() => InstalledStateSnapshot>(),
    refresh: jest.fn<() => Promise<void>>(),
  }

  const registryStore: Pick<RegistryStore, 'getSnapshot'> = {
    getSnapshot: jest.fn<() => RegistryStoreSnapshot>(),
  }

  const executor: Pick<JobExecutor, 'execute'> = {
    execute: jest.fn<(job: QueuedJob, onProgress?: JobProgressCallback) => Promise<JobResult>>(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    installedStateStore.getSnapshot.mockReturnValue({
      installedSkills: {
        seo: {
          local: true,
          global: true,
          contentHash: 'local-old',
          scopeHashes: { local: 'local-old', global: 'hash-seo' },
          agents: [
            { agent: 'cursor', displayName: 'Cursor', local: true, global: false, corrupted: false },
            { agent: 'claude-code', displayName: 'Claude Code', local: false, global: true, corrupted: false },
          ],
        },
        accessibility: {
          local: false,
          global: true,
          contentHash: 'hash-accessibility-old',
          scopeHashes: { global: 'hash-accessibility-old' },
          agents: [{ agent: 'cursor', displayName: 'Cursor', local: false, global: true, corrupted: false }],
        },
      },
      lastUpdatedAt: null,
    })
    installedStateStore.refresh.mockResolvedValue(undefined)
    ;(
      verifier.verify as AsyncMock<VerifyResult, [string, string[], 'local' | 'global', string | null]>
    ).mockResolvedValue({
      ok: true,
      corrupted: [],
    })
    ;(registryStore.getSnapshot as jest.MockedFunction<() => RegistryStoreSnapshot>).mockReturnValue({
      status: 'ready',
      registry: {
        version: '1',
        categories: {},
        skills: [
          {
            name: 'seo',
            description: 'SEO',
            category: 'search',
            path: 'skills/seo',
            files: ['SKILL.md'],
            contentHash: 'hash-seo',
          },
          {
            name: 'accessibility',
            description: 'Accessibility',
            category: 'quality',
            path: 'skills/accessibility',
            files: ['SKILL.md'],
            contentHash: 'hash-accessibility',
          },
        ],
      },
      fromCache: false,
      errorMessage: null,
    })
  })

  it('rejects a concurrent start while keeping the active action running', async () => {
    let resolveExecution: ((result: JobResult) => void) | undefined
    ;(executor.execute as ExecuteMock).mockImplementation(
      () =>
        new Promise<JobResult>((resolve) => {
          resolveExecution = resolve
        }),
    )

    const runner = new ActionRunner(executor, verifier, installedStateStore, registryStore, logger)

    const firstRun = runner.run({
      action: 'install',
      skills: ['seo'],
      agents: ['cursor'],
      scope: 'local',
      method: 'copy',
    })
    const secondRun = await runner.run({ action: 'remove', skills: ['seo'], agents: ['cursor'], scope: 'local' })

    expect(secondRun.accepted).toBe(false)
    expect(runner.getState().status).toBe('running')
    expect(runner.getState().rejectionMessage).toContain('Another action is already running')

    resolveExecution?.({
      operationId: 'job-1',
      operation: 'install',
      skillName: 'seo',
      status: 'completed',
      metadata: {
        batchId: 'batch',
        batchSize: 1,
        skillNames: ['seo'],
        scope: 'local',
        agents: ['cursor'],
        method: 'copy',
      },
    })

    await firstRun

    expect(runner.getState().status).toBe('completed')
  })

  it('updates only outdated scopes for a selected skill', async () => {
    ;(executor.execute as ExecuteMock).mockResolvedValue({
      operationId: 'job-1',
      operation: 'update',
      skillName: 'seo',
      status: 'completed',
      metadata: { batchId: 'batch', batchSize: 1, skillNames: ['seo'], scope: 'local', agents: ['cursor'] },
    })

    const runner = new ActionRunner(executor, verifier, installedStateStore, registryStore, logger)

    await runner.run({ action: 'update', skills: ['seo'], agents: [], scope: 'all' })

    expect(executor.execute).toHaveBeenCalledTimes(1)
    expect(executor.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'update',
        skillName: 'seo',
        metadata: expect.objectContaining({ scope: 'local', agents: ['cursor'] }),
      }),
      expect.any(Function),
    )
  })

  it('runs update all deterministically across outdated installations', async () => {
    ;(executor.execute as ExecuteMock).mockResolvedValue({
      operationId: 'job-1',
      operation: 'update',
      skillName: 'seo',
      status: 'completed',
      metadata: { batchId: 'batch', batchSize: 2, skillNames: ['seo'], scope: 'local', agents: ['cursor'] },
    })

    const runner = new ActionRunner(executor, verifier, installedStateStore, registryStore, logger)

    await runner.run({ action: 'update', skills: [], agents: [], scope: 'all' })

    expect(executor.execute).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        skillName: 'seo',
        metadata: expect.objectContaining({ scope: 'local', agents: ['cursor'] }),
      }),
      expect.any(Function),
    )
    expect(executor.execute).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        skillName: 'accessibility',
        metadata: expect.objectContaining({ scope: 'global', agents: ['cursor'] }),
      }),
      expect.any(Function),
    )
  })
})
