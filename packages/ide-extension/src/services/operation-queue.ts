import type { ErrorInfo, OperationBatchMetadata, OperationType } from '../shared/types'
import { withRetry } from './retry-handler'

/**
 * Executes a queued job (e.g. via core services or CLI).
 */
export interface JobExecutor {
  execute(job: QueuedJob): Promise<JobResult>
}

const UNKNOWN_ERROR_MESSAGE = 'An unexpected error occurred. Check the Agent Skills output channel for details.'

/**
 * Type guard for normalized error payloads used by queue error handling.
 *
 * @param value - Unknown value to validate.
 * @returns `true` when the value conforms to {@link ErrorInfo}.
 */
const isErrorInfo = (value: unknown): value is ErrorInfo =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as ErrorInfo).category === 'string' &&
  typeof (value as ErrorInfo).message === 'string'

/**
 * Converts unknown failures into a user-facing error message.
 *
 * @param value - Unknown error value.
 * @returns A best-effort message suitable for UI display.
 */
const toErrorMessage = (value: unknown): string => {
  if (isErrorInfo(value)) {
    return value.message
  }
  if (value instanceof Error) {
    return value.message
  }
  return UNKNOWN_ERROR_MESSAGE
}

/**
 * A queued job waiting to be executed.
 */
export interface QueuedJob {
  operationId: string
  operation: OperationType
  skillName: string
  args?: string[]
  cwd?: string
  metadata?: OperationBatchMetadata
}

/**
 * Status of a job in the queue.
 */
export type JobStatus = 'queued' | 'running' | 'completed' | 'cancelled' | 'error'

/**
 * Result of a completed job.
 */
export interface JobResult {
  operationId: string
  operation: OperationType
  skillName: string
  status: 'completed' | 'cancelled' | 'error'
  errorMessage?: string
  error?: unknown
  metadata?: OperationBatchMetadata
}

/**
 * Receives progress notifications emitted while a job runs.
 */
export type JobProgressHandler = (job: QueuedJob, message: string) => void

/**
 * Sequential job queue with concurrency=1 (mutex pattern).
 * Ensures only one operation runs at a time.
 */
export class OperationQueue {
  private queue: QueuedJob[] = []
  private activeJob: QueuedJob | null = null
  private processing = false

  private jobStartedHandlers: Array<(job: QueuedJob) => void> = []
  private jobCompletedHandlers: Array<(result: JobResult) => void> = []
  private jobProgressHandlers: JobProgressHandler[] = []

  /**
   * Creates an operation queue bound to an executor.
   *
   * @param executor - Service used to execute jobs (e.g. CoreJobExecutor).
   */
  constructor(private readonly executor: JobExecutor) {}

  /**
   * Enqueues a job for execution.
   *
   * @param job - Job definition to append to the queue.
   * @returns The operationId of the enqueued job
   */
  enqueue(job: QueuedJob): string {
    this.queue.push(job)
    if (!this.processing) {
      void this.processQueue()
    }
    return job.operationId
  }

  /**
   * Cancels a job by operationId.
   * If queued: removes from queue.
   * If in-flight: core operations cannot be cancelled; returns false.
   *
   * @param operationId - Identifier of the job to cancel.
   * @returns true if the job was found and cancelled
   */
  cancel(operationId: string): boolean {
    if (this.activeJob && this.activeJob.operationId === operationId) {
      return false
    }

    const index = this.queue.findIndex((j) => j.operationId === operationId)
    if (index !== -1) {
      const [job] = this.queue.splice(index, 1)
      this.jobCompletedHandlers.forEach((handler) =>
        handler({
          operationId: job.operationId,
          operation: job.operation,
          skillName: job.skillName,
          status: 'cancelled',
          metadata: job.metadata,
        }),
      )
      return true
    }

    return false
  }

  /**
   * Disposes the queue: clears pending jobs and clears active job reference.
   *
   * @returns Nothing.
   */
  dispose(): void {
    this.activeJob = null
    this.queue = []
    this.processing = false
  }

  /**
   * Registers a handler for job started events.
   *
   * @param handler - Callback invoked when a job starts running.
   * @returns Nothing.
   */
  onJobStarted(handler: (job: QueuedJob) => void): void {
    this.jobStartedHandlers.push(handler)
  }

  /**
   * Registers a handler for job completed events.
   *
   * @param handler - Callback invoked when a job completes, errors, or is cancelled.
   * @returns Nothing.
   */
  onJobCompleted(handler: (result: JobResult) => void): void {
    this.jobCompletedHandlers.push(handler)
  }

  /**
   * Registers a handler for job progress events.
   *
   * @param handler - Callback invoked when a running job emits progress output.
   * @returns Nothing.
   */
  onJobProgress(handler: JobProgressHandler): void {
    this.jobProgressHandlers.push(handler)
  }

  /**
   * Drains the queue sequentially (concurrency=1).
   *
   * @returns A promise that resolves when the queue becomes empty.
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return
    this.processing = true

    while (this.queue.length > 0) {
      const job = this.queue.shift()!
      await this.executeJob(job)
    }

    this.processing = false
  }

  /**
   * Executes a single job with retry logic.
   *
   * @param job - Job to execute.
   * @returns A promise that resolves when the job reaches a terminal state.
   */
  private async executeJob(job: QueuedJob): Promise<void> {
    this.jobStartedHandlers.forEach((handler) => handler(job))

    try {
      const result = await withRetry(() => this.executeOnce(job), {
        maxRetries: 3,
        baseDelayMs: 500,
        shouldRetry: (error: ErrorInfo) => error.retryable === true,
        onRetry: (attempt, max) => {
          this.jobProgressHandlers.forEach((handler) => handler(job, `Retrying (attempt ${attempt}/${max})...`))
        },
      })

      this.jobCompletedHandlers.forEach((handler) => handler(result))
    } catch (error: unknown) {
      let status: 'error' | 'cancelled' = 'error'
      let errorMessage: string | undefined = toErrorMessage(error)

      if (isErrorInfo(error) && error.category === 'cancelled') {
        status = 'cancelled'
        errorMessage = undefined
      }

      this.jobCompletedHandlers.forEach((handler) =>
        handler({
          operationId: job.operationId,
          operation: job.operation,
          skillName: job.skillName,
          status,
          errorMessage,
          error: status === 'error' ? error : undefined,
          metadata: job.metadata,
        }),
      )
    }
  }

  /**
   * Executes the job once via the executor.
   *
   * @param job - Job to execute once.
   * @returns A promise that resolves with completion metadata.
   */
  private async executeOnce(job: QueuedJob): Promise<JobResult> {
    this.activeJob = job
    try {
      const result = await this.executor.execute(job)
      return result
    } finally {
      this.activeJob = null
    }
  }
}
