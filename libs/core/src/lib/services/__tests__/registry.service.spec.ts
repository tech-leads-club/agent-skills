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
  downloadSkill,
  fetchRegistry,
  getCacheDir,
  getCachedContentHash,
  getRemoteCategories,
  getRemoteSkills,
  getSkillCachePath,
  getSkillMetadata,
} from '../registry.service'

type TestPorts = {
  ports: CorePorts
  existsSyncMock: jest.MockedFunction<(path: string) => boolean>
  mkdirMock: jest.MockedFunction<(path: string, options?: { recursive?: boolean }) => Promise<void>>
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
  const mkdirMock = jest.fn<(path: string, options?: { recursive?: boolean }) => Promise<void>>()
  const readFileSyncMock = jest.fn<(path: string, encoding: string) => string>()
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
  mkdirMock.mockResolvedValue(undefined)
  getEnvMock.mockImplementation((key) => (key === 'SKILLS_CDN_REF' ? 'main' : undefined))
  getLatestVersionMock.mockResolvedValue('9.9.9')

  const fs = {
    existsSync: existsSyncMock,
    mkdir: mkdirMock,
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
    mkdirMock,
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
  it('returns the expected skill cache path format', () => {
    expect(getSkillCachePath('my-skill')).toBe('.cache/agent-skills/skills/my-skill')
  })

  it('returns the expected base cache directory', () => {
    expect(getCacheDir()).toBe('.cache/agent-skills')
  })

  it('returns undefined when no content hash was cached', () => {
    expect(getCachedContentHash('unknown-skill')).toBeUndefined()
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
      (path) => path === '/home/tester/.cache/agent-skills' || path === '/home/tester/.cache/agent-skills/skills',
    )
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
