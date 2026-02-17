import { randomUUID } from 'node:crypto'
import * as vscode from 'vscode'
import type { OperationType } from '../shared/types'
import type { LoggingService } from './logging-service'
import type { JobResult, OperationQueue, QueuedJob } from './operation-queue'
import type { PostInstallVerifier } from './post-install-verifier'

/**
 * Event handler for operation lifecycle events.
 *
 * @param event - Operation event emitted by the orchestrator.
 * @returns Nothing.
 */
export interface OperationEventHandler {
  (event: OperationEvent): void
}

/**
 * Operation lifecycle event.
 */
export interface OperationEvent {
  operationId: string
  operation: OperationType
  skillName: string
  type: 'started' | 'progress' | 'completed'
  message?: string
  success?: boolean
  errorMessage?: string
}

interface JobMetadata {
  scope: 'local' | 'global'
  agents: string[] // relevant for install/remove/repair
}

/**
 * High-level coordinator for install/remove/update/repair operations.
 * Translates user intent into CLI jobs, manages VS Code progress UI,
 * and bridges the Webview with the operation queue.
 */
export class InstallationOrchestrator implements vscode.Disposable {
  private eventHandlers: OperationEventHandler[] = []
  private activeOperations = new Map<string, vscode.CancellationTokenSource>()
  private jobMetadata = new Map<string, JobMetadata>()
  private progressResolvers = new Map<string, () => void>()
  private cliHealthy = true // Default true until health check says otherwise

  /**
   * Creates a new orchestrator and subscribes to queue lifecycle events.
   *
   * @param queue - Serialized operation queue for CLI jobs.
   * @param verifier - Post-install verifier used for install/repair validation.
   * @param logger - Logging service for diagnostics.
   */
  constructor(
    private readonly queue: OperationQueue,
    private readonly verifier: PostInstallVerifier,
    private readonly logger: LoggingService,
  ) {
    // Subscribe to queue events
    this.queue.onJobStarted((job) => this.handleJobStarted(job))
    this.queue.onJobCompleted((result) => this.handleJobCompleted(result))
    this.queue.onJobProgress((job, message) => this.handleJobProgress(job, message))
  }

  /**
   * Sets the CLI health status. If unhealthy, mutations are blocked.
   *
   * @param healthy - Whether the CLI is available for operations.
   * @returns Nothing.
   */
  setCliHealthy(healthy: boolean): void {
    this.cliHealthy = healthy
  }

  /**
   * Installs a skill to the specified scope and agents.
   *
   * @param skillName - Skill identifier to install.
   * @param scope - Installation scope.
   * @param agents - Agent identifiers to target.
   * @returns A promise that resolves once the job is enqueued.
   */
  async install(skillName: string, scope: 'local' | 'global', agents: string[]): Promise<void> {
    if (!this.checkHealth()) return

    const operationId = randomUUID()
    const args = ['install', '-s', skillName, '-a', ...agents]
    if (scope === 'global') {
      args.push('-g')
    }

    this.jobMetadata.set(operationId, { scope, agents })

    const cwd = this.getCwd(scope)
    const job: QueuedJob = {
      operationId,
      operation: 'install',
      skillName,
      args,
      cwd,
    }

    this.logger.info(`[${operationId}] Enqueuing install: ${skillName} (${scope}, agents: ${agents.join(', ')})`)
    this.queue.enqueue(job)
  }

  /**
   * Removes a skill from the specified scope and agents.
   *
   * @param skillName - Skill identifier to remove.
   * @param scope - Removal scope.
   * @param agents - Agent identifiers to target.
   * @returns A promise that resolves once the job is enqueued.
   */
  async remove(skillName: string, scope: 'local' | 'global', agents: string[]): Promise<void> {
    if (!this.checkHealth()) return

    const operationId = randomUUID()
    const args = ['remove', '-s', skillName, '-a', ...agents]
    if (scope === 'global') {
      args.push('-g')
    }

    this.jobMetadata.set(operationId, { scope, agents })

    const cwd = this.getCwd(scope)
    const job: QueuedJob = {
      operationId,
      operation: 'remove',
      skillName,
      args,
      cwd,
    }

    this.logger.info(`[${operationId}] Enqueuing remove: ${skillName} (${scope}, agents: ${agents.join(', ')})`)
    this.queue.enqueue(job)
  }

  /**
   * Updates a skill to the latest version.
   *
   * @param skillName - Skill identifier to update.
   * @returns A promise that resolves once the job is enqueued.
   */
  async update(skillName: string): Promise<void> {
    if (!this.checkHealth()) return

    const operationId = randomUUID()
    const args = ['update', '-s', skillName]

    // Use workspace as CWD if available, else home directory
    let cwd: string
    if (vscode.workspace.workspaceFolders?.[0]) {
      cwd = vscode.workspace.workspaceFolders[0].uri.fsPath
    } else {
      cwd = process.env.HOME || process.env.USERPROFILE || '~'
    }

    // Updates apply globally; metadata is only tracked for install/repair verification.

    const job: QueuedJob = {
      operationId,
      operation: 'update',
      skillName,
      args,
      cwd,
    }

    this.logger.info(`[${operationId}] Enqueuing update: ${skillName}`)
    this.queue.enqueue(job)
  }

  /**
   * Repairs a skill by force-reinstalling.
   *
   * @param skillName - Skill identifier to repair.
   * @param scope - Repair scope.
   * @param agents - Agent identifiers to target.
   * @returns A promise that resolves once the job is enqueued.
   */
  async repair(skillName: string, scope: 'local' | 'global', agents: string[]): Promise<void> {
    if (!this.checkHealth()) return

    const operationId = randomUUID()
    // Same as install but with -f flag
    const args = ['install', '-s', skillName, '-a', ...agents, '-f']
    if (scope === 'global') {
      args.push('-g')
    }

    this.jobMetadata.set(operationId, { scope, agents })

    const cwd = this.getCwd(scope)
    const job: QueuedJob = {
      operationId,
      operation: 'repair',
      skillName,
      args,
      cwd,
    }

    this.logger.info(`[${operationId}] Enqueuing repair: ${skillName} (${scope}, agents: ${agents.join(', ')})`)
    this.queue.enqueue(job)
  }

  /**
   * Cancels an in-flight or queued operation.
   *
   * @param operationId - Operation identifier to cancel.
   * @returns Nothing.
   */
  cancel(operationId: string): void {
    this.logger.info(`[${operationId}] Cancelling operation`)
    const cancelled = this.queue.cancel(operationId)
    if (cancelled) {
      // Cancel the VS Code progress notification
      const tokenSource = this.activeOperations.get(operationId)
      if (tokenSource) {
        tokenSource.cancel()
        this.activeOperations.delete(operationId)
      }
    }
  }

  /**
   * Subscribes to operation lifecycle events.
   *
   * @param handler - Callback invoked for started/progress/completed events.
   * @returns Nothing.
   */
  onOperationEvent(handler: OperationEventHandler): void {
    this.eventHandlers.push(handler)
  }

  /**
   * Disposes the orchestrator and cleans up resources.
   *
   * @returns Nothing.
   */
  dispose(): void {
    this.queue.dispose()
    this.activeOperations.forEach((tokenSource) => tokenSource.dispose())
    this.activeOperations.clear()
    this.jobMetadata.clear()
  }

  /**
   * Checks CLI health and shows error if unhealthy.
   * Returns true if healthy.
   *
   * @returns `true` when operations are allowed; otherwise `false`.
   */
  private checkHealth(): boolean {
    if (!this.cliHealthy) {
      void vscode.window.showErrorMessage(
        'Cannot perform operation — the Agent Skills CLI is not available.',
        'Check Setup',
      )
      return false
    }
    return true
  }

  /**
   * Handles job started event from the queue.
   *
   * @param job - Job that just transitioned to running.
   * @returns Nothing.
   */
  private handleJobStarted(job: QueuedJob): void {
    this.logger.info(`[${job.operationId}] Job started: ${job.operation} ${job.skillName}`)

    // Emit started event
    this.emitEvent({
      operationId: job.operationId,
      operation: job.operation,
      skillName: job.skillName,
      type: 'started',
    })

    // Show VS Code progress notification
    this.showProgress(job)
  }

  /**
   * Handles job progress event.
   *
   * @param job - Running job that emitted progress.
   * @param message - Progress line from the CLI.
   * @returns Nothing.
   */
  private handleJobProgress(job: QueuedJob, message: string): void {
    // Emit progress event
    this.emitEvent({
      operationId: job.operationId,
      operation: job.operation,
      skillName: job.skillName,
      type: 'progress',
      message,
    })
  }

  /**
   * Handles job completed event from the queue.
   *
   * @param result - Completed job result payload.
   * @returns A promise that resolves after notifications and cleanup finish.
   */
  private async handleJobCompleted(result: JobResult): Promise<void> {
    this.logger.info(`[${result.operationId}] Job completed: ${result.status}`)

    this.emitEvent({
      operationId: result.operationId,
      operation: result.operation,
      skillName: result.skillName,
      type: 'completed',
      success: result.status === 'completed',
      errorMessage: result.errorMessage,
    })

    this.cleanupActiveOperation(result.operationId)
    await this.handleCompletionNotification(result)
    this.jobMetadata.delete(result.operationId)
  }

  /**
   * Shows a VS Code progress notification for a job.
   *
   * @param job - Job currently being executed.
   * @returns Nothing.
   */
  private showProgress(job: QueuedJob): void {
    const tokenSource = new vscode.CancellationTokenSource()
    this.activeOperations.set(job.operationId, tokenSource)

    const completionPromise = new Promise<void>((resolve) => {
      this.progressResolvers.set(job.operationId, resolve)
    })

    void vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `${this.getOperationLabel(job.operation)} '${job.skillName}'...`,
        cancellable: true,
      },
      async (_progress, token) => {
        token.onCancellationRequested(() => {
          this.cancel(job.operationId)
        })

        await completionPromise
      },
    )
  }

  /**
   * Disposes cancellation state and progress completion for an operation.
   *
   * @param operationId - Operation identifier to clean up.
   * @returns Nothing.
   */
  private cleanupActiveOperation(operationId: string): void {
    const tokenSource = this.activeOperations.get(operationId)
    if (tokenSource) {
      tokenSource.dispose()
      this.activeOperations.delete(operationId)
    }
    this.resolveProgress(operationId)
  }

  /**
   * Resolves the progress promise associated with an operation.
   *
   * @param operationId - Operation identifier whose progress should complete.
   * @returns Nothing.
   */
  private resolveProgress(operationId: string): void {
    const resolver = this.progressResolvers.get(operationId)
    if (resolver) {
      resolver()
      this.progressResolvers.delete(operationId)
    }
  }

  /**
   * Shows completion feedback for successful, failed, or cancelled operations.
   *
   * @param result - Completed job result payload.
   * @returns A promise that resolves when notification handling completes.
   */
  private async handleCompletionNotification(result: JobResult): Promise<void> {
    if (result.status === 'completed') {
      const metadata = this.jobMetadata.get(result.operationId)
      if ((result.operation === 'install' || result.operation === 'repair') && metadata) {
        const verified = await this.verifyInstallation(result, metadata)
        if (!verified) {
          return
        }
      }

      void vscode.window.showInformationMessage(
        `✓ ${this.getOperationLabel(result.operation)} '${result.skillName}' completed`,
      )
      return
    }

    if (result.status === 'error') {
      void vscode.window.showErrorMessage(
        `✗ ${this.getOperationLabel(result.operation)} '${result.skillName}' failed: ${result.errorMessage}`,
      )
    } else if (result.status === 'cancelled') {
      void vscode.window.showWarningMessage(
        `⊘ ${this.getOperationLabel(result.operation)} '${result.skillName}' cancelled`,
      )
    }
  }

  /**
   * Performs post-install verification for install and repair operations.
   *
   * @param result - Completed job result payload.
   * @param metadata - Job metadata required for verification scope/agents.
   * @returns `true` when verification succeeds; otherwise `false`.
   */
  private async verifyInstallation(result: JobResult, metadata: JobMetadata): Promise<boolean> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || null
    const verifyResult = await this.verifier.verify(result.skillName, metadata.agents, metadata.scope, workspaceRoot)

    if (verifyResult.ok) {
      return true
    }

    this.logger.warn(
      `[${result.operationId}] Post-install verification failed: ${JSON.stringify(verifyResult.corrupted)}`,
    )

    const action = await vscode.window.showWarningMessage(
      `Skill '${result.skillName}' may be corrupted — SKILL.md not found in expected locations.`,
      'Repair',
    )

    if (action === 'Repair') {
      void this.repair(result.skillName, metadata.scope, metadata.agents)
    }

    return false
  }

  /**
   * Emits an operation event to all registered handlers.
   *
   * @param event - Event payload to broadcast.
   * @returns Nothing.
   */
  private emitEvent(event: OperationEvent): void {
    this.eventHandlers.forEach((handler) => handler(event))
  }

  /**
   * Gets the working directory for a scope.
   *
   * @param scope - Target operation scope.
   * @returns Filesystem path used as process working directory.
   * @throws {Error} When local scope is requested without an open workspace.
   */
  private getCwd(scope: 'local' | 'global'): string {
    if (scope === 'local') {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
      if (!workspaceFolder) {
        throw new Error('No workspace folder open. Cannot install locally.')
      }
      return workspaceFolder.uri.fsPath
    } else {
      // Global scope uses home directory
      return process.env.HOME || process.env.USERPROFILE || '~'
    }
  }

  /**
   * Gets a human-readable label for an operation type.
   *
   * @param operation - Operation type.
   * @returns Present-progress label used in notifications.
   */
  private getOperationLabel(operation: OperationType): string {
    switch (operation) {
      case 'install':
        return 'Installing'
      case 'remove':
        return 'Removing'
      case 'update':
        return 'Updating'
      case 'repair':
        return 'Repairing'
    }
  }
}
