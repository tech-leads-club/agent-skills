import { describe, expect, it, jest } from '@jest/globals'

import { join } from 'node:path'

import type {
  CorePorts,
  EnvPort,
  FileSystemPort,
  HttpPort,
  LoggerPort,
  PackageResolverPort,
  ShellPort,
} from '../../ports'

import { PACKAGE_NAME } from '../../constants'
import { getNpmGlobalRoot, isGloballyInstalled } from '../global-path.service'

type TestPorts = {
  ports: CorePorts
  existsSyncMock: jest.MockedFunction<(path: string) => boolean>
  execMock: jest.MockedFunction<(command: string, options?: { encoding?: string }) => string>
}

const createPorts = (): TestPorts => {
  const existsSyncMock = jest.fn<(path: string) => boolean>()
  const execMock = jest.fn<(command: string, options?: { encoding?: string }) => string>()

  const fs = { existsSync: existsSyncMock } as unknown as FileSystemPort
  const shell = { exec: execMock } as unknown as ShellPort
  const env = {
    cwd: jest.fn(() => '/home/user'),
    homedir: jest.fn(() => '/home/user'),
    platform: jest.fn(() => 'linux'),
    getEnv: jest.fn(() => undefined),
  } as unknown as EnvPort

  const ports: CorePorts = {
    fs,
    http: {} as HttpPort,
    shell,
    env,
    logger: {} as LoggerPort,
    packageResolver: {} as PackageResolverPort,
  }

  return { ports, existsSyncMock, execMock }
}

describe('global path service', () => {
  it('returns the npm global root when npm is available', () => {
    const { ports, execMock } = createPorts()
    execMock.mockReturnValue('/usr/lib/node_modules\n')

    const result = getNpmGlobalRoot(ports)

    expect(result).toBe('/usr/lib/node_modules')
    expect(execMock).toHaveBeenCalledWith('npm root -g', { encoding: 'utf-8' })
  })

  it('returns null when npm cannot be executed', () => {
    const { ports, execMock } = createPorts()
    execMock.mockImplementation(() => {
      throw new Error('npm missing')
    })

    const result = getNpmGlobalRoot(ports)

    expect(result).toBeNull()
  })

  it('returns true when the CLI package exists under the npm global root', () => {
    const { ports, execMock, existsSyncMock } = createPorts()
    execMock.mockReturnValue('/usr/lib/node_modules')
    existsSyncMock.mockReturnValue(true)

    const result = isGloballyInstalled(ports)

    expect(result).toBe(true)
    expect(existsSyncMock).toHaveBeenCalledWith(join('/usr/lib/node_modules', PACKAGE_NAME))
  })

  it('returns false when the CLI package is not installed globally', () => {
    const { ports, execMock, existsSyncMock } = createPorts()
    execMock.mockReturnValue('/usr/lib/node_modules')
    existsSyncMock.mockReturnValue(false)

    const result = isGloballyInstalled(ports)

    expect(result).toBe(false)
  })

  it('returns false when npm global root cannot be determined', () => {
    const { ports, execMock } = createPorts()
    execMock.mockImplementation(() => {
      throw new Error('npm missing')
    })

    const result = isGloballyInstalled(ports)

    expect(result).toBe(false)
  })
})
