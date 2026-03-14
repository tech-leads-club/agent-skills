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

import { detectMode, discoverCategories, discoverCategoriesAsync, discoverSkills, discoverSkillsAsync, getSkillsDirectory } from '../skills-provider.service'

type TestPorts = {
  ports: CorePorts
  existsSyncMock: jest.MockedFunction<(path: string) => boolean>
  readdirSyncMock: jest.MockedFunction<
    (path: string, options?: { withFileTypes?: boolean }) => { name: string; isDirectory: () => boolean }[]
  >
  readFileSyncMock: jest.MockedFunction<(path: string, encoding: string) => string>
  getWithFallbackMock: jest.MockedFunction<
    (
      url: string,
      fallbackUrl?: string,
    ) => Promise<{ ok: boolean; status: number; json(): Promise<unknown>; text(): Promise<string> }>
  >
}

const createPorts = (): TestPorts => {
  const existsSyncMock = jest.fn<(path: string) => boolean>()
  const readdirSyncMock = jest.fn<
    (path: string, options?: { withFileTypes?: boolean }) => { name: string; isDirectory: () => boolean }[]
  >()
  const readFileSyncMock = jest.fn<(path: string, encoding: string) => string>()
  const getWithFallbackMock = jest.fn<
    (
      url: string,
      fallbackUrl?: string,
    ) => Promise<{ ok: boolean; status: number; json(): Promise<unknown>; text(): Promise<string> }>
  >()

  existsSyncMock.mockReturnValue(false)
  readdirSyncMock.mockReturnValue([])

  const fs = {
    existsSync: existsSyncMock,
    readdirSync: readdirSyncMock,
    readFileSync: readFileSyncMock,
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
    rmSync: jest.fn(),
  } as unknown as FileSystemPort

  const env = {
    cwd: jest.fn(() => '/workspace/project'),
    homedir: jest.fn(() => '/home/tester'),
    platform: jest.fn(() => 'linux'),
    getEnv: jest.fn((key: string) => (key === 'SKILLS_CDN_REF' ? 'main' : undefined)),
  } as unknown as EnvPort

  const http = {
    getWithFallback: getWithFallbackMock,
  } as unknown as HttpPort

  const ports: CorePorts = {
    fs,
    http,
    shell: {} as ShellPort,
    env,
    logger: {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    } as unknown as LoggerPort,
    packageResolver: {
      getLatestVersion: jest.fn<(pkg: string) => Promise<string>>().mockResolvedValue('latest'),
    } as unknown as PackageResolverPort,
  }

  return { ports, existsSyncMock, readdirSyncMock, readFileSyncMock, getWithFallbackMock }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('detectMode', () => {
  it('returns local when skills catalog directory exists', () => {
    const { ports, existsSyncMock } = createPorts()
    existsSyncMock.mockImplementation((p) => p.endsWith('packages/skills-catalog/skills'))

    expect(detectMode(ports)).toBe('local')
  })

  it('returns remote when skills catalog directory does not exist', () => {
    const { ports } = createPorts()

    expect(detectMode(ports)).toBe('remote')
  })
})

describe('getSkillsDirectory', () => {
  it('returns the local catalog path when in local mode', () => {
    const { ports, existsSyncMock } = createPorts()
    existsSyncMock.mockImplementation((p) => p.endsWith('packages/skills-catalog/skills'))

    const dir = getSkillsDirectory(ports)

    expect(dir).toContain('packages/skills-catalog/skills')
  })

  it('throws when in remote mode', () => {
    const { ports } = createPorts()

    expect(() => getSkillsDirectory(ports)).toThrow('Skills directory not found')
  })
})

describe('discoverSkills', () => {
  it('returns skills from the local catalog when skills exist', () => {
    const { ports, existsSyncMock, readdirSyncMock, readFileSyncMock } = createPorts()
    existsSyncMock.mockImplementation((p) => {
      const path = p as string
      return (
        path.endsWith('packages/skills-catalog/skills') ||
        path.endsWith('packages/skills-catalog/skills/accessibility/SKILL.md')
      )
    })
    readdirSyncMock.mockImplementation((p) => {
      const path = p as string
      if (path.endsWith('packages/skills-catalog/skills')) {
        return [{ name: 'accessibility', isDirectory: () => true }]
      }
      return []
    })
    readFileSyncMock.mockReturnValue('---\nname: accessibility\ndescription: Audit web accessibility\n---\n# Body')

    const skills = discoverSkills(ports)

    expect(skills).toHaveLength(1)
    expect(skills[0]).toMatchObject({
      name: 'accessibility',
      description: 'Audit web accessibility',
      category: 'uncategorized',
    })
    expect(skills[0].path).toContain('accessibility')
  })

  it('returns an empty array when in remote mode (no local catalog)', () => {
    const { ports } = createPorts()

    expect(discoverSkills(ports)).toEqual([])
  })

  it('skips skill directories without a valid SKILL.md', () => {
    const { ports, existsSyncMock, readdirSyncMock } = createPorts()
    existsSyncMock.mockImplementation((p) => {
      const path = p as string
      return path.endsWith('packages/skills-catalog/skills')
    })
    readdirSyncMock.mockReturnValue([{ name: 'broken-skill', isDirectory: () => true }])

    expect(discoverSkills(ports)).toEqual([])
  })
})

describe('discoverSkillsAsync', () => {
  it('returns local skills when in local mode', async () => {
    const { ports, existsSyncMock, readdirSyncMock, readFileSyncMock } = createPorts()
    existsSyncMock.mockImplementation((p) => {
      const path = p as string
      return (
        path.endsWith('packages/skills-catalog/skills') ||
        path.endsWith('packages/skills-catalog/skills/seo/SKILL.md')
      )
    })
    readdirSyncMock.mockImplementation((p) => {
      const path = p as string
      if (path.endsWith('packages/skills-catalog/skills')) {
        return [{ name: 'seo', isDirectory: () => true }]
      }
      return []
    })
    readFileSyncMock.mockReturnValue('---\nname: seo\ndescription: SEO optimization\n---\n# Body')

    const skills = await discoverSkillsAsync(ports)

    expect(skills).toHaveLength(1)
    expect(skills[0].name).toBe('seo')
  })

  it('fetches remote skills when in remote mode', async () => {
    const { ports, getWithFallbackMock } = createPorts()
    const remoteRegistry = {
      version: 'main',
      generatedAt: '2026-03-14T00:00:00.000Z',
      baseUrl: 'https://cdn.jsdelivr.net',
      categories: {},
      skills: [
        {
          name: 'accessibility',
          description: 'Audit web accessibility',
          category: 'quality',
          path: '(quality)/accessibility',
          files: ['SKILL.md'],
          contentHash: 'abc123',
        },
      ],
    }
    getWithFallbackMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => remoteRegistry,
      text: async () => JSON.stringify(remoteRegistry),
    })

    const skills = await discoverSkillsAsync(ports)

    expect(skills).toHaveLength(1)
    expect(skills[0].name).toBe('accessibility')
  })

  it('returns empty array when remote registry is unavailable', async () => {
    const { ports, getWithFallbackMock } = createPorts()
    getWithFallbackMock.mockRejectedValue(new Error('network error'))

    const skills = await discoverSkillsAsync(ports)

    expect(skills).toEqual([])
  })
})

describe('discoverCategories', () => {
  it('returns categories from the local catalog when in local mode', () => {
    const { ports, existsSyncMock, readdirSyncMock, readFileSyncMock } = createPorts()
    existsSyncMock.mockImplementation((p) => {
      const path = p as string
      return path.endsWith('packages/skills-catalog/skills') || path.endsWith('_category.json')
    })
    readdirSyncMock.mockImplementation((p) => {
      const path = p as string
      if (path.endsWith('packages/skills-catalog/skills')) {
        return [{ name: '(quality)', isDirectory: () => true }]
      }
      return []
    })
    readFileSyncMock.mockReturnValue('{"(quality)":{"name":"Quality","description":"Quality skills"}}')

    const categories = discoverCategories(ports)

    expect(categories).toHaveLength(1)
    expect(categories[0]).toMatchObject({ id: 'quality', name: 'Quality', description: 'Quality skills' })
  })

  it('returns empty array when in remote mode', () => {
    const { ports } = createPorts()

    expect(discoverCategories(ports)).toEqual([])
  })
})

describe('discoverCategoriesAsync', () => {
  it('returns local categories in local mode', async () => {
    const { ports, existsSyncMock, readdirSyncMock } = createPorts()
    existsSyncMock.mockImplementation((p) => {
      const path = p as string
      return path.endsWith('packages/skills-catalog/skills')
    })
    readdirSyncMock.mockReturnValue([{ name: '(devops)', isDirectory: () => true }])

    const categories = await discoverCategoriesAsync(ports)

    expect(categories).toHaveLength(1)
    expect(categories[0].id).toBe('devops')
  })

  it('fetches remote categories when in remote mode', async () => {
    const { ports, getWithFallbackMock } = createPorts()
    const remoteRegistry = {
      version: 'main',
      generatedAt: '2026-03-14T00:00:00.000Z',
      baseUrl: 'https://cdn.jsdelivr.net',
      categories: {
        quality: { name: 'Quality', description: 'Quality skills' },
      },
      skills: [],
    }
    getWithFallbackMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => remoteRegistry,
      text: async () => JSON.stringify(remoteRegistry),
    })

    const categories = await discoverCategoriesAsync(ports)

    expect(categories).toHaveLength(1)
    expect(categories[0]).toMatchObject({ id: 'quality', name: 'Quality' })
  })
})
