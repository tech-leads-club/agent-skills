import { randomUUID } from 'node:crypto'
import * as vscode from 'vscode'
import type { OperationType } from '../shared/types'
import type { LoggingService } from './logging-service'
import type { JobResult, OperationQueue, QueuedJob } from './operation-queue'

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

/**
 * High-level coordinator for install/remove/update operations.
 * Translates user intent into CLI jobs, manages VS Code progress UI,
 * and bridges the Webview with the operation queue.
 */
export class InstallationOrchestrator implements vscode.Disposable {
  private eventHandlers: OperationEventHandler[] = []
  private activeOperations = new Map<string, vscode.CancellationTokenSource>()

  constructor(
    private readonly queue: OperationQueue,
    private readonly logger: LoggingService,
  ) {
    // Subscribe to queue events
    this.queue.onJobStarted((job) => this.handleJobStarted(job))
    this.queue.onJobCompleted((result) => this.handleJobCompleted(result))
  }

  /**
   * Installs a skill to the specified scope and agents.
   */
  async install(skillName: string, scope: 'local' | 'global', agents: string[]): Promise<void> {
    const operationId = randomUUID()
    const args = ['install', '-s', skillName, '-a', ...agents]
    if (scope === 'global') {
      args.push('-g')
    }

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
    const operationId = randomUUID()
    const args = ['remove', '-s', skillName, '-a', ...agents]
    if (scope === 'global') {
      args.push('-g')
    }

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
    const operationId = randomUUID()
    const args = ['update', '-s', skillName]

    // Use workspace as CWD if available, else home directory
    let cwd: string
    if (vscode.workspace.workspaceFolders?.[0]) {
      cwd = vscode.workspace.workspaceFolders[0].uri.fsPath
    } else {
      cwd = process.env.HOME || process.env.USERPROFILE || '~'
    }
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
   * Handles job completed event from the queue.
   */
  private handleJobCompleted(result: JobResult): void {
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
    }
  }
}
