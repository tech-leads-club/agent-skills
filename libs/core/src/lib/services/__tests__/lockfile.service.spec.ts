import { afterEach, describe, expect, it, jest } from '@jest/globals'

import type {
  CorePorts,
  EnvPort,
  FileSystemPort,
  HttpPort,
  LoggerPort,
  PackageResolverPort,
  PathsPort,
  ShellPort,
} from '../../ports'
import type { SkillLockEntry, SkillLockFile } from '../../types'

import {
  addSkillToLock,
  getAllLockedSkills,
  getSkillFromLock,
  readSkillLock,
  removeAgentFromLock,
  removeSkillFromLock,
  writeSkillLock,
} from '../lockfile.service'

type TestPorts = {
  ports: CorePorts
  cwdMock: jest.MockedFunction<() => string>
  homedirMock: jest.MockedFunction<() => string>
  existsSyncMock: jest.MockedFunction<(path: string) => boolean>
  mkdirMock: jest.MockedFunction<(path: string, options?: { recursive?: boolean }) => Promise<void>>
  readFileMock: jest.MockedFunction<(path: string, encoding: string) => Promise<string>>
  renameMock: jest.MockedFunction<(oldPath: string, newPath: string) => Promise<void>>
  rmMock: jest.MockedFunction<(path: string, options?: { recursive?: boolean; force?: boolean }) => Promise<void>>
  writeFileMock: jest.MockedFunction<(path: string, content: string, encoding: string) => Promise<void>>
}

const createPorts = (): TestPorts => {
  const readFileMock = jest.fn<(path: string, encoding: string) => Promise<string>>()
  const existsSyncMock = jest.fn<(path: string) => boolean>()
  const mkdirMock = jest.fn<(path: string, options?: { recursive?: boolean }) => Promise<void>>()
  const renameMock = jest.fn<(oldPath: string, newPath: string) => Promise<void>>()
  const rmMock = jest.fn<(path: string, options?: { recursive?: boolean; force?: boolean }) => Promise<void>>()
  const writeFileMock = jest.fn<(path: string, content: string, encoding: string) => Promise<void>>()
  const cwdMock = jest.fn(() => '/workspace/project/packages/cli')
  const homedirMock = jest.fn(() => '/home/tester')

  const fs = {
    mkdir: mkdirMock,
    readFile: readFileMock,
    rename: renameMock,
    rm: rmMock,
    existsSync: existsSyncMock,
    writeFile: writeFileMock,
  } as unknown as FileSystemPort

  const env = {
    cwd: cwdMock,
    homedir: homedirMock,
    platform: jest.fn(() => 'linux'),
    getEnv: jest.fn(() => undefined),
  } as unknown as EnvPort

  const ports: CorePorts = {
    fs,
    env,
    http: {} as HttpPort,
    logger: {} as LoggerPort,
    packageResolver: {} as PackageResolverPort,
    paths: {
      getWorkspaceRoot: jest.fn(() => '/workspace/project'),
      getSkillsCatalogPath: jest.fn(() => '/workspace/project/packages/skills-catalog/skills'),
      getLocalSkillsDirectory: jest.fn(() => null),
    } as unknown as PathsPort,
    shell: {} as ShellPort,
  }

  return {
    ports,
    cwdMock,
    homedirMock,
    existsSyncMock,
    mkdirMock,
    readFileMock,
    renameMock,
    rmMock,
    writeFileMock,
  }
}

afterEach(() => {
  jest.useRealTimers()
})

describe('readSkillLock', () => {
  it('reads and parses a valid lockfile', async () => {
    const { ports, existsSyncMock, readFileMock } = createPorts()
    existsSyncMock.mockImplementation((path) => path === '/workspace/project/package.json')

    const expectedLock: SkillLockFile = {
      version: 2,
      skills: {
        accessibility: {
          name: 'accessibility',
          source: 'local',
          installedAt: '2026-03-09T00:00:00.000Z',
          updatedAt: '2026-03-09T00:00:00.000Z',
          agents: ['cursor'],
          method: 'copy',
          global: false,
        },
      },
    }

    readFileMock.mockResolvedValue(JSON.stringify(expectedLock))

    const result = await readSkillLock(ports)

    expect(result).toEqual(expectedLock)
    expect(readFileMock).toHaveBeenCalledWith('/workspace/project/.agents/.skill-lock.json', 'utf-8')
  })

  it('returns an empty lockfile when the file is missing', async () => {
    const { ports, existsSyncMock, readFileMock } = createPorts()
    existsSyncMock.mockImplementation((path) => path === '/workspace/project/package.json')
    readFileMock.mockRejectedValue(new Error('missing'))

    const result = await readSkillLock(ports)

    expect(result).toEqual({ version: 2, skills: {} })
  })

  it('returns an empty lockfile when the file contains corrupted JSON', async () => {
    const { ports, existsSyncMock, readFileMock } = createPorts()
    existsSyncMock.mockImplementation((path) => path === '/workspace/project/package.json')
    readFileMock.mockResolvedValue('invalid json{{{')

    const result = await readSkillLock(ports)

    expect(result).toEqual({ version: 2, skills: {} })
  })

  it('migrates a v1 lockfile to v2 defaults', async () => {
    const { ports, existsSyncMock, readFileMock } = createPorts()
    existsSyncMock.mockImplementation((path) => path === '/workspace/project/package.json')
    readFileMock.mockResolvedValue(
      JSON.stringify({
        version: 1,
        skills: {
          'old-skill': {
            name: 'old-skill',
            source: 'local',
            installedAt: '2026-03-09T00:00:00.000Z',
            updatedAt: '2026-03-09T00:00:00.000Z',
          },
        },
      }),
    )

    const result = await readSkillLock(ports)

    expect(result.version).toBe(2)
    expect(result.skills['old-skill']).toEqual({
      name: 'old-skill',
      source: 'local',
      installedAt: '2026-03-09T00:00:00.000Z',
      updatedAt: '2026-03-09T00:00:00.000Z',
      agents: [],
      method: 'copy',
      global: false,
    })
  })
})

describe('writeSkillLock', () => {
  it('serializes the lockfile and creates the directory before an atomic rename', async () => {
    const { ports, existsSyncMock, mkdirMock, readFileMock, renameMock, writeFileMock } = createPorts()
    existsSyncMock.mockImplementation((path) => path === '/workspace/project/package.json')
    readFileMock.mockRejectedValue(new Error('missing'))
    mkdirMock.mockResolvedValue(undefined)
    writeFileMock.mockResolvedValue(undefined)
    renameMock.mockResolvedValue(undefined)

    const lock: SkillLockFile = {
      version: 2,
      skills: {
        accessibility: {
          name: 'accessibility',
          source: 'local',
          installedAt: '2026-03-09T00:00:00.000Z',
          updatedAt: '2026-03-09T00:00:00.000Z',
        },
      },
    }

    await writeSkillLock(ports, lock)

    expect(mkdirMock).toHaveBeenCalledWith('/workspace/project/.agents', { recursive: true })
    expect(writeFileMock).toHaveBeenCalledWith(
      '/workspace/project/.agents/.skill-lock.json.tmp',
      JSON.stringify(lock, null, 2),
      'utf-8',
    )
    expect(renameMock).toHaveBeenCalledWith(
      '/workspace/project/.agents/.skill-lock.json.tmp',
      '/workspace/project/.agents/.skill-lock.json',
    )
  })

  it('creates a backup before overwriting an existing lockfile', async () => {
    const { ports, existsSyncMock, mkdirMock, readFileMock, renameMock, writeFileMock } = createPorts()
    existsSyncMock.mockImplementation((path) => path === '/workspace/project/package.json')
    readFileMock.mockResolvedValue('{"version":2,"skills":{}}')
    mkdirMock.mockResolvedValue(undefined)
    writeFileMock.mockResolvedValue(undefined)
    renameMock.mockResolvedValue(undefined)

    await writeSkillLock(ports, { version: 2, skills: {} })

    expect(writeFileMock).toHaveBeenNthCalledWith(
      1,
      '/workspace/project/.agents/.skill-lock.json.backup',
      '{"version":2,"skills":{}}',
      'utf-8',
    )
  })

  it('removes the temp file and rethrows when the atomic rename fails', async () => {
    const { ports, existsSyncMock, mkdirMock, readFileMock, renameMock, rmMock, writeFileMock } = createPorts()
    existsSyncMock.mockImplementation((path) => path === '/workspace/project/package.json')
    readFileMock.mockRejectedValue(new Error('missing'))
    mkdirMock.mockResolvedValue(undefined)
    writeFileMock.mockResolvedValue(undefined)
    renameMock.mockRejectedValue(new Error('rename failed'))
    rmMock.mockResolvedValue(undefined)

    await expect(writeSkillLock(ports, { version: 2, skills: {} })).rejects.toThrow('rename failed')

    expect(rmMock).toHaveBeenCalledWith('/workspace/project/.agents/.skill-lock.json.tmp', { force: true })
  })
})

describe('addSkillToLock', () => {
  it('creates a new skill entry with the expected fields', async () => {
    const { ports, existsSyncMock, mkdirMock, readFileMock, renameMock, writeFileMock } = createPorts()
    existsSyncMock.mockImplementation((path) => path === '/workspace/project/package.json')
    readFileMock.mockRejectedValue(new Error('missing'))
    mkdirMock.mockResolvedValue(undefined)
    writeFileMock.mockResolvedValue(undefined)
    renameMock.mockResolvedValue(undefined)
    jest.useFakeTimers().setSystemTime(new Date('2026-03-09T10:00:00.000Z'))

    await addSkillToLock(ports, 'accessibility', ['cursor'], {
      source: 'registry',
      contentHash: 'abc123',
      method: 'symlink',
      version: '1.2.3',
    })

    const serializedLock = writeFileMock.mock.calls.at(-1)?.[1]
    const writtenLock = JSON.parse(serializedLock ?? '{}') as SkillLockFile

    expect(writtenLock.skills['accessibility']).toEqual({
      name: 'accessibility',
      source: 'registry',
      contentHash: 'abc123',
      installedAt: '2026-03-09T10:00:00.000Z',
      updatedAt: '2026-03-09T10:00:00.000Z',
      agents: ['cursor'],
      method: 'symlink',
      global: false,
      version: '1.2.3',
    })
  })

  it('updates an existing entry without duplicating it', async () => {
    const { ports, existsSyncMock, mkdirMock, readFileMock, renameMock, writeFileMock } = createPorts()
    existsSyncMock.mockImplementation((path) => path === '/workspace/project/package.json')
    mkdirMock.mockResolvedValue(undefined)
    writeFileMock.mockResolvedValue(undefined)
    renameMock.mockResolvedValue(undefined)

    const existingLock: SkillLockFile = {
      version: 2,
      skills: {
        accessibility: {
          name: 'accessibility',
          source: 'local',
          contentHash: 'kept-hash',
          installedAt: '2026-03-08T10:00:00.000Z',
          updatedAt: '2026-03-08T10:00:00.000Z',
          agents: ['cursor'],
          method: 'copy',
          global: false,
          version: '1.0.0',
        },
      },
    }

    readFileMock.mockResolvedValue(JSON.stringify(existingLock))
    jest.useFakeTimers().setSystemTime(new Date('2026-03-09T12:00:00.000Z'))

    await addSkillToLock(ports, 'accessibility', ['cursor', 'codex'], { source: 'local' })

    const serializedLock = writeFileMock.mock.calls.at(-1)?.[1]
    const writtenLock = JSON.parse(serializedLock ?? '{}') as SkillLockFile

    expect(Object.keys(writtenLock.skills)).toHaveLength(1)
    expect(writtenLock.skills['accessibility']).toEqual({
      name: 'accessibility',
      source: 'local',
      contentHash: 'kept-hash',
      installedAt: '2026-03-08T10:00:00.000Z',
      updatedAt: '2026-03-09T12:00:00.000Z',
      agents: ['cursor', 'codex'],
      method: 'copy',
      global: false,
    })
  })

  it('merges agents instead of overwriting when adding to existing skill', async () => {
    const { ports, existsSyncMock, mkdirMock, readFileMock, renameMock, writeFileMock } = createPorts()
    existsSyncMock.mockImplementation((path) => path === '/workspace/project/package.json')
    mkdirMock.mockResolvedValue(undefined)
    writeFileMock.mockResolvedValue(undefined)
    renameMock.mockResolvedValue(undefined)

    const existingLock: SkillLockFile = {
      version: 2,
      skills: {
        'multi-agent-skill': {
          name: 'multi-agent-skill',
          source: 'local',
          installedAt: '2026-03-14T10:00:00.000Z',
          updatedAt: '2026-03-14T10:00:00.000Z',
          agents: ['cursor'],
          method: 'copy',
          global: false,
        },
      },
    }

    readFileMock.mockResolvedValue(JSON.stringify(existingLock))
    jest.useFakeTimers().setSystemTime(new Date('2026-03-14T11:00:00.000Z'))

    await addSkillToLock(ports, 'multi-agent-skill', ['codex'], { source: 'local' })

    const serializedLock = writeFileMock.mock.calls.at(-1)?.[1]
    const writtenLock = JSON.parse(serializedLock ?? '{}') as SkillLockFile

    expect(writtenLock.skills['multi-agent-skill'].agents).toEqual(['cursor', 'codex'])
  })
})

describe('removeAgentFromLock', () => {
  it('removes only the specified agent from a multi-agent skill', async () => {
    const { ports, existsSyncMock, mkdirMock, readFileMock, renameMock, writeFileMock } = createPorts()
    existsSyncMock.mockImplementation((path) => path === '/workspace/project/package.json')
    mkdirMock.mockResolvedValue(undefined)
    writeFileMock.mockResolvedValue(undefined)
    renameMock.mockResolvedValue(undefined)

    const existingLock: SkillLockFile = {
      version: 2,
      skills: {
        'multi-agent-skill': {
          name: 'multi-agent-skill',
          source: 'local',
          installedAt: '2026-03-14T10:00:00.000Z',
          updatedAt: '2026-03-14T10:00:00.000Z',
          agents: ['cursor', 'codex'],
          method: 'copy',
          global: false,
        },
      },
    }

    readFileMock.mockResolvedValue(JSON.stringify(existingLock))
    jest.useFakeTimers().setSystemTime(new Date('2026-03-14T12:00:00.000Z'))

    const removed = await removeAgentFromLock(ports, 'multi-agent-skill', 'cursor')

    const serializedLock = writeFileMock.mock.calls.at(-1)?.[1]
    const writtenLock = JSON.parse(serializedLock ?? '{}') as SkillLockFile

    expect(removed).toBe(true)
    expect(writtenLock.skills['multi-agent-skill'].agents).toEqual(['codex'])
    expect(writtenLock.skills['multi-agent-skill'].updatedAt).toBe('2026-03-14T12:00:00.000Z')
  })

  it('deletes the entire entry when removing the last agent', async () => {
    const { ports, existsSyncMock, mkdirMock, readFileMock, renameMock, writeFileMock } = createPorts()
    existsSyncMock.mockImplementation((path) => path === '/workspace/project/package.json')
    mkdirMock.mockResolvedValue(undefined)
    writeFileMock.mockResolvedValue(undefined)
    renameMock.mockResolvedValue(undefined)

    const existingLock: SkillLockFile = {
      version: 2,
      skills: {
        'single-agent-skill': {
          name: 'single-agent-skill',
          source: 'local',
          installedAt: '2026-03-14T10:00:00.000Z',
          updatedAt: '2026-03-14T10:00:00.000Z',
          agents: ['cursor'],
          method: 'copy',
          global: false,
        },
      },
    }

    readFileMock.mockResolvedValue(JSON.stringify(existingLock))

    const removed = await removeAgentFromLock(ports, 'single-agent-skill', 'cursor')

    const serializedLock = writeFileMock.mock.calls.at(-1)?.[1]
    const writtenLock = JSON.parse(serializedLock ?? '{}') as SkillLockFile

    expect(removed).toBe(true)
    expect(writtenLock.skills).toEqual({})
  })

  it('returns false when the skill is not present', async () => {
    const { ports, existsSyncMock, readFileMock, writeFileMock } = createPorts()
    existsSyncMock.mockImplementation((path) => path === '/workspace/project/package.json')
    readFileMock.mockResolvedValue(JSON.stringify({ version: 2, skills: {} }))

    const removed = await removeAgentFromLock(ports, 'missing-skill', 'cursor')

    expect(removed).toBe(false)
    expect(writeFileMock).not.toHaveBeenCalled()
  })

  it('returns false when the agent is not in the skill entry', async () => {
    const { ports, existsSyncMock, readFileMock, writeFileMock } = createPorts()
    existsSyncMock.mockImplementation((path) => path === '/workspace/project/package.json')

    const existingLock: SkillLockFile = {
      version: 2,
      skills: {
        'some-skill': {
          name: 'some-skill',
          source: 'local',
          installedAt: '2026-03-14T10:00:00.000Z',
          updatedAt: '2026-03-14T10:00:00.000Z',
          agents: ['cursor'],
          method: 'copy',
          global: false,
        },
      },
    }

    readFileMock.mockResolvedValue(JSON.stringify(existingLock))

    const removed = await removeAgentFromLock(ports, 'some-skill', 'codex')

    expect(removed).toBe(false)
    expect(writeFileMock).not.toHaveBeenCalled()
  })
})

describe('removeSkillFromLock', () => {
  it('removes an existing skill and returns true', async () => {
    const { ports, existsSyncMock, mkdirMock, readFileMock, renameMock, writeFileMock } = createPorts()
    existsSyncMock.mockImplementation((path) => path === '/workspace/project/package.json')
    mkdirMock.mockResolvedValue(undefined)
    writeFileMock.mockResolvedValue(undefined)
    renameMock.mockResolvedValue(undefined)

    const existingLock: SkillLockFile = {
      version: 2,
      skills: {
        accessibility: {
          name: 'accessibility',
          source: 'local',
          installedAt: '2026-03-09T00:00:00.000Z',
          updatedAt: '2026-03-09T00:00:00.000Z',
        },
      },
    }

    readFileMock.mockResolvedValue(JSON.stringify(existingLock))

    const removed = await removeSkillFromLock(ports, 'accessibility')

    const serializedLock = writeFileMock.mock.calls.at(-1)?.[1]
    const writtenLock = JSON.parse(serializedLock ?? '{}') as SkillLockFile

    expect(removed).toBe(true)
    expect(writtenLock.skills).toEqual({})
  })

  it('returns false when the skill is not present', async () => {
    const { ports, existsSyncMock, readFileMock, writeFileMock } = createPorts()
    existsSyncMock.mockImplementation((path) => path === '/workspace/project/package.json')
    readFileMock.mockResolvedValue(JSON.stringify({ version: 2, skills: {} }))

    const removed = await removeSkillFromLock(ports, 'missing-skill')

    expect(removed).toBe(false)
    expect(writeFileMock).not.toHaveBeenCalled()
  })
})

describe('getSkillFromLock', () => {
  it('returns the matching skill entry', async () => {
    const { ports, existsSyncMock, readFileMock } = createPorts()
    existsSyncMock.mockImplementation((path) => path === '/workspace/project/package.json')

    const entry: SkillLockEntry = {
      name: 'accessibility',
      source: 'local',
      installedAt: '2026-03-09T00:00:00.000Z',
      updatedAt: '2026-03-09T00:00:00.000Z',
      agents: ['cursor'],
      method: 'copy',
      global: false,
    }

    readFileMock.mockResolvedValue(
      JSON.stringify({
        version: 2,
        skills: {
          accessibility: entry,
        },
      }),
    )

    const result = await getSkillFromLock(ports, 'accessibility')

    expect(result).toEqual(entry)
  })

  it('returns null when the skill is missing', async () => {
    const { ports, existsSyncMock, readFileMock } = createPorts()
    existsSyncMock.mockImplementation((path) => path === '/workspace/project/package.json')
    readFileMock.mockResolvedValue(JSON.stringify({ version: 2, skills: {} }))

    const result = await getSkillFromLock(ports, 'missing-skill')

    expect(result).toBeNull()
  })
})

describe('getAllLockedSkills', () => {
  it('returns all persisted lock entries', async () => {
    const { ports, existsSyncMock, readFileMock } = createPorts()
    existsSyncMock.mockImplementation((path) => path === '/workspace/project/package.json')

    const skills = {
      accessibility: {
        name: 'accessibility',
        source: 'local',
        installedAt: '2026-03-09T00:00:00.000Z',
        updatedAt: '2026-03-09T00:00:00.000Z',
      },
      seo: {
        name: 'seo',
        source: 'registry',
        installedAt: '2026-03-10T00:00:00.000Z',
        updatedAt: '2026-03-10T00:00:00.000Z',
      },
    }

    readFileMock.mockResolvedValue(JSON.stringify({ version: 2, skills }))

    const result = await getAllLockedSkills(ports)

    expect(result).toEqual(skills)
  })

  it('returns an empty record when no skills are stored', async () => {
    const { ports, existsSyncMock, readFileMock } = createPorts()
    existsSyncMock.mockImplementation((path) => path === '/workspace/project/package.json')
    readFileMock.mockResolvedValue(JSON.stringify({ version: 2, skills: {} }))

    const result = await getAllLockedSkills(ports)

    expect(result).toEqual({})
  })
})
