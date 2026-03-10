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

import { getAuditLogPath } from '../audit-log.service'

type TestPorts = {
  ports: CorePorts
  homedirMock: jest.MockedFunction<() => string>
}

const createPorts = (): TestPorts => {
  const homedirMock = jest.fn(() => '/home/tester')

  const fs = {} as FileSystemPort
  const env = {
    cwd: jest.fn(() => '/workspace/project'),
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

  return { ports, homedirMock }
}

describe('getAuditLogPath', () => {
  it('returns the audit log path inside the global config directory', () => {
    const { ports, homedirMock } = createPorts()

    const result = getAuditLogPath(ports)

    expect(result).toBe('/home/tester/.agent-skills/audit.log')
    expect(homedirMock).toHaveBeenCalledTimes(1)
  })
})
