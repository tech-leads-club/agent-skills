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

import { getAuditLogPath, logAudit, readAuditLog } from '../audit-log.service'

type TestPorts = {
  appendFileMock: jest.MockedFunction<(path: string, content: string, encoding: string) => Promise<void>>
  homedirMock: jest.MockedFunction<() => string>
  mkdirMock: jest.MockedFunction<(path: string, options?: { recursive?: boolean }) => Promise<void>>
  ports: CorePorts
  readFileMock: jest.MockedFunction<(path: string, encoding: string) => Promise<string>>
}

const createPorts = (): TestPorts => {
  const appendFileMock = jest.fn<(path: string, content: string, encoding: string) => Promise<void>>()
  const homedirMock = jest.fn(() => '/home/tester')
  const mkdirMock = jest.fn<(path: string, options?: { recursive?: boolean }) => Promise<void>>()
  const readFileMock = jest.fn<(path: string, encoding: string) => Promise<string>>()

  const fs = {
    appendFile: appendFileMock,
    mkdir: mkdirMock,
    readFile: readFileMock,
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

  return { appendFileMock, homedirMock, mkdirMock, ports, readFileMock }
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

  it('uses the provided baseDir when available', () => {
    const { ports, homedirMock } = createPorts()

    const result = getAuditLogPath(ports, '/tmp/custom-home')

    expect(result).toBe('/tmp/custom-home/.agent-skills/audit.log')
    expect(homedirMock).not.toHaveBeenCalled()
  })
})

describe('logAudit', () => {
  it('creates the global config directory and appends a timestamped log entry', async () => {
    const { appendFileMock, mkdirMock, ports } = createPorts()
    appendFileMock.mockResolvedValue(undefined)
    mkdirMock.mockResolvedValue(undefined)
    jest.useFakeTimers().setSystemTime(new Date('2026-03-10T10:00:00.000Z'))

    await logAudit(ports, {
      action: 'install',
      skillName: 'test-skill',
      agents: ['Cursor'],
      success: 1,
      failed: 0,
    })

    expect(mkdirMock).toHaveBeenCalledWith('/home/tester/.agent-skills', { recursive: true })
    expect(appendFileMock).toHaveBeenCalledWith(
      '/home/tester/.agent-skills/audit.log',
      '{"action":"install","skillName":"test-skill","agents":["Cursor"],"success":1,"failed":0,"timestamp":"2026-03-10T10:00:00.000Z"}\n',
      'utf-8',
    )
  })

  it('uses the provided baseDir when available', async () => {
    const { appendFileMock, homedirMock, mkdirMock, ports } = createPorts()
    appendFileMock.mockResolvedValue(undefined)
    mkdirMock.mockResolvedValue(undefined)
    jest.useFakeTimers().setSystemTime(new Date('2026-03-10T10:00:00.000Z'))

    await logAudit(
      ports,
      {
        action: 'install',
        skillName: 'test-skill',
        agents: ['Cursor'],
        success: 1,
        failed: 0,
      },
      '/tmp/custom-home',
    )

    expect(mkdirMock).toHaveBeenCalledWith('/tmp/custom-home/.agent-skills', { recursive: true })
    expect(appendFileMock).toHaveBeenCalledWith(
      '/tmp/custom-home/.agent-skills/audit.log',
      '{"action":"install","skillName":"test-skill","agents":["Cursor"],"success":1,"failed":0,"timestamp":"2026-03-10T10:00:00.000Z"}\n',
      'utf-8',
    )
    expect(homedirMock).not.toHaveBeenCalled()
  })

  it('fails silently when the audit log cannot be written', async () => {
    const { appendFileMock, mkdirMock, ports } = createPorts()
    mkdirMock.mockResolvedValue(undefined)
    appendFileMock.mockRejectedValue(new Error('disk full'))

    await expect(
      logAudit(ports, {
        action: 'remove',
        skillName: 'test-skill',
        agents: ['Cursor'],
        success: 0,
        failed: 1,
      }),
    ).resolves.toBeUndefined()
  })
})

describe('readAuditLog', () => {
  it('returns an empty array when the audit log file is missing', async () => {
    const { ports, readFileMock } = createPorts()
    readFileMock.mockRejectedValue(new Error('missing'))

    await expect(readAuditLog(ports)).resolves.toEqual([])
  })

  it('returns parsed entries ordered from newest to oldest', async () => {
    const { ports, readFileMock } = createPorts()
    readFileMock.mockResolvedValue(
      [
        JSON.stringify({
          action: 'install',
          skillName: 'skill-1',
          agents: ['Cursor'],
          success: 1,
          failed: 0,
          timestamp: '2026-03-10T10:00:00.000Z',
        }),
        JSON.stringify({
          action: 'remove',
          skillName: 'skill-2',
          agents: ['Claude Code'],
          success: 1,
          failed: 0,
          timestamp: '2026-03-10T11:00:00.000Z',
        }),
      ].join('\n'),
    )

    await expect(readAuditLog(ports)).resolves.toEqual([
      {
        action: 'remove',
        skillName: 'skill-2',
        agents: ['Claude Code'],
        success: 1,
        failed: 0,
        timestamp: '2026-03-10T11:00:00.000Z',
      },
      {
        action: 'install',
        skillName: 'skill-1',
        agents: ['Cursor'],
        success: 1,
        failed: 0,
        timestamp: '2026-03-10T10:00:00.000Z',
      },
    ])
  })

  it('uses the provided baseDir when available', async () => {
    const { homedirMock, ports, readFileMock } = createPorts()
    readFileMock.mockResolvedValue(
      JSON.stringify({
        action: 'install',
        skillName: 'skill-1',
        agents: ['Cursor'],
        success: 1,
        failed: 0,
        timestamp: '2026-03-10T10:00:00.000Z',
      }),
    )

    await expect(readAuditLog(ports, undefined, '/tmp/custom-home')).resolves.toEqual([
      {
        action: 'install',
        skillName: 'skill-1',
        agents: ['Cursor'],
        success: 1,
        failed: 0,
        timestamp: '2026-03-10T10:00:00.000Z',
      },
    ])

    expect(readFileMock).toHaveBeenCalledWith('/tmp/custom-home/.agent-skills/audit.log', 'utf-8')
    expect(homedirMock).not.toHaveBeenCalled()
  })

  it('skips invalid and empty lines while respecting the limit', async () => {
    const { ports, readFileMock } = createPorts()
    readFileMock.mockResolvedValue(
      [
        JSON.stringify({
          action: 'install',
          skillName: 'skill-1',
          agents: ['Cursor'],
          success: 1,
          failed: 0,
          timestamp: '2026-03-10T10:00:00.000Z',
        }),
        '',
        'invalid json line',
        JSON.stringify({
          action: 'update',
          skillName: 'skill-2',
          agents: ['Cursor'],
          success: 1,
          failed: 0,
          timestamp: '2026-03-10T11:00:00.000Z',
        }),
        '',
        JSON.stringify({
          action: 'remove',
          skillName: 'skill-3',
          agents: ['Claude Code'],
          success: 1,
          failed: 0,
          timestamp: '2026-03-10T12:00:00.000Z',
        }),
      ].join('\n'),
    )

    await expect(readAuditLog(ports, 2)).resolves.toEqual([
      {
        action: 'remove',
        skillName: 'skill-3',
        agents: ['Claude Code'],
        success: 1,
        failed: 0,
        timestamp: '2026-03-10T12:00:00.000Z',
      },
      {
        action: 'update',
        skillName: 'skill-2',
        agents: ['Cursor'],
        success: 1,
        failed: 0,
        timestamp: '2026-03-10T11:00:00.000Z',
      },
    ])
  })

  it('returns an empty array when limit is 0', async () => {
    const { ports, readFileMock } = createPorts()
    readFileMock.mockResolvedValue(
      JSON.stringify({
        action: 'install',
        skillName: 'skill-1',
        agents: ['Cursor'],
        success: 1,
        failed: 0,
        timestamp: '2026-03-10T10:00:00.000Z',
      }),
    )

    await expect(readAuditLog(ports, 0)).resolves.toEqual([])
  })

  it('returns an empty array when limit is negative', async () => {
    const { ports, readFileMock } = createPorts()
    readFileMock.mockResolvedValue(
      JSON.stringify({
        action: 'install',
        skillName: 'skill-1',
        agents: ['Cursor'],
        success: 1,
        failed: 0,
        timestamp: '2026-03-10T10:00:00.000Z',
      }),
    )

    await expect(readAuditLog(ports, -5)).resolves.toEqual([])
  })
})
