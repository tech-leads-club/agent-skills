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

import { detectMode, getSkillsDirectory } from '../skills-provider.service'

type TestPorts = {
  ports: CorePorts
  existsSyncMock: jest.MockedFunction<(path: string) => boolean>
  readdirSyncMock: jest.MockedFunction<
    (path: string, options?: { withFileTypes?: boolean }) => { name: string; isDirectory: () => boolean }[]
  >
  readFileSyncMock: jest.MockedFunction<(path: string, encoding: string) => string>
}

const createPorts = (): TestPorts => {
  const existsSyncMock = jest.fn<(path: string) => boolean>()
  const readdirSyncMock = jest.fn<
    (path: string, options?: { withFileTypes?: boolean }) => { name: string; isDirectory: () => boolean }[]
  >()
  const readFileSyncMock = jest.fn<(path: string, encoding: string) => string>()

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
    getEnv: jest.fn(() => undefined),
  } as unknown as EnvPort

  const ports: CorePorts = {
    fs,
    http: {} as HttpPort,
    shell: {} as ShellPort,
    env,
    logger: {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    } as unknown as LoggerPort,
    packageResolver: {} as PackageResolverPort,
  }

  return { ports, existsSyncMock, readdirSyncMock, readFileSyncMock }
}

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
