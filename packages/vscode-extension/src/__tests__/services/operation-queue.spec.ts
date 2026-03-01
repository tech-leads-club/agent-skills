import { jest } from '@jest/globals'
import type { CliProcess, CliResult, CliSpawner, SpawnOptions } from '../../services/cli-spawner'
import type { QueuedJob } from '../../services/operation-queue'
import type { OperationBatchMetadata } from '../../shared/types'

// Mock dependencies
const mockCliProcess = {
  onOutput: jest.fn<(handler: (line: string) => void) => void>(),
  onComplete: jest.fn<() => Promise<CliResult>>(),
  kill: jest.fn(),
  operationId: 'queue-op',
} satisfies CliProcess

const mockCliSpawner = {
  spawn: jest.fn<(args: string[], options: SpawnOptions) => CliProcess>().mockReturnValue(mockCliProcess),
  dispose: jest.fn(),
}

jest.unstable_mockModule('../../services/cli-spawner', () => ({
  CliSpawner: jest.fn(() => mockCliSpawner),
}))

jest.unstable_mockModule('../../services/error-classifier', () => ({
  classifyError: jest.fn((stderr: string, code: number | null, signal: NodeJS.Signals | null) => ({
    category: (() => {
      if (signal === 'SIGTERM') {
        return 'cancelled'
      }

      if (code === 0) {
        return undefined
      }

      if (stderr.includes('EPERM')) {
        return 'file-locked'
      }

      return 'cli-error'
    })(),
    retryable: stderr.includes('EPERM'),
    message: stderr || 'Error',
  })),
}))

// Import SUT
const { OperationQueue } = await import('../../services/operation-queue')

// Helper type
type MockAsyncFn<T> = jest.Mock<() => Promise<T>>

describe('OperationQueue', () => {
  let queue: InstanceType<typeof OperationQueue>

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    queue = new OperationQueue(mockCliSpawner as unknown as CliSpawner)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should execute a job successfully', async () => {
    ;(mockCliProcess.onComplete as MockAsyncFn<CliResult>).mockResolvedValue({ exitCode: 0, stderr: '', signal: null })
    const onCompleted = jest.fn()
    queue.onJobCompleted(onCompleted)

    const job: QueuedJob = { operationId: '1', operation: 'install', skillName: 'skill', args: [], cwd: '/' }
    queue.enqueue(job)

    await jest.runAllTimersAsync()

    expect(mockCliSpawner.spawn).toHaveBeenCalledTimes(1)
    expect(onCompleted).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }))
  })

  it('should retry on retryable error', async () => {
    // First attempt fails with EPERM (retryable)
    ;(mockCliProcess.onComplete as MockAsyncFn<CliResult>)
      .mockResolvedValueOnce({ exitCode: 1, stderr: 'EPERM', signal: null })
      // Second attempt succeeds
      .mockResolvedValueOnce({ exitCode: 0, stderr: '', signal: null })

    const onProgress = jest.fn()
    queue.onJobProgress(onProgress)
    const onCompleted = jest.fn()
    queue.onJobCompleted(onCompleted)

    queue.enqueue({ operationId: '1', operation: 'install', skillName: 'skill', args: [], cwd: '/' })

    // Allow retry logic to proceed
    await jest.runAllTimersAsync()

    expect(mockCliSpawner.spawn).toHaveBeenCalledTimes(2)
    expect(onProgress).toHaveBeenCalled() // Retrying message
    expect(onCompleted).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }))
  })

  it('should fail after exhausting retries', async () => {
    ;(mockCliProcess.onComplete as MockAsyncFn<CliResult>).mockResolvedValue({
      exitCode: 1,
      stderr: 'EPERM',
      signal: null,
    })
    const onCompleted = jest.fn()
    queue.onJobCompleted(onCompleted)

    queue.enqueue({ operationId: '1', operation: 'install', skillName: 'skill', args: [], cwd: '/' })

    await jest.runAllTimersAsync()

    expect(mockCliSpawner.spawn).toHaveBeenCalledTimes(4) // Initial + 3 retries
    expect(onCompleted).toHaveBeenCalledWith(expect.objectContaining({ status: 'error', errorMessage: 'EPERM' }))
  })

  it('should cancel an in-flight job', async () => {
    // Job hangs until we resolve it manually
    let resolveJob: (val: CliResult) => void
    ;(mockCliProcess.onComplete as MockAsyncFn<CliResult>).mockReturnValue(new Promise((r) => (resolveJob = r)))

    queue.enqueue({ operationId: '1', operation: 'install', skillName: 'skill', args: [], cwd: '/' })

    // Ensure it started
    await jest.advanceTimersByTimeAsync(0)

    const cancelled = queue.cancel('1')
    expect(cancelled).toBe(true)
    expect(mockCliProcess.kill).toHaveBeenCalled()

    // Simulate process exit due to kill
    resolveJob!({ exitCode: null, stderr: '', signal: 'SIGTERM' })

    await jest.runAllTimersAsync()
  })

  it('should cancel a queued job', async () => {
    // Make first job hang
    ;(mockCliProcess.onComplete as MockAsyncFn<CliResult>).mockReturnValue(new Promise(() => {}))
    queue.enqueue({ operationId: '1', operation: 'install', skillName: 'skill1', args: [], cwd: '/' })

    // Queue second job
    queue.enqueue({ operationId: '2', operation: 'install', skillName: 'skill2', args: [], cwd: '/' })

    const cancelled = queue.cancel('2')
    expect(cancelled).toBe(true)

    // Should remove from queue, so if we finish job 1, job 2 never runs
    expect(mockCliSpawner.spawn).toHaveBeenCalledTimes(1) // Only job 1
  })

  it('preserves metadata across queue events', async () => {
    const onStarted = jest.fn()
    const onCompleted = jest.fn()
    queue.onJobStarted(onStarted)
    queue.onJobCompleted(onCompleted)
    ;(mockCliProcess.onComplete as MockAsyncFn<CliResult>).mockResolvedValue({ exitCode: 0, stderr: '', signal: null })

    const metadata: OperationBatchMetadata = {
      batchId: 'batch-1',
      batchSize: 2,
      skillNames: ['a', 'b'],
      scope: 'local',
      agents: ['cursor'],
    }
    queue.enqueue({ operationId: 'meta', operation: 'install', skillName: 'meta', args: [], cwd: '/', metadata })

    await jest.runAllTimersAsync()

    expect(onStarted).toHaveBeenCalledWith(expect.objectContaining({ metadata }))
    expect(onCompleted).toHaveBeenCalledWith(expect.objectContaining({ metadata }))
  })
})
