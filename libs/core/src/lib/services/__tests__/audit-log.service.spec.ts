import { afterEach, describe, expect, it, jest } from '@jest/globals'

import type {
  CorePorts,
  EnvPort,
  FileSystemPort,
  HttpPort,
  LoggerPort,
  PackageResolverPort,
  ShellPort,
} from '../../ports'

import { getAuditLogPath, logAudit } from '../audit-log.service'

type TestPorts = {
  appendFileMock: jest.MockedFunction<(path: string, content: string, encoding: string) => Promise<void>>
  homedirMock: jest.MockedFunction<() => string>
  mkdirMock: jest.MockedFunction<(path: string, options?: { recursive?: boolean }) => Promise<void>>
  ports: CorePorts
}

const createPorts = (): TestPorts => {
  const appendFileMock = jest.fn<(path: string, content: string, encoding: string) => Promise<void>>()
  const homedirMock = jest.fn(() => '/home/tester')
  const mkdirMock = jest.fn<(path: string, options?: { recursive?: boolean }) => Promise<void>>()

  const fs = {
    appendFile: appendFileMock,
    mkdir: mkdirMock,
  } as unknown as FileSystemPort
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

  return { appendFileMock, homedirMock, mkdirMock, ports }
}

afterEach(() => {
  jest.useRealTimers()
})

describe('getAuditLogPath', () => {
  it('returns the audit log path inside the global config directory', () => {
    const { ports, homedirMock } = createPorts()

    const result = getAuditLogPath(ports)

    expect(result).toBe('/home/tester/.agent-skills/audit.log')
    expect(homedirMock).toHaveBeenCalledTimes(1)
  })
})

describe('logAudit', () => {
  it('creates the global config directory and appends a timestamped log entry', async () => {
    const { appendFileMock, mkdirMock, ports } = createPorts()
    appendFileMock.mockResolvedValue(undefined)
    mkdirMock.mockResolvedValue(undefined)
    jest.useFakeTimers().setSystemTime(new Date('2026-03-10T10:00:00.000Z'))

    await logAudit(
      {
        action: 'install',
        skillName: 'test-skill',
        agents: ['Cursor'],
        success: 1,
        failed: 0,
      },
      ports,
    )

    expect(mkdirMock).toHaveBeenCalledWith('/home/tester/.agent-skills', { recursive: true })
    expect(appendFileMock).toHaveBeenCalledWith(
      '/home/tester/.agent-skills/audit.log',
      '{"action":"install","skillName":"test-skill","agents":["Cursor"],"success":1,"failed":0,"timestamp":"2026-03-10T10:00:00.000Z"}\n',
      'utf-8',
    )
  })

  it('fails silently when the audit log cannot be written', async () => {
    const { appendFileMock, mkdirMock, ports } = createPorts()
    mkdirMock.mockResolvedValue(undefined)
    appendFileMock.mockRejectedValue(new Error('disk full'))

    await expect(
      logAudit(
        {
          action: 'remove',
          skillName: 'test-skill',
          agents: ['Cursor'],
          success: 0,
          failed: 1,
        },
        ports,
      ),
    ).resolves.toBeUndefined()
  })

})
