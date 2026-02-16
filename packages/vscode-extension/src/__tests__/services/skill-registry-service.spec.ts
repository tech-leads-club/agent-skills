import { jest } from '@jest/globals'
import * as vscode from 'vscode'
import type { LoggingService } from '../../services/logging-service'
import { SkillRegistryService } from '../../services/skill-registry-service'
import type { SkillRegistry } from '../../shared/types'

type SyncMockableFn<TReturn = unknown, TArgs extends Array<unknown> = Array<unknown>> = (
  ...args: TArgs
) => TReturn

type AsyncMockableFn<TReturn = unknown, TArgs extends Array<unknown> = Array<unknown>> = (
  ...args: TArgs
) => Promise<TReturn>

type FetchResponse = {
  ok: boolean
  json: () => Promise<unknown>
}

// Mock fetch globally
global.fetch = jest.fn<AsyncMockableFn<FetchResponse>>() as unknown as typeof global.fetch
const fetchMock = global.fetch as unknown as jest.Mock<AsyncMockableFn<FetchResponse>>

describe('SkillRegistryService', () => {
  let service: SkillRegistryService
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

    // Clear fetch mock
    fetchMock.mockClear()

    service = new SkillRegistryService(mockContext, mockLogger)
  })

  afterEach(() => {
    service.dispose()
  })

  it('fetches registry from CDN and returns parsed data', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRegistry,
    })

    const result = await service.getRegistry()

    expect(result).toEqual(mockRegistry)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://cdn.jsdelivr.net/gh/tech-leads-club/agent-skills@main/packages/skills-catalog/skills-registry.json',
    )
  })

  it('caches successful response in globalState', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRegistry,
    })

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
    // Fetch should be called in background but we return cached data immediately
    expect(global.fetch).toHaveBeenCalled()
  })

  it('fetches fresh data when cache is stale (beyond TTL)', async () => {
    const staleEntry = {
      data: mockRegistry,
      timestamp: Date.now() - 1000 * 60 * 90, // 90 minutes ago (stale)
    }
    getStateMock().mockReturnValue(staleEntry)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRegistry,
    })

    const result = await service.getRegistry()

    expect(result).toEqual(mockRegistry)
    expect(global.fetch).toHaveBeenCalled()
  })

  it('returns cached data when network fails', async () => {
    const cachedEntry = {
      data: mockRegistry,
      timestamp: Date.now() - 1000 * 60 * 90, // stale
    }
    getStateMock().mockReturnValue(cachedEntry)
    fetchMock.mockRejectedValueOnce(new Error('Network error'))

    const result = await service.getRegistry()

    expect(result).toEqual(mockRegistry)
    expect(mockLogger.warn).toHaveBeenCalled()
  })

  it('throws when network fails and no cache exists', async () => {
    getStateMock().mockReturnValue(null)
    fetchMock.mockRejectedValueOnce(new Error('Network error'))

    await expect(service.getRegistry()).rejects.toThrow('Failed to fetch registry')
  })

  it('rejects malformed JSON (non-object)', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => 'not an object',
    })

    await expect(service.getRegistry()).rejects.toThrow('Invalid registry')
  })

  it('rejects registry missing skills array', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ version: '1.0.0' }),
    })

    await expect(service.getRegistry()).rejects.toThrow('missing or invalid "skills" array')
  })

  it('filters out skills missing required fields', async () => {
    const dirtyRegistry = {
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
        { name: 'missing-description', category: 'test' }, // Missing description
        { description: 'missing-name', category: 'test' }, // Missing name
      ],
    }
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => dirtyRegistry,
    })

    const result = await service.getRegistry()

    expect(result.skills).toHaveLength(1)
    expect(result.skills[0].name).toBe('complete-skill')
    expect(mockLogger.warn).toHaveBeenCalledTimes(2)
  })

  it('deduplicates concurrent fetch calls', async () => {
    fetchMock.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => mockRegistry,
              }),
            100,
          ),
        ),
    )

    // Fire 3 concurrent fetches
    const [result1, result2, result3] = await Promise.all([service.refresh(), service.refresh(), service.refresh()])

    expect(result1).toEqual(mockRegistry)
    expect(result2).toEqual(mockRegistry)
    expect(result3).toEqual(mockRegistry)
    // Fetch should only be called once due to deduplication
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })
})
