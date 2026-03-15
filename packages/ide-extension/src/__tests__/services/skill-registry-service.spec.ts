import { jest } from '@jest/globals'
import * as vscode from 'vscode'
import type { LoggingService } from '../../services/logging-service'
import type { SkillRegistry } from '../../shared/types'

type SyncMockableFn<TReturn = unknown, TArgs extends Array<unknown> = Array<unknown>> = (
  ...args: TArgs
) => TReturn

type AsyncMockableFn<TReturn = unknown, TArgs extends Array<unknown> = Array<unknown>> = (
  ...args: TArgs
) => Promise<TReturn>

const mockFetchRegistry = jest.fn<(...args: unknown[]) => Promise<unknown>>()

jest.unstable_mockModule('@tech-leads-club/core', () =>
  import('@tech-leads-club/core').then((actual) => ({
    ...actual,
    fetchRegistry: mockFetchRegistry,
  })),
)

const { SkillRegistryService } = await import('../../services/skill-registry-service')
const { createNodeAdapters } = await import('@tech-leads-club/core')

describe('SkillRegistryService', () => {
  let service: InstanceType<typeof SkillRegistryService>
  let mockContext: vscode.ExtensionContext
  let mockLogger: LoggingService
  let mockGlobalState: vscode.Memento
  const getStateMock = () => mockGlobalState.get as jest.Mock<SyncMockableFn>

  const mockRegistry: SkillRegistry = {
    version: '1.0.0',
    categories: {
      security: { name: 'Security', description: 'Security tools' },
    },
    skills: [
      {
        name: 'test-skill',
        description: 'A test skill',
        category: 'security',
        path: '.agent/skills/test-skill',
        files: ['SKILL.md'],
        contentHash: 'abc123',
      },
    ],
  }

  const coreRegistryPayload = {
    ...mockRegistry,
    generatedAt: '2026-01-01T00:00:00.000Z',
    baseUrl: 'https://cdn.example.com/skills',
  }

  beforeEach(() => {
    // Mock globalState
    mockGlobalState = {
      get: jest.fn<SyncMockableFn>(),
      update: jest.fn<AsyncMockableFn<void>>().mockResolvedValue(undefined),
      keys: jest.fn<SyncMockableFn>(),
      setKeysForSync: jest.fn<SyncMockableFn>(),
    } as unknown as vscode.Memento

    // Mock context
    mockContext = {
      globalState: mockGlobalState,
    } as unknown as vscode.ExtensionContext

    // Mock logger
    mockLogger = {
      info: jest.fn<SyncMockableFn>(),
      warn: jest.fn<SyncMockableFn>(),
      error: jest.fn<SyncMockableFn>(),
      debug: jest.fn<SyncMockableFn>(),
    } as unknown as LoggingService

    mockFetchRegistry.mockClear()

    service = new SkillRegistryService(createNodeAdapters(), mockContext, mockLogger)
  })

  afterEach(() => {
    service.dispose()
  })

  it('fetches registry from CDN and returns parsed data', async () => {
    mockFetchRegistry.mockResolvedValueOnce(coreRegistryPayload)

    const result = await service.getRegistry()

    expect(result).toEqual(mockRegistry)
    expect(mockFetchRegistry).toHaveBeenCalled()
  })

  it('caches successful response in globalState', async () => {
    mockFetchRegistry.mockResolvedValueOnce(coreRegistryPayload)

    await service.getRegistry()

    expect(mockGlobalState.update).toHaveBeenCalledWith(
      'agentSkills.registryCache',
      expect.objectContaining({
        data: mockRegistry,
        timestamp: expect.any(Number),
      }),
    )
  })

  it('returns cached data when cache is fresh (within TTL)', async () => {
    const cachedEntry = {
      data: mockRegistry,
      timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago (fresh)
    }
    getStateMock().mockReturnValue(cachedEntry)

    const result = await service.getRegistry()

    expect(result).toEqual(mockRegistry)
    expect(mockFetchRegistry).toHaveBeenCalled()
  })

  it('fetches fresh data when cache is stale (beyond TTL)', async () => {
    const staleEntry = {
      data: mockRegistry,
      timestamp: Date.now() - 1000 * 60 * 90, // 90 minutes ago (stale)
    }
    getStateMock().mockReturnValue(staleEntry)
    mockFetchRegistry.mockResolvedValueOnce(coreRegistryPayload)

    const result = await service.getRegistry()

    expect(result).toEqual(mockRegistry)
    expect(mockFetchRegistry).toHaveBeenCalled()
  })

  it('returns cached data when network fails', async () => {
    const cachedEntry = {
      data: mockRegistry,
      timestamp: Date.now() - 1000 * 60 * 90, // stale
    }
    getStateMock().mockReturnValue(cachedEntry)
    mockFetchRegistry.mockRejectedValueOnce(new Error('Network error'))

    const result = await service.getRegistry()

    expect(result).toEqual(mockRegistry)
    expect(mockLogger.warn).toHaveBeenCalled()
  })

  it('throws when network fails and no cache exists', async () => {
    getStateMock().mockReturnValue(null)
    mockFetchRegistry.mockRejectedValueOnce(new Error('Network error'))

    await expect(service.getRegistry()).rejects.toThrow('Failed to fetch registry')
  })

  it('rejects malformed registry (non-object)', async () => {
    mockFetchRegistry.mockResolvedValueOnce('not an object')

    await expect(service.getRegistry()).rejects.toThrow()
  })

  it('rejects registry missing skills array', async () => {
    mockFetchRegistry.mockResolvedValueOnce({ version: '1.0.0' })

    await expect(service.getRegistry()).rejects.toThrow()
  })

  it('maps all skills from core payload', async () => {
    const corePayload = {
      version: '1.0.0',
      categories: {},
      skills: [
        {
          name: 'complete-skill',
          description: 'Complete',
          category: 'test',
          path: '/path',
          files: [],
          contentHash: 'hash1',
        },
      ],
    }
    mockFetchRegistry.mockResolvedValueOnce(corePayload)

    const result = await service.getRegistry()

    expect(result.skills).toHaveLength(1)
    expect(result.skills[0].name).toBe('complete-skill')
  })

  it('deduplicates concurrent fetch calls', async () => {
    mockFetchRegistry.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(coreRegistryPayload), 100)),
    )

    // Fire 3 concurrent fetches
    const [result1, result2, result3] = await Promise.all([service.refresh(), service.refresh(), service.refresh()])

    expect(result1).toEqual(mockRegistry)
    expect(result2).toEqual(mockRegistry)
    expect(result3).toEqual(mockRegistry)
    expect(mockFetchRegistry).toHaveBeenCalledTimes(1)
  })
})
