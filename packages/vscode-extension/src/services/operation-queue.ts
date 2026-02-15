import type { OperationType } from '../shared/types'
import type { CliProcess, CliSpawner } from './cli-spawner'

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
  status: JobStatus
  errorMessage?: string
}

/**
 * Sequential job queue with concurrency=1 (mutex pattern).
 * Ensures only one CLI process runs at a time.
 */
export class OperationQueue {
  private queue: QueuedJob[] = []
  private inFlight: { job: QueuedJob; process: CliProcess } | null = null
  private draining = false

  private jobStartedHandlers: Array<(job: QueuedJob) => void> = []
  private jobCompletedHandlers: Array<(result: JobResult) => void> = []

  constructor(private readonly spawner: CliSpawner) {}

  /**
   * Enqueues a job and starts drain if idle.
   * @returns The operationId of the enqueued job
   */
  enqueue(job: QueuedJob): string {
    this.queue.push(job)
    if (!this.draining) {
      void this.drain()
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
    if (this.inFlight && this.inFlight.job.operationId === operationId) {
      this.inFlight.process.kill()
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
    if (this.inFlight) {
      this.inFlight.process.kill()
      this.inFlight = null
    }
    this.queue = []
    this.draining = false
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
   * Drains the queue sequentially (concurrency=1).
   */
  private async drain(): Promise<void> {
    if (this.draining) return
    this.draining = true

    while (this.queue.length > 0) {
      const job = this.queue.shift()!
      await this.executeJob(job)
    }

    this.draining = false
  }

  /**
   * Executes a single job.
   */
  private async executeJob(job: QueuedJob): Promise<void> {
    // Emit job started
    this.jobStartedHandlers.forEach((handler) => handler(job))

    // Spawn the CLI process
    const process = this.spawner.spawn(job.args, {
      cwd: job.cwd,
      operationId: job.operationId,
    })

    this.inFlight = { job, process }

    // Wait for completion
    const result = await process.onComplete()

    // Clear in-flight
    this.inFlight = null

    // Determine status
    let status: JobStatus
    let errorMessage: string | undefined

    if (result.signal === 'SIGTERM') {
      // User-initiated cancellation
      status = 'cancelled'
    } else if (result.exitCode === 0) {
      status = 'completed'
    } else {
      status = 'error'
      errorMessage = result.stderr || `Process exited with code ${result.exitCode}`
    }

    // Emit job completed
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
