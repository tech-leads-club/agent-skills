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

import { readSkillLock } from '../lockfile.service'

type TestPorts = {
  ports: CorePorts
  cwdMock: jest.MockedFunction<() => string>
  homedirMock: jest.MockedFunction<() => string>
  existsSyncMock: jest.MockedFunction<(path: string) => boolean>
  readFileMock: jest.MockedFunction<(path: string, encoding: string) => Promise<string>>
}

const createPorts = (): TestPorts => {
  const readFileMock = jest.fn<(path: string, encoding: string) => Promise<string>>()
  const existsSyncMock = jest.fn<(path: string) => boolean>()
  const cwdMock = jest.fn(() => '/workspace/project/packages/cli')
  const homedirMock = jest.fn(() => '/home/tester')

  const fs = {
    readFile: readFileMock,
    existsSync: existsSyncMock,
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

  return { ports, cwdMock, homedirMock, existsSyncMock, readFileMock }
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
