import { jest } from '@jest/globals'
import { EventEmitter } from 'node:events'

// Mock child_process
const mockChildProcess = new EventEmitter() as any
mockChildProcess.stdout = new EventEmitter()
mockChildProcess.stderr = new EventEmitter()
mockChildProcess.kill = jest.fn()
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
    mockChildProcess.stdout.removeAllListeners()
    mockChildProcess.stderr.removeAllListeners()

    // Reset child process mock state
    mockChildProcess.killed = false

    spawner = new CliSpawner(mockLoggingService as any)
  })

  it('should spawn npx with correct arguments', () => {
    spawner.spawn(['install', '-s', 'skill'], { cwd: '/cwd', operationId: 'op1' })

    expect(mockSpawn).toHaveBeenCalledWith('npx', ['tlc-skills', 'install', '-s', 'skill'], {
      cwd: '/cwd',
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
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

    mockChildProcess.stdout.emit('data', Buffer.from('line1\nline2\n'))

    expect(onOutput).toHaveBeenCalledWith('line1')
    expect(onOutput).toHaveBeenCalledWith('line2')
  })

  it('should strip ANSI codes from output', () => {
    const process = spawner.spawn(['cmd'], { cwd: '/cwd', operationId: 'op1' })
    const onOutput = jest.fn()
    process.onOutput(onOutput)

    mockChildProcess.stdout.emit('data', Buffer.from('\u001b[31mError\u001b[0m\n'))

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

    mockChildProcess.stderr.emit('data', Buffer.from('error output'))
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
