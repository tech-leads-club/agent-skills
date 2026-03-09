import { describe, expect, it, jest } from '@jest/globals'

import type {
  CorePorts,
  EnvPort,
  FileSystemPort,
  HttpPort,
  LoggerPort,
  PackageResolverPort,
  ShellPort,
} from '../../ports'
import type { SkillLockFile } from '../../types'

import { readSkillLock, writeSkillLock } from '../lockfile.service'

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

    await writeSkillLock(lock, ports)

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

    await writeSkillLock({ version: 2, skills: {} }, ports)

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

    await expect(writeSkillLock({ version: 2, skills: {} }, ports)).rejects.toThrow('rename failed')

    expect(rmMock).toHaveBeenCalledWith('/workspace/project/.agents/.skill-lock.json.tmp', { force: true })
  })
})
