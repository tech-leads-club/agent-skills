import { beforeEach, describe, expect, it, jest } from '@jest/globals'

import type {
  CorePorts,
  EnvPort,
  FileSystemPort,
  HttpPort,
  LoggerPort,
  PackageResolverPort,
  ShellPort,
} from '../../ports'
import type { SkillsRegistry } from '../../types'

import {
  clearCache,
  clearRegistryCache,
  clearSkillCache,
  downloadSkill,
  ensureSkillDownloaded,
  fetchRegistry,
  forceDownloadSkill,
  getCacheDir,
  getCachedContentHash,
  getDeprecatedMap,
  getDeprecatedSkills,
  getRemoteCategories,
  getRemoteSkills,
  getSkillCachePath,
  getSkillMetadata,
  getUpdatableSkills,
  isSkillCached,
  needsUpdate,
} from '../registry.service'

type TestPorts = {
  ports: CorePorts
  existsSyncMock: jest.MockedFunction<(path: string) => boolean>
  mkdirSyncMock: jest.MockedFunction<(path: string, options?: { recursive?: boolean }) => void>
  rmSyncMock: jest.MockedFunction<(path: string, options?: { recursive?: boolean; force?: boolean }) => void>
  readFileSyncMock: jest.MockedFunction<(path: string, encoding: string) => string>
  writeFileSyncMock: jest.MockedFunction<(path: string, content: string, encoding: string) => void>
  getWithFallbackMock: jest.MockedFunction<
    (
      url: string,
      fallbackUrl?: string,
    ) => Promise<{ ok: boolean; status: number; json(): Promise<unknown>; text(): Promise<string> }>
  >
  getEnvMock: jest.MockedFunction<(key: string) => string | undefined>
  getLatestVersionMock: jest.MockedFunction<(packageName: string) => Promise<string>>
  loggerErrorMock: jest.MockedFunction<(message: string) => void>
}

const createPorts = (): TestPorts => {
  const existsSyncMock = jest.fn<(path: string) => boolean>()
  const mkdirSyncMock = jest.fn<(path: string, options?: { recursive?: boolean }) => void>()
  const readFileSyncMock = jest.fn<(path: string, encoding: string) => string>()
  const rmSyncMock = jest.fn<(path: string, options?: { recursive?: boolean; force?: boolean }) => void>()
  const writeFileSyncMock = jest.fn<(path: string, content: string, encoding: string) => void>()
  const getWithFallbackMock =
    jest.fn<
      (
        url: string,
        fallbackUrl?: string,
      ) => Promise<{ ok: boolean; status: number; json(): Promise<unknown>; text(): Promise<string> }>
    >()
  const getEnvMock = jest.fn<(key: string) => string | undefined>()
  const getLatestVersionMock = jest.fn<(packageName: string) => Promise<string>>()
  const loggerErrorMock = jest.fn<(message: string) => void>()

  existsSyncMock.mockReturnValue(false)
  mkdirSyncMock.mockReturnValue(undefined)
  getEnvMock.mockImplementation((key) => (key === 'SKILLS_CDN_REF' ? 'main' : undefined))
  getLatestVersionMock.mockResolvedValue('9.9.9')

  const fs = {
    existsSync: existsSyncMock,
    mkdirSync: mkdirSyncMock,
    rmSync: rmSyncMock,
    readFileSync: readFileSyncMock,
    writeFileSync: writeFileSyncMock,
  } as unknown as FileSystemPort

  const http = {
    getWithFallback: getWithFallbackMock,
  } as unknown as HttpPort

  const env = {
    cwd: jest.fn(() => '/workspace/project/packages/cli'),
    homedir: jest.fn(() => '/home/tester'),
    platform: jest.fn(() => 'linux'),
    getEnv: getEnvMock,
  } as unknown as EnvPort

  const packageResolver = {
    getLatestVersion: getLatestVersionMock,
  } as unknown as PackageResolverPort

  const logger = {
    error: loggerErrorMock,
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  } as unknown as LoggerPort

  const ports: CorePorts = {
    fs,
    http,
    env,
    logger,
    packageResolver,
    shell: {} as ShellPort,
  }

  return {
    ports,
    existsSyncMock,
    mkdirSyncMock,
    rmSyncMock,
    readFileSyncMock,
    writeFileSyncMock,
    getWithFallbackMock,
    getEnvMock,
    getLatestVersionMock,
    loggerErrorMock,
  }
}

const registryFixture: SkillsRegistry = {
  version: 'main',
  generatedAt: '2026-03-13T12:00:00.000Z',
  baseUrl: 'https://cdn.jsdelivr.net/npm/@tech-leads-club/skills-catalog@main/skills',
  categories: {
    quality: { name: 'Quality' },
  },
  skills: [
    {
      name: 'accessibility',
      description: 'Improve accessibility',
      category: 'quality',
      path: '(quality)/accessibility',
      files: ['SKILL.md'],
      contentHash: 'abc123',
    },
  ],
}

beforeEach(() => {
  jest.useRealTimers()
})

describe('registry cache path helpers', () => {
  it('returns the absolute skill cache path', () => {
    const { ports } = createPorts()
    expect(getSkillCachePath(ports, 'my-skill')).toBe('/home/tester/.cache/agent-skills/skills/my-skill')
  })

  it('returns the absolute base cache directory', () => {
    const { ports } = createPorts()
    expect(getCacheDir(ports)).toBe('/home/tester/.cache/agent-skills')
  })

  it('reads cached content hash from metadata file', () => {
    const { ports, existsSyncMock, readFileSyncMock } = createPorts()
    existsSyncMock.mockImplementation(
      (path) => path === '/home/tester/.cache/agent-skills/skills/accessibility/.skill-meta.json',
    )
    readFileSyncMock.mockReturnValue('{"contentHash":"disk-hash","downloadedAt":100}')

    expect(getCachedContentHash(ports, 'accessibility')).toBe('disk-hash')
  })

  it('returns undefined when no metadata file exists', () => {
    const { ports } = createPorts()
    expect(getCachedContentHash(ports, 'unknown-skill')).toBeUndefined()
  })
})

describe('fetchRegistry', () => {
  it('returns a parsed registry when remote fetch succeeds', async () => {
    const { ports, getWithFallbackMock } = createPorts()
    getWithFallbackMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => registryFixture,
      text: async () => JSON.stringify(registryFixture),
    })

    const result = await fetchRegistry(ports)

    expect(result).toEqual(registryFixture)
  })

  it('returns the cached registry when cache is fresh and forceRefresh is false', async () => {
    const { ports, existsSyncMock, readFileSyncMock, getWithFallbackMock } = createPorts()
    const fetchedAt = Date.now() - 60_000

    existsSyncMock.mockImplementation(
      (path) =>
        path === '/home/tester/.cache/agent-skills' ||
        path === '/home/tester/.cache/agent-skills/skills' ||
        path === '/home/tester/.cache/agent-skills/registry.json',
    )
    readFileSyncMock.mockReturnValue(JSON.stringify({ fetchedAt, registry: registryFixture }))

    const result = await fetchRegistry(ports)

    expect(result).toEqual(registryFixture)
    expect(getWithFallbackMock).not.toHaveBeenCalled()
  })

  it('fetches from remote when forceRefresh is true even with cache available', async () => {
    const { ports, existsSyncMock, readFileSyncMock, getWithFallbackMock } = createPorts()
    const staleRegistry = { ...registryFixture, version: 'old' }

    existsSyncMock.mockImplementation(
      (path) =>
        path === '/home/tester/.cache/agent-skills' ||
        path === '/home/tester/.cache/agent-skills/skills' ||
        path === '/home/tester/.cache/agent-skills/registry.json',
    )
    readFileSyncMock.mockReturnValue(JSON.stringify({ fetchedAt: Date.now(), registry: staleRegistry }))
    getWithFallbackMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => registryFixture,
      text: async () => JSON.stringify(registryFixture),
    })

    const result = await fetchRegistry(ports, true)

    expect(result).toEqual(registryFixture)
    expect(getWithFallbackMock).toHaveBeenCalledTimes(1)
  })

  it('returns null and logs an error when fetch fails and cache is unavailable', async () => {
    const { ports, getWithFallbackMock, loggerErrorMock } = createPorts()
    getWithFallbackMock.mockRejectedValue(new Error('network down'))

    const result = await fetchRegistry(ports)

    expect(result).toBeNull()
    expect(loggerErrorMock).toHaveBeenCalledTimes(1)
  })
})

describe('downloadSkill', () => {
  it('downloads a skill and writes its files to the local cache', async () => {
    const { ports, getWithFallbackMock, writeFileSyncMock } = createPorts()
    getWithFallbackMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '# Skill content',
    })

    const cachedPath = await downloadSkill(ports, registryFixture.skills[0])

    expect(cachedPath).toBe('/home/tester/.cache/agent-skills/skills/accessibility')
    expect(writeFileSyncMock).toHaveBeenCalledWith(
      '/home/tester/.cache/agent-skills/skills/accessibility/SKILL.md',
      '# Skill content',
      'utf-8',
    )
  })

  it('returns null when one of the skill files fails to download', async () => {
    const { ports, getWithFallbackMock, loggerErrorMock } = createPorts()
    getWithFallbackMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
      text: async () => '',
    })

    const cachedPath = await downloadSkill(ports, registryFixture.skills[0])

    expect(cachedPath).toBeNull()
    expect(loggerErrorMock).toHaveBeenCalledTimes(1)
  })
})

describe('remote registry listing', () => {
  it('returns remote skills and uses local cache path when a skill is cached', async () => {
    const { ports, existsSyncMock, getWithFallbackMock } = createPorts()

    existsSyncMock.mockImplementation(
      (path) => path === '/home/tester/.cache/agent-skills/skills/accessibility/SKILL.md',
    )
    getWithFallbackMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => registryFixture,
      text: async () => JSON.stringify(registryFixture),
    })

    const skills = await getRemoteSkills(ports)

    expect(skills).toEqual([
      {
        name: 'accessibility',
        description: 'Improve accessibility',
        path: '/home/tester/.cache/agent-skills/skills/accessibility',
        category: 'quality',
      },
    ])
  })

  it('returns sorted remote categories from the registry payload', async () => {
    const { ports, getWithFallbackMock } = createPorts()
    getWithFallbackMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ...registryFixture,
        categories: {
          testing: { name: 'Testing' },
          quality: { name: 'Quality', description: 'Quality skills' },
        },
      }),
      text: async () => '',
    })

    const categories = await getRemoteCategories(ports)

    expect(categories).toEqual([
      { id: 'quality', name: 'Quality', description: 'Quality skills' },
      { id: 'testing', name: 'Testing', description: undefined },
    ])
  })
})

describe('getSkillMetadata', () => {
  it('returns metadata for an existing skill', async () => {
    const { ports, getWithFallbackMock } = createPorts()
    getWithFallbackMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => registryFixture,
      text: async () => JSON.stringify(registryFixture),
    })

    const metadata = await getSkillMetadata(ports, 'accessibility')

    expect(metadata).toEqual(registryFixture.skills[0])
  })

  it('returns null when the skill is not in the registry', async () => {
    const { ports, getWithFallbackMock } = createPorts()
    getWithFallbackMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => registryFixture,
      text: async () => JSON.stringify(registryFixture),
    })

    const metadata = await getSkillMetadata(ports, 'non-existent-skill')

    expect(metadata).toBeNull()
  })
})

describe('deprecated registry entries', () => {
  it('returns deprecated skills from registry payload', async () => {
    const { ports, getWithFallbackMock } = createPorts()
    getWithFallbackMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ...registryFixture,
        deprecated: [
          {
            name: 'legacy-accessibility',
            message: 'Use accessibility instead',
            alternatives: ['accessibility'],
          },
        ],
      }),
      text: async () => '',
    })

    const deprecated = await getDeprecatedSkills(ports)

    expect(deprecated).toEqual([
      {
        name: 'legacy-accessibility',
        message: 'Use accessibility instead',
        alternatives: ['accessibility'],
      },
    ])
  })

  it('returns a deprecated map keyed by skill name', async () => {
    const { ports, getWithFallbackMock } = createPorts()
    getWithFallbackMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ...registryFixture,
        deprecated: [
          {
            name: 'legacy-accessibility',
            message: 'Use accessibility instead',
          },
        ],
      }),
      text: async () => '',
    })

    const deprecatedMap = await getDeprecatedMap(ports)

    expect(deprecatedMap.get('legacy-accessibility')).toEqual({
      name: 'legacy-accessibility',
      message: 'Use accessibility instead',
    })
  })
})

describe('update detection', () => {
  it('returns true when cached content hash differs from remote metadata hash', async () => {
    const { ports, existsSyncMock, readFileSyncMock, getWithFallbackMock } = createPorts()

    existsSyncMock.mockImplementation(
      (path) =>
        path === '/home/tester/.cache/agent-skills' ||
        path === '/home/tester/.cache/agent-skills/skills' ||
        path === '/home/tester/.cache/agent-skills/skills/accessibility/SKILL.md' ||
        path === '/home/tester/.cache/agent-skills/skills/accessibility/.skill-meta.json',
    )
    readFileSyncMock.mockReturnValue('{"contentHash":"old-hash","downloadedAt":100}')
    getWithFallbackMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => registryFixture,
      text: async () => JSON.stringify(registryFixture),
    })

    const shouldUpdate = await needsUpdate(ports, 'accessibility')

    expect(shouldUpdate).toBe(true)
  })

  it('returns false when cached and remote hashes match', async () => {
    const { ports, existsSyncMock, readFileSyncMock, getWithFallbackMock } = createPorts()

    existsSyncMock.mockImplementation(
      (path) =>
        path === '/home/tester/.cache/agent-skills' ||
        path === '/home/tester/.cache/agent-skills/skills' ||
        path === '/home/tester/.cache/agent-skills/skills/accessibility/SKILL.md' ||
        path === '/home/tester/.cache/agent-skills/skills/accessibility/.skill-meta.json',
    )
    readFileSyncMock.mockReturnValue('{"contentHash":"abc123","downloadedAt":100}')
    getWithFallbackMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => registryFixture,
      text: async () => JSON.stringify(registryFixture),
    })

    const shouldUpdate = await needsUpdate(ports, 'accessibility')

    expect(shouldUpdate).toBe(false)
  })

  it('returns false when skill metadata is missing in remote registry', async () => {
    const { ports, existsSyncMock, readFileSyncMock, getWithFallbackMock } = createPorts()

    existsSyncMock.mockImplementation(
      (path) =>
        path === '/home/tester/.cache/agent-skills' ||
        path === '/home/tester/.cache/agent-skills/skills' ||
        path === '/home/tester/.cache/agent-skills/skills/accessibility/SKILL.md' ||
        path === '/home/tester/.cache/agent-skills/skills/accessibility/.skill-meta.json',
    )
    readFileSyncMock.mockReturnValue('{"contentHash":"abc123","downloadedAt":100}')
    getWithFallbackMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ...registryFixture, skills: [] }),
      text: async () => '',
    })

    const shouldUpdate = await needsUpdate(ports, 'accessibility')

    expect(shouldUpdate).toBe(false)
  })

  it('returns grouped update status for a list of skills', async () => {
    const { ports, existsSyncMock, readFileSyncMock, getWithFallbackMock } = createPorts()

    existsSyncMock.mockImplementation((path) => {
      if (path === '/home/tester/.cache/agent-skills' || path === '/home/tester/.cache/agent-skills/skills') return true
      if (path.endsWith('/alpha/SKILL.md') || path.endsWith('/beta/SKILL.md')) return true
      if (path.endsWith('/alpha/.skill-meta.json') || path.endsWith('/beta/.skill-meta.json')) return true
      return false
    })

    readFileSyncMock.mockImplementation((path) => {
      if (path.endsWith('/alpha/.skill-meta.json')) return '{"contentHash":"old-alpha","downloadedAt":100}'
      if (path.endsWith('/beta/.skill-meta.json')) return '{"contentHash":"hash-beta","downloadedAt":100}'
      return ''
    })

    getWithFallbackMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ...registryFixture,
        skills: [
          {
            name: 'alpha',
            description: 'alpha',
            category: 'quality',
            path: '(quality)/alpha',
            files: ['SKILL.md'],
            contentHash: 'hash-alpha',
          },
          {
            name: 'beta',
            description: 'beta',
            category: 'quality',
            path: '(quality)/beta',
            files: ['SKILL.md'],
            contentHash: 'hash-beta',
          },
        ],
      }),
      text: async () => '',
    })

    const result = await getUpdatableSkills(ports, ['alpha', 'beta'])

    expect(result).toEqual({
      toUpdate: ['alpha'],
      upToDate: ['beta'],
    })
  })
})

describe('cache management', () => {
  it('reports cache presence based on SKILL.md availability', () => {
    const { ports, existsSyncMock } = createPorts()
    existsSyncMock.mockImplementation(
      (path) => path === '/home/tester/.cache/agent-skills/skills/accessibility/SKILL.md',
    )

    expect(isSkillCached(ports, 'accessibility')).toBe(true)
    expect(isSkillCached(ports, 'missing')).toBe(false)
  })

  it('returns cached path without download when skill already exists', async () => {
    const { ports, existsSyncMock, getWithFallbackMock } = createPorts()
    existsSyncMock.mockImplementation(
      (path) => path === '/home/tester/.cache/agent-skills/skills/accessibility/SKILL.md',
    )

    const path = await ensureSkillDownloaded(ports, 'accessibility')

    expect(path).toBe('/home/tester/.cache/agent-skills/skills/accessibility')
    expect(getWithFallbackMock).not.toHaveBeenCalled()
  })

  it('returns null when ensureSkillDownloaded cannot resolve metadata', async () => {
    const { ports, existsSyncMock, getWithFallbackMock } = createPorts()
    existsSyncMock.mockReturnValue(false)
    getWithFallbackMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ...registryFixture, skills: [] }),
      text: async () => '',
    })

    const path = await ensureSkillDownloaded(ports, 'missing-skill')

    expect(path).toBeNull()
  })

  it('forces redownload by clearing skill cache first', async () => {
    const { ports, existsSyncMock, getWithFallbackMock, rmSyncMock } = createPorts()
    existsSyncMock.mockImplementation((path) =>
      [
        '/home/tester/.cache/agent-skills',
        '/home/tester/.cache/agent-skills/skills',
        '/home/tester/.cache/agent-skills/skills/accessibility',
      ].includes(path),
    )
    getWithFallbackMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => registryFixture,
      text: async () => '# Skill content',
    })

    const path = await forceDownloadSkill(ports, 'accessibility')

    expect(path).toBe('/home/tester/.cache/agent-skills/skills/accessibility')
    expect(rmSyncMock).toHaveBeenCalledWith('/home/tester/.cache/agent-skills/skills/accessibility', {
      recursive: true,
      force: true,
    })
  })

  it('clears global cache and registry cache paths', () => {
    const { ports, rmSyncMock } = createPorts()

    clearCache(ports)
    clearSkillCache(ports, 'accessibility')
    clearRegistryCache(ports)

    expect(rmSyncMock).toHaveBeenCalledWith('/home/tester/.cache/agent-skills', {
      recursive: true,
      force: true,
    })
    expect(rmSyncMock).toHaveBeenCalledWith('/home/tester/.cache/agent-skills/skills/accessibility', {
      recursive: true,
      force: true,
    })
    expect(rmSyncMock).toHaveBeenCalledWith('/home/tester/.cache/agent-skills/registry.json', { force: true })
  })
})
