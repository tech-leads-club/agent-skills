import { jest } from '@jest/globals'
import type { JobExecutor, JobResult, QueuedJob } from '../../services/operation-queue'
import type { OperationBatchMetadata } from '../../shared/types'

const mockExecute = jest.fn<(job: QueuedJob) => Promise<JobResult>>()

const mockExecutor: JobExecutor = {
  execute: mockExecute,
}

const { OperationQueue } = await import('../../services/operation-queue')

describe('OperationQueue', () => {
  let queue: InstanceType<typeof OperationQueue>

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    queue = new OperationQueue(mockExecutor)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should execute a job successfully', async () => {
    mockExecute.mockResolvedValue({
      operationId: '1',
      operation: 'install',
      skillName: 'skill',
      status: 'completed',
    })
    const onCompleted = jest.fn()
    queue.onJobCompleted(onCompleted)

    const job: QueuedJob = { operationId: '1', operation: 'install', skillName: 'skill', args: [], cwd: '/' }
    queue.enqueue(job)

    await jest.runAllTimersAsync()

    expect(mockExecute).toHaveBeenCalledTimes(1)
    expect(onCompleted).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }))
  })

  it('should retry on retryable error', async () => {
    const retryableError = { category: 'cli-error', retryable: true, message: 'EPERM' }
    mockExecute
      .mockRejectedValueOnce(retryableError)
      .mockResolvedValueOnce({
        operationId: '1',
        operation: 'install',
        skillName: 'skill',
        status: 'completed',
      })

    const onProgress = jest.fn()
    queue.onJobProgress(onProgress)
    const onCompleted = jest.fn()
    queue.onJobCompleted(onCompleted)

    queue.enqueue({ operationId: '1', operation: 'install', skillName: 'skill', args: [], cwd: '/' })

    await jest.runAllTimersAsync()

    expect(mockExecute).toHaveBeenCalledTimes(2)
    expect(onProgress).toHaveBeenCalled()
    expect(onCompleted).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }))
  })

  it('should fail after exhausting retries', async () => {
    const retryableError = { category: 'cli-error', retryable: true, message: 'EPERM' }
    mockExecute.mockRejectedValue(retryableError)

    const onCompleted = jest.fn()
    queue.onJobCompleted(onCompleted)

    queue.enqueue({ operationId: '1', operation: 'install', skillName: 'skill', args: [], cwd: '/' })

    await jest.runAllTimersAsync()

    expect(mockExecute).toHaveBeenCalledTimes(4)
    expect(onCompleted).toHaveBeenCalledWith(expect.objectContaining({ status: 'error', errorMessage: 'EPERM' }))
  })

  it('should cancel a queued job', async () => {
    mockExecute.mockImplementation(() => new Promise(() => {}))
    queue.enqueue({ operationId: '1', operation: 'install', skillName: 'skill1', args: [], cwd: '/' })
    queue.enqueue({ operationId: '2', operation: 'install', skillName: 'skill2', args: [], cwd: '/' })

    const cancelled = queue.cancel('2')
    expect(cancelled).toBe(true)

    await jest.advanceTimersByTimeAsync(0)
    expect(mockExecute).toHaveBeenCalledTimes(1)
  })

  it('preserves metadata across queue events', async () => {
    const onStarted = jest.fn()
    const onCompleted = jest.fn()
    queue.onJobStarted(onStarted)
    queue.onJobCompleted(onCompleted)
    const batchMeta: OperationBatchMetadata = {
      batchId: 'batch-1',
      batchSize: 2,
      skillNames: ['a', 'b'],
      scope: 'local',
      agents: ['cursor'],
    }
    mockExecute.mockResolvedValue({
      operationId: 'meta',
      operation: 'install',
      skillName: 'meta',
      status: 'completed',
      metadata: batchMeta,
    })
    queue.enqueue({ operationId: 'meta', operation: 'install', skillName: 'meta', args: [], cwd: '/', metadata: batchMeta })

    await jest.runAllTimersAsync()

    expect(onStarted).toHaveBeenCalledWith(expect.objectContaining({ metadata: batchMeta }))
    expect(onCompleted).toHaveBeenCalledWith(expect.objectContaining({ metadata: batchMeta }))
  })
})
