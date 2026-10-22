import { fixturePath } from './path-fixtures'

import { describe, expect, it, jest } from '@jest/globals'

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

import { findProjectRoot } from '../project-root.service'

type TestPorts = {
  ports: CorePorts
  cwdMock: jest.MockedFunction<() => string>
  existsSyncMock: jest.MockedFunction<(path: string) => boolean>
}

const createPorts = (): TestPorts => {
  const existsSyncMock = jest.fn<(path: string) => boolean>()
  const cwdMock = jest.fn(() => fixturePath('/home/user/project/subdir'))

  const fs = { existsSync: existsSyncMock } as unknown as FileSystemPort
  const env = {
    cwd: cwdMock,
    homedir: jest.fn(() => fixturePath('/home/user')),
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
      getWorkspaceRoot: jest.fn(() => fixturePath('/home/user/project')),
      getSkillsCatalogPath: jest.fn(() => fixturePath('/home/user/project/packages/skills-catalog/skills')),
      getLocalSkillsDirectory: jest.fn(() => null),
    } as unknown as PathsPort,
    shell: {} as ShellPort,
  }

  return { ports, cwdMock, existsSyncMock }
}

describe('findProjectRoot', () => {
  it('returns the nearest directory containing a project marker', () => {
    const { ports, existsSyncMock } = createPorts()
    existsSyncMock.mockImplementation((path) => path === fixturePath('/home/user/project/package.json'))

    const result = findProjectRoot(ports, fixturePath('/home/user/project/subdir'))

    expect(result).toBe(fixturePath('/home/user/project'))
  })

  it('returns the provided startDir when no project marker is found', () => {
    const { ports, existsSyncMock } = createPorts()
    existsSyncMock.mockReturnValue(false)

    const startDir = fixturePath('/home/user/isolated')
    const result = findProjectRoot(ports, startDir)

    expect(result).toBe(startDir)
  })

  it('skips packages/cli directories and continues searching upwards', () => {
    const { ports, existsSyncMock } = createPorts()
    const hasMarker = (path: string) =>
      path === fixturePath('/home/user/project/packages/cli/package.json') ||
      path === fixturePath('/home/user/project/packages/cli/.git') ||
      path === fixturePath('/home/user/project/package.json') ||
      path === fixturePath('/home/user/project/.git')
    existsSyncMock.mockImplementation((path) => hasMarker(path))

    const result = findProjectRoot(ports, fixturePath('/home/user/project/packages/cli/src'))

    expect(result).toBe(fixturePath('/home/user/project'))
  })
})
