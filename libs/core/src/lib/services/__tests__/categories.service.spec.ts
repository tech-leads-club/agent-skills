import { describe, expect, it, jest } from '@jest/globals'

import { DEFAULT_CATEGORY } from '../../constants'
import type {
  CorePorts,
  EnvPort,
  FileSystemPort,
  HttpPort,
  LoggerPort,
  PackageResolverPort,
  ShellPort,
} from '../../ports'
import type { CategoryMetadata } from '../../types'

import {
  categoryIdToFolderName,
  extractCategoryId,
  getCategories,
  getCategoryById,
  getSkillCategory,
  getSkillCategoryId,
  groupSkillsByCategory,
  isCategoryFolder,
  loadCategoryMetadata,
} from '../categories.service'

type DirEntry = { name: string; isDirectory(): boolean }

type TestPorts = {
  ports: CorePorts
  existsSyncMock: jest.MockedFunction<(path: string) => boolean>
  readFileSyncMock: jest.MockedFunction<(path: string, encoding: string) => string>
  readdirSyncMock: jest.MockedFunction<(path: string, options?: { withFileTypes: true }) => DirEntry[]>
}

const createDirEntry = (name: string, isDirectory = true): DirEntry => ({
  name,
  isDirectory: () => isDirectory,
})

const createPorts = (): TestPorts => {
  const existsSyncMock = jest.fn<(path: string) => boolean>()
  const readFileSyncMock = jest.fn<(path: string, encoding: string) => string>()
  const readdirSyncMock = jest.fn<(path: string, options?: { withFileTypes: true }) => DirEntry[]>()

  existsSyncMock.mockReturnValue(false)
  readdirSyncMock.mockReturnValue([])

  const fs = {
    existsSync: existsSyncMock,
    readFileSync: readFileSyncMock,
    readdirSync: readdirSyncMock,
  } as unknown as FileSystemPort

  const env = {
    cwd: jest.fn(() => '/workspace/project/packages/cli'),
    homedir: jest.fn(() => '/home/tester'),
    platform: jest.fn(() => 'linux'),
    getEnv: jest.fn(() => undefined),
  } as unknown as EnvPort

  const ports: CorePorts = {
    fs,
    env,
    http: {} as HttpPort,
    logger: {} as LoggerPort,
    packageResolver: {} as PackageResolverPort,
    shell: {} as ShellPort,
  }

  return { ports, existsSyncMock, readFileSyncMock, readdirSyncMock }
}

describe('category helpers', () => {
  it('extracts ids from category folders', () => {
    expect(extractCategoryId('(security)')).toBe('security')
    expect(extractCategoryId('security')).toBeNull()
  })

  it('detects valid category folders', () => {
    expect(isCategoryFolder('(security)')).toBe(true)
    expect(isCategoryFolder('security')).toBe(false)
  })

  it('converts category ids to folder names', () => {
    expect(categoryIdToFolderName('security')).toBe('(security)')
  })
})

describe('loadCategoryMetadata', () => {
  it('returns parsed category metadata when the file exists', () => {
    const { ports, existsSyncMock, readFileSyncMock } = createPorts()
    const metadata: CategoryMetadata = {
      '(quality)': { name: 'Quality', description: 'Quality skills', priority: 1 },
    }

    existsSyncMock.mockImplementation(
      (path) =>
        path === '/workspace/project/package.json' ||
        path === '/workspace/project/packages/skills-catalog/skills/_category.json',
    )
    readFileSyncMock.mockReturnValue(JSON.stringify(metadata))

    expect(loadCategoryMetadata(ports)).toEqual(metadata)
  })

  it('returns an empty object when metadata is missing or invalid', () => {
    const { ports, existsSyncMock, readFileSyncMock } = createPorts()
    existsSyncMock.mockImplementation((path) => path === '/workspace/project/package.json')
    readFileSyncMock.mockImplementation(() => {
      throw new Error('invalid json')
    })

    expect(loadCategoryMetadata(ports)).toEqual({})
  })
})

describe('getCategories', () => {
  it('returns sorted categories from filesystem directories and metadata', () => {
    const { ports, existsSyncMock, readFileSyncMock, readdirSyncMock } = createPorts()
    existsSyncMock.mockImplementation(
      (path) =>
        path === '/workspace/project/package.json' ||
        path === '/workspace/project/packages/skills-catalog/skills' ||
        path === '/workspace/project/packages/skills-catalog/skills/_category.json',
    )
    readFileSyncMock.mockReturnValue(
      JSON.stringify({
        '(testing)': { name: 'Testing', description: 'Testing skills', priority: 5 },
      }),
    )
    readdirSyncMock.mockReturnValue([
      createDirEntry('(testing)'),
      createDirEntry('(quality)'),
      createDirEntry('not-a-category'),
    ])

    expect(getCategories(ports)).toEqual([
      {
        id: 'quality',
        name: 'Quality',
        description: undefined,
        priority: 1,
      },
      {
        id: 'testing',
        name: 'Testing',
        description: 'Testing skills',
        priority: 5,
      },
    ])
  })

  it('returns an empty array when the skills catalog is missing', () => {
    const { ports, existsSyncMock } = createPorts()
    existsSyncMock.mockImplementation((path) => path === '/workspace/project/package.json')

    expect(getCategories(ports)).toEqual([])
  })
})

describe('getCategoryById', () => {
  it('returns the matching category and undefined when missing', () => {
    const { ports, existsSyncMock, readdirSyncMock } = createPorts()
    existsSyncMock.mockImplementation(
      (path) =>
        path === '/workspace/project/package.json' || path === '/workspace/project/packages/skills-catalog/skills',
    )
    readdirSyncMock.mockReturnValue([createDirEntry('(quality)')])

    expect(getCategoryById(ports, 'quality')).toEqual({
      id: 'quality',
      name: 'Quality',
      description: undefined,
      priority: 0,
    })
    expect(getCategoryById(ports, 'missing')).toBeUndefined()
  })
})

describe('groupSkillsByCategory', () => {
  it('groups skills by existing local categories and sorts categories and skills', () => {
    const { ports, existsSyncMock, readdirSyncMock } = createPorts()
    existsSyncMock.mockImplementation(
      (path) =>
        path === '/workspace/project/package.json' || path === '/workspace/project/packages/skills-catalog/skills',
    )
    readdirSyncMock.mockReturnValue([createDirEntry('(quality)'), createDirEntry('(testing)')])

    const grouped = groupSkillsByCategory(ports, [
      { name: 'zebra', category: 'quality' },
      { name: 'alpha', category: 'quality' },
      { name: 'beta', category: 'testing' },
    ])

    expect(Array.from(grouped.entries())).toEqual([
      [
        { id: 'quality', name: 'Quality', description: undefined, priority: 0 },
        [
          { name: 'alpha', category: 'quality' },
          { name: 'zebra', category: 'quality' },
        ],
      ],
      [
        { id: 'testing', name: 'Testing', description: undefined, priority: 1 },
        [{ name: 'beta', category: 'testing' }],
      ],
    ])
  })

  it('builds categories from skill data and keeps unknown categories and defaults', () => {
    const { ports, existsSyncMock } = createPorts()
    existsSyncMock.mockImplementation((path) => path === '/workspace/project/package.json')

    const grouped = groupSkillsByCategory(ports, [
      { name: 'gamma', category: 'security' },
      { name: 'delta' },
      { name: 'alpha', category: 'security' },
    ])

    expect(Array.from(grouped.entries())).toEqual([
      [
        { id: 'security', name: 'Security', priority: 0 },
        [
          { name: 'alpha', category: 'security' },
          { name: 'gamma', category: 'security' },
        ],
      ],
      [DEFAULT_CATEGORY, [{ name: 'delta' }]],
    ])
  })
})

describe('getSkillCategoryId', () => {
  it('returns the category id for a skill found in a category folder', () => {
    const { ports, existsSyncMock, readdirSyncMock } = createPorts()
    existsSyncMock.mockImplementation(
      (path) =>
        path === '/workspace/project/package.json' ||
        path === '/workspace/project/packages/skills-catalog/skills' ||
        path === '/workspace/project/packages/skills-catalog/skills/(quality)/accessibility/SKILL.md',
    )
    readdirSyncMock.mockReturnValue([createDirEntry('(quality)')])

    expect(getSkillCategoryId(ports, 'accessibility')).toBe('quality')
  })

  it('falls back to the default category when the skill is not found', () => {
    const { ports, existsSyncMock, readdirSyncMock } = createPorts()
    existsSyncMock.mockImplementation(
      (path) =>
        path === '/workspace/project/package.json' || path === '/workspace/project/packages/skills-catalog/skills',
    )
    readdirSyncMock.mockReturnValue([createDirEntry('(quality)')])

    expect(getSkillCategoryId(ports, 'missing-skill')).toBe('uncategorized')
  })
})

describe('getSkillCategory', () => {
  it('returns the matching category or the default category', () => {
    const { ports, existsSyncMock, readdirSyncMock } = createPorts()
    existsSyncMock.mockImplementation(
      (path) =>
        path === '/workspace/project/package.json' ||
        path === '/workspace/project/packages/skills-catalog/skills' ||
        path === '/workspace/project/packages/skills-catalog/skills/(quality)/accessibility/SKILL.md',
    )
    readdirSyncMock.mockReturnValue([createDirEntry('(quality)')])

    expect(getSkillCategory(ports, 'accessibility')).toEqual({
      id: 'quality',
      name: 'Quality',
      description: undefined,
      priority: 0,
    })
    expect(getSkillCategory(ports, 'missing-skill')).toEqual(DEFAULT_CATEGORY)
  })
})
