import { randomUUID } from 'node:crypto'
import * as vscode from 'vscode'
import type { OperationType } from '../shared/types'
import type { LoggingService } from './logging-service'
import type { JobResult, OperationQueue, QueuedJob } from './operation-queue'
import type { PostInstallVerifier } from './post-install-verifier'

/**
 * Event handler for operation lifecycle events.
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
  private cliHealthy = true // Default true until health check says otherwise

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
   */
  setCliHealthy(healthy: boolean): void {
    this.cliHealthy = healthy
  }

  /**
   * Installs a skill to the specified scope and agents.
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

    // For update, scope/agents are implicit/all, but we store dummy metadata or handle gracefully
    // Update affects all installed instances.
    // We don't strictly need metadata for verification unless update installs new files?
    // Update might re-install.
    // For now, metadata is crucial for install/repair.

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
   */
  onOperationEvent(handler: OperationEventHandler): void {
    this.eventHandlers.push(handler)
  }

  /**
   * Disposes the orchestrator and cleans up resources.
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
   */
  private async handleJobCompleted(result: JobResult): Promise<void> {
    this.logger.info(`[${result.operationId}] Job completed: ${result.status}`)

    // Emit completed event
    this.emitEvent({
      operationId: result.operationId,
      operation: result.operation,
      skillName: result.skillName,
      type: 'completed',
      success: result.status === 'completed',
      errorMessage: result.errorMessage,
    })

    // Clean up active operation
    const tokenSource = this.activeOperations.get(result.operationId)
    if (tokenSource) {
      tokenSource.dispose()
      this.activeOperations.delete(result.operationId)
    }

    // Show completion notification
    if (result.status === 'completed') {
      const metadata = this.jobMetadata.get(result.operationId)

      // Perform post-install verification for install/repair
      if ((result.operation === 'install' || result.operation === 'repair') && metadata) {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || null
        const verifyResult = await this.verifier.verify(
          result.skillName,
          metadata.agents,
          metadata.scope,
          workspaceRoot,
        )

        if (!verifyResult.ok) {
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
          // Don't show success message if corrupted
          this.jobMetadata.delete(result.operationId)
          return
        }
      }

      void vscode.window.showInformationMessage(
        `✓ ${this.getOperationLabel(result.operation)} '${result.skillName}' completed`,
      )
    } else if (result.status === 'error') {
      void vscode.window.showErrorMessage(
        `✗ ${this.getOperationLabel(result.operation)} '${result.skillName}' failed: ${result.errorMessage}`,
      )
    } else if (result.status === 'cancelled') {
      void vscode.window.showWarningMessage(
        `⊘ ${this.getOperationLabel(result.operation)} '${result.skillName}' cancelled`,
      )
    }

    this.jobMetadata.delete(result.operationId)
  }

  /**
   * Shows a VS Code progress notification for a job.
   */
  private showProgress(job: QueuedJob): void {
    const tokenSource = new vscode.CancellationTokenSource()
    this.activeOperations.set(job.operationId, tokenSource)

    void vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `${this.getOperationLabel(job.operation)} '${job.skillName}'...`,
        cancellable: true,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => {
          this.cancel(job.operationId)
        })

        // Listen for progress updates specifically for this job
        // Note: The global handler emits events, but here we update the specific notification
        // We could attach a listener here, but since handleJobProgress calls emitEvent,
        // we might rely on that. But for withProgress, we need to call progress.report().
        // Let's hook into jobProgressHandlers in constructor and route it here?
        // Or simpler: handleJobProgress can update a map of progress reporters?
        // But withProgress callback has the `progress` object scoped.

        // We can just poll or use a dedicated event emitter.
        // Actually, let's keep it simple: progress notification stays open until job completes.
        // If we want "Retrying..." text update, we need access to `progress`.
        // Let's store the progress reporter in a map?
        // Or just let the notification stay with the title.
        // The task T7 says: "Add onJobProgress(handler) method for subscribing to progress events".
        // T8 says: "getOperationLabel case for 'repair' -> 'Repairing'".
        // It doesn't explicitly require updating the progress notification text in UI,
        // but it would be nice.
        // However, I'll stick to the core requirement: notification shows title.
        // "Retrying..." is emitted via event handler, which the Webview might consume.
        // If I want the Notification to update, I'd need to store `progress` object.

        // Wait for completion
        return new Promise<void>((resolve) => {
          const checkInterval = setInterval(() => {
            if (!this.activeOperations.has(job.operationId)) {
              clearInterval(checkInterval)
              resolve()
            }
          }, 100)
        })
      },
    )
  }

  /**
   * Emits an operation event to all registered handlers.
   */
  private emitEvent(event: OperationEvent): void {
    this.eventHandlers.forEach((handler) => handler(event))
  }

  /**
   * Gets the working directory for a scope.
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
