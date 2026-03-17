import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { InstalledStateStore } from '../../services/installed-state-store'
import type { LoggingService } from '../../services/logging-service'
import type { SkillLockService } from '../../services/skill-lock-service'
import type { StateReconciler } from '../../services/state-reconciler'
import type { InstalledSkillsMap } from '../../shared/types'

type AsyncMockableFn<TReturn = unknown, TArgs extends Array<unknown> = Array<unknown>> = (
  ...args: TArgs
) => Promise<TReturn>

describe('InstalledStateStore', () => {
  let reconciler: jest.Mocked<Pick<StateReconciler, 'reconcile' | 'getInstalledSkills' | 'onStateChanged'>>
  let skillLockService: jest.Mocked<Pick<SkillLockService, 'getInstalledHashes'>>
  let logger: jest.Mocked<Pick<LoggingService, 'debug'>>
  let stateChangedHandler: ((state: InstalledSkillsMap) => void) | undefined

  const installedSkills: InstalledSkillsMap = {
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
  }

  beforeEach(() => {
    stateChangedHandler = undefined

    reconciler = {
      reconcile: jest.fn<AsyncMockableFn<void>>().mockResolvedValue(undefined),
      getInstalledSkills: jest.fn<AsyncMockableFn<InstalledSkillsMap>>().mockResolvedValue(installedSkills),
      onStateChanged: jest.fn((handler: (state: InstalledSkillsMap) => void) => {
        stateChangedHandler = handler
      }),
    }

    skillLockService = {
      getInstalledHashes: jest
        .fn<AsyncMockableFn<Record<string, string | undefined>>>()
        .mockResolvedValue({ seo: 'hash-123' }),
    }

    logger = {
      debug: jest.fn(),
    }
  })

  it('starts with an empty installed snapshot', () => {
    const store = new InstalledStateStore(reconciler, skillLockService, logger)

    expect(store.getSnapshot()).toEqual({
      installedSkills: {},
      lastUpdatedAt: null,
    })
  })

  it('refreshes installed state and merges lockfile hashes', async () => {
    const store = new InstalledStateStore(reconciler, skillLockService, logger)

    await store.refresh()

    expect(reconciler.reconcile).toHaveBeenCalled()
    expect(store.getSnapshot()).toEqual({
      installedSkills: {
        seo: {
          ...installedSkills.seo,
          contentHash: 'hash-123',
        },
      },
      lastUpdatedAt: expect.any(String),
    })
  })

  it('publishes reconciler state changes to subscribers', async () => {
    const store = new InstalledStateStore(reconciler, skillLockService, logger)
    const listener = jest.fn()
    store.subscribe(listener)

    stateChangedHandler?.(installedSkills)
    await Promise.resolve()

    expect(listener).toHaveBeenCalledWith({
      installedSkills: {
        seo: {
          ...installedSkills.seo,
          contentHash: 'hash-123',
        },
      },
      lastUpdatedAt: expect.any(String),
    })
  })
})
