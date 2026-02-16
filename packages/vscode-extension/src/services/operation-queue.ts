import type { OperationType } from '../shared/types'
import type { CliProcess, CliSpawner } from './cli-spawner'
import { classifyError } from './error-classifier'
import { withRetry } from './retry-handler'

/**
 * A queued job waiting to be executed.
 */
export interface QueuedJob {
  operationId: string
  operation: OperationType
  skillName: string
  args: string[] // CLI arguments for this job
  cwd: string // Working directory
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
}

/**
 * Receives progress notifications emitted while a job runs.
 */
export type JobProgressHandler = (job: QueuedJob, message: string) => void

/**
 * Sequential job queue with concurrency=1 (mutex pattern).
 * Ensures only one CLI process runs at a time.
 */
export class OperationQueue {
  private queue: QueuedJob[] = []
  private activeJob: { job: QueuedJob; process: CliProcess } | null = null
  private processing = false

  private jobStartedHandlers: Array<(job: QueuedJob) => void> = []
  private jobCompletedHandlers: Array<(result: JobResult) => void> = []
  private jobProgressHandlers: JobProgressHandler[] = []

  constructor(private readonly spawner: CliSpawner) {}

  /**
   * Enqueues a job for execution.
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
   * If in-flight: sends SIGTERM to the process.
   * @returns true if the job was found and cancelled
   */
  cancel(operationId: string): boolean {
    // Check if in-flight
    if (this.activeJob && this.activeJob.job.operationId === operationId) {
      this.activeJob.process.kill()
      // The completion handler will emit 'cancelled' status
      return true
    }

    // Check if queued
    const index = this.queue.findIndex((j) => j.operationId === operationId)
    if (index !== -1) {
      const [job] = this.queue.splice(index, 1)
      this.jobCompletedHandlers.forEach((handler) =>
        handler({
          operationId: job.operationId,
          operation: job.operation,
          skillName: job.skillName,
          status: 'cancelled',
        }),
      )
      return true
    }

    return false
  }

  /**
   * Disposes the queue: kills in-flight job and clears pending jobs.
   */
  dispose(): void {
    if (this.activeJob) {
      this.activeJob.process.kill()
      this.activeJob = null
    }
    this.queue = []
    this.processing = false
  }

  /**
   * Registers a handler for job started events.
   */
  onJobStarted(handler: (job: QueuedJob) => void): void {
    this.jobStartedHandlers.push(handler)
  }

  /**
   * Registers a handler for job completed events.
   */
  onJobCompleted(handler: (result: JobResult) => void): void {
    this.jobCompletedHandlers.push(handler)
  }

  /**
   * Registers a handler for job progress events.
   */
  onJobProgress(handler: JobProgressHandler): void {
    this.jobProgressHandlers.push(handler)
  }

  /**
   * Drains the queue sequentially (concurrency=1).
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
   */
  private async executeJob(job: QueuedJob): Promise<void> {
    // Emit job started
    this.jobStartedHandlers.forEach((handler) => handler(job))

    try {
      const result = await withRetry(() => this.executeOnce(job), {
        maxRetries: 3,
        baseDelayMs: 500,
        shouldRetry: (error: any) => error.retryable === true,
        onRetry: (attempt, max) => {
          this.jobProgressHandlers.forEach((handler) => handler(job, `Retrying (attempt ${attempt}/${max})...`))
        },
      })

      this.jobCompletedHandlers.forEach((handler) => handler(result))
    } catch (error: any) {
      // Handle final failure
      let status: 'error' | 'cancelled' = 'error'
      let errorMessage = error.message

      if (error.category === 'cancelled') {
        status = 'cancelled'
        errorMessage = undefined
      } else if (error.category) {
        // It's an ErrorInfo
        errorMessage = error.message
      }

      this.jobCompletedHandlers.forEach((handler) =>
        handler({
          operationId: job.operationId,
          operation: job.operation,
          skillName: job.skillName,
          status,
          errorMessage,
        }),
      )
    }
  }

  /**
   * Executes the job once, returns promise that resolves on success
   * or rejects with ErrorInfo on failure.
   */
  private executeOnce(job: QueuedJob): Promise<JobResult> {
    return new Promise<JobResult>((resolve, reject) => {
      const process = this.spawner.spawn(job.args, {
        cwd: job.cwd,
        operationId: job.operationId,
      })

      this.activeJob = { job, process }

      process.onComplete().then((result) => {
        this.activeJob = null

        // Classify the result
        const errorInfo = classifyError(result.stderr, result.exitCode, result.signal)

        if (result.exitCode === 0) {
          resolve({
            operationId: job.operationId,
            operation: job.operation,
            skillName: job.skillName,
            status: 'completed',
          })
        } else {
          // Reject with ErrorInfo to trigger retry logic if applicable
          reject(errorInfo)
        }
      })
    })
  }
}
