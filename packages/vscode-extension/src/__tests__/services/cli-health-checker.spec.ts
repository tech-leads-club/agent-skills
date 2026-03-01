import { jest } from '@jest/globals'
import type { CliProcess, CliResult, CliSpawner, SpawnOptions } from '../../services/cli-spawner'
import type { LoggingService } from '../../services/logging-service'

// Mock dependencies
const mockCliProcess = {
  onOutput: jest.fn<(handler: (line: string) => void) => void>(),
  onComplete: jest.fn<() => Promise<CliResult>>(),
  kill: jest.fn(),
  operationId: 'health-check',
} satisfies CliProcess

const mockCliSpawner = {
  spawn: jest.fn<(args: string[], options: SpawnOptions) => CliProcess>().mockReturnValue(mockCliProcess),
  dispose: jest.fn(),
}

const mockLoggingService = {
  debug: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  dispose: jest.fn(),
}

// Setup ESM mocks
jest.unstable_mockModule('../../services/cli-spawner', () => ({
  CliSpawner: jest.fn(() => mockCliSpawner),
}))

jest.unstable_mockModule('../../services/logging-service', () => ({
  LoggingService: jest.fn(() => mockLoggingService),
}))

// Import SUT
const { CliHealthChecker } = await import('../../services/cli-health-checker')

// Helper type for mocked async function
type MockAsyncFn<T> = jest.Mock<() => Promise<T>>

describe('CliHealthChecker', () => {
  let checker: InstanceType<typeof CliHealthChecker>

  beforeEach(() => {
    jest.clearAllMocks()
    checker = new CliHealthChecker(mockCliSpawner as unknown as CliSpawner, mockLoggingService as unknown as LoggingService)
  })

  it('should return ok status when version is compatible', async () => {
    mockCliProcess.onOutput.mockImplementation((cb: (line: string) => void) => {
      cb('1.5.0')
    })
    ;(mockCliProcess.onComplete as MockAsyncFn<CliResult>).mockResolvedValue({ exitCode: 0, stderr: '', signal: null })

    const result = await checker.check()

    expect(result).toEqual({ status: 'ok', version: '1.5.0' })
    expect(mockCliSpawner.spawn).toHaveBeenCalledWith(['--version'], expect.anything())
  })

  it('should return outdated status when version is below minimum', async () => {
    mockCliProcess.onOutput.mockImplementation((cb: (line: string) => void) => {
      cb('0.9.0')
    })
    ;(mockCliProcess.onComplete as MockAsyncFn<CliResult>).mockResolvedValue({ exitCode: 0, stderr: '', signal: null })

    const result = await checker.check()

    expect(result.status).toBe('outdated')
    if (result.status === 'outdated') {
      expect(result.version).toBe('0.9.0')
      expect(result.minVersion).toBeDefined()
    }
  })

  it('should return cli-missing status when exit code is non-zero', async () => {
    ;(mockCliProcess.onComplete as MockAsyncFn<CliResult>).mockResolvedValue({
      exitCode: 1,
      stderr: 'Error: MODULE_NOT_FOUND',
      signal: null,
    })

    const result = await checker.check()

    expect(result.status).toBe('cli-missing')
  })

  it('should return npx-missing status when stderr contains ENOENT and npx', async () => {
    ;(mockCliProcess.onComplete as MockAsyncFn<CliResult>).mockResolvedValue({
      exitCode: 1,
      stderr: "'npx' is not recognized... ENOENT",
      signal: null,
    })

    const result = await checker.check()

    expect(result.status).toBe('npx-missing')
  })

  it('should cache the result', async () => {
    mockCliProcess.onOutput.mockImplementation((cb: (line: string) => void) => cb('1.0.0'))
    ;(mockCliProcess.onComplete as MockAsyncFn<CliResult>).mockResolvedValue({ exitCode: 0, stderr: '', signal: null })

    await checker.check()
    const cached = checker.getStatus()

    expect(cached).toEqual({ status: 'ok', version: '1.0.0' })
  })

  it('should kill active process on dispose', () => {
    // Start a check but don't resolve it immediately (simulate in-flight)
    ;(mockCliProcess.onComplete as MockAsyncFn<CliResult>).mockReturnValue(new Promise(() => {}))

    void checker.check()
    checker.dispose()

    expect(mockCliProcess.kill).toHaveBeenCalled()
  })
})
