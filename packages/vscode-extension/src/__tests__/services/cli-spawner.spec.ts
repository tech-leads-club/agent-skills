import { jest } from '@jest/globals'
import type { ChildProcess } from 'node:child_process'
import { EventEmitter } from 'node:events'
import type { LoggingService } from '../../services/logging-service'

// Mock child_process
const mockChildProcess = new EventEmitter() as EventEmitter &
  Partial<ChildProcess> & {
    stdout: ChildProcess['stdout']
    stderr: ChildProcess['stderr']
    kill: jest.Mock<(signal?: NodeJS.Signals) => boolean>
    killed: boolean
  }
mockChildProcess.stdout = new EventEmitter() as unknown as ChildProcess['stdout']
mockChildProcess.stderr = new EventEmitter() as unknown as ChildProcess['stderr']
mockChildProcess.kill = jest.fn<(signal?: NodeJS.Signals) => boolean>().mockReturnValue(true)
// Mock killed property
Object.defineProperty(mockChildProcess, 'killed', {
  value: false,
  writable: true,
})

const mockSpawn = jest.fn().mockReturnValue(mockChildProcess)

jest.unstable_mockModule('node:child_process', () => ({
  spawn: mockSpawn,
}))

// Mock logging service
const mockLoggingService = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

jest.unstable_mockModule('../../services/logging-service', () => ({
  LoggingService: jest.fn(() => mockLoggingService),
}))

const { CliSpawner } = await import('../../services/cli-spawner')

describe('CliSpawner', () => {
  let spawner: InstanceType<typeof CliSpawner>

  beforeEach(() => {
    jest.clearAllMocks()
    mockChildProcess.removeAllListeners()
    mockChildProcess.stdout!.removeAllListeners()
    mockChildProcess.stderr!.removeAllListeners()

    // Reset child process mock state
    mockChildProcess.killed = false

    spawner = new CliSpawner(mockLoggingService as unknown as LoggingService)
  })

  it('should spawn npx with correct arguments', () => {
    spawner.spawn(['install', '-s', 'skill'], { cwd: '/cwd', operationId: 'op1' })

    expect(mockSpawn).toHaveBeenCalledWith('npx', ['agent-skills', 'install', '-s', 'skill'], {
      cwd: '/cwd',
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })
  })

  it('should validate skill name to prevent injection', () => {
    expect(() => {
      spawner.spawn(['install', '-s', 'bad; rm -rf /'], { cwd: '/cwd', operationId: 'op1' })
    }).toThrow(/Invalid skill name/)
  })

  it('should stream stdout line by line', async () => {
    const process = spawner.spawn(['cmd'], { cwd: '/cwd', operationId: 'op1' })
    const onOutput = jest.fn()
    process.onOutput(onOutput)

    mockChildProcess.stdout!.emit('data', Buffer.from('line1\nline2\n'))

    expect(onOutput).toHaveBeenCalledWith('line1')
    expect(onOutput).toHaveBeenCalledWith('line2')
  })

  it('should strip ANSI codes from output', () => {
    const process = spawner.spawn(['cmd'], { cwd: '/cwd', operationId: 'op1' })
    const onOutput = jest.fn()
    process.onOutput(onOutput)

    mockChildProcess.stdout!.emit('data', Buffer.from('\u001b[31mError\u001b[0m\n'))

    expect(onOutput).toHaveBeenCalledWith('Error')
  })

  it('should resolve on process completion', async () => {
    const process = spawner.spawn(['cmd'], { cwd: '/cwd', operationId: 'op1' })
    const promise = process.onComplete()

    mockChildProcess.emit('close', 0, null)

    const result = await promise
    expect(result).toEqual({ exitCode: 0, signal: null, stderr: '' })
  })

  it('should capture stderr', async () => {
    const process = spawner.spawn(['cmd'], { cwd: '/cwd', operationId: 'op1' })
    const promise = process.onComplete()

    mockChildProcess.stderr!.emit('data', Buffer.from('error output'))
    mockChildProcess.emit('close', 1, null)

    const result = await promise
    expect(result.stderr).toBe('error output')
  })

  it('should kill the process', () => {
    const process = spawner.spawn(['cmd'], { cwd: '/cwd', operationId: 'op1' })
    process.kill()

    expect(mockChildProcess.kill).toHaveBeenCalledWith('SIGTERM')
  })
})
