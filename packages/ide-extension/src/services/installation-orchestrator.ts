import { randomUUID } from 'node:crypto'
import * as vscode from 'vscode'
import type {
  LifecycleBatchSelection,
  OperationBatchMetadata,
  OperationType,
} from '../shared/types'
import type { LoggingService } from './logging-service'
import type { JobResult, OperationQueue, QueuedJob } from './operation-queue'
import type { PostInstallVerifier } from './post-install-verifier'

/**
 * Handler function type for operation events.
 */
export interface OperationEventHandler {
  (event: OperationEvent): void
}

/**
 * Represents an event containing the state of a CLI batch or single operation.
 */
export interface OperationEvent {
  operationId: string
  operation: OperationType
  skillName: string
  type: 'started' | 'progress' | 'completed'
  message?: string
  success?: boolean
  errorMessage?: string
  metadata?: OperationBatchMetadata
}

/**
 * Service that orchestrates complex CLI operations and verifies post-install state.
 */
export class InstallationOrchestrator implements vscode.Disposable {
  private eventHandlers: OperationEventHandler[] = []

  /**
   * Creates an InstallationOrchestrator.
   *
   * @param queue - Backend operation queue.
   * @param verifier - Verifier to run after installations.
   * @param logger - Telemetry logger instance.
   */
  constructor(
    private readonly queue: OperationQueue,
    private readonly verifier: PostInstallVerifier,
    private readonly logger: LoggingService,
  ) {
    this.queue.onJobStarted((job) => this.handleJobStarted(job))
    this.queue.onJobCompleted((result) => this.handleJobCompleted(result))
    this.queue.onJobProgress((job, message) => this.handleJobProgress(job, message))
  }

  /**
   * Executes a batch install operation for multiple skills.
   *
   * @param skills - Target skills.
   * @param scope - Local, global, or all.
   * @param agents - Agent identifiers.
   * @param source - UI or command-palette trigger point.
   *
   * @example
   * ```typescript
   * await orchestrator.installMany(['my-skill'], 'local', ['agent1'], 'command-palette');
   * ```
   */
  async installMany(
    skills: string[],
    scope: 'local' | 'global' | 'all',
    agents: string[],
    source: 'card' | 'command-palette' = 'card',
    method: 'copy' | 'symlink' = 'copy',
  ): Promise<void> {
    if (skills.length === 0) return

    const selection: LifecycleBatchSelection = {
      action: 'install',
      skills,
      agents,
      scope,
      source,
      method,
    }
    await this.executeCorePlan(selection)
  }

  /**
   * Executes a batch remove operation for multiple skills.
   *
   * @param skills - Target skills.
   * @param scope - Local, global, or all.
   * @param agents - Agent identifiers.
   * @param source - UI or command-palette trigger point.
   *
   * @example
   * ```typescript
   * await orchestrator.removeMany(['my-skill'], 'global', ['agent1']);
   * ```
   */
  async removeMany(
    skills: string[],
    scope: 'local' | 'global' | 'all',
    agents: string[],
    source: 'card' | 'command-palette' = 'card',
  ): Promise<void> {
    if (skills.length === 0) return

    const selection: LifecycleBatchSelection = {
      action: 'remove',
      skills,
      agents,
      scope,
      source,
    }
    await this.executeCorePlan(selection)
  }

  /**
   * Executes a batch update operation for all or specific skills.
   *
   * @param skills - 'all' or specific skill identifiers.
   * @param source - UI or command-palette trigger point.
   *
   * @example
   * ```typescript
   * await orchestrator.updateMany('all');
   * await orchestrator.updateMany(['skill-1', 'skill-2']);
   * ```
   */
  async updateMany(skills: string[] | 'all', source: 'card' | 'command-palette' = 'card'): Promise<void> {
    const isUpdateAll = skills === 'all'
    const selection: LifecycleBatchSelection = {
      action: 'update',
      skills: isUpdateAll ? [] : skills,
      agents: [],
      scope: 'auto',
      source,
      updateAll: isUpdateAll,
    }
    await this.executeCorePlan(selection)
  }

  /**
   * Executes a batch repair operation for multiple skills.
   *
   * @param skills - Target skills.
   * @param scope - Local, global, or all.
   * @param agents - Agent identifiers.
   * @param source - UI or command-palette trigger point.
   *
   * @example
   * ```typescript
   * await orchestrator.repairMany(['my-skill'], 'local', ['agent1']);
   * ```
   */
  async repairMany(
    _skills: string[],
    _scope: 'local' | 'global' | 'all',
    _agents: string[],
    _source: 'card' | 'command-palette' = 'card',
  ): Promise<void> {
    this.logger.warn('Repair flow is deferred; use install to reinstall skills.')
  }

  /**
   * Helper to install a single skill.
   */
  async install(skillName: string, scope: 'local' | 'global', agents: string[]): Promise<void> {
    await this.installMany([skillName], scope, agents)
  }

  /**
   * Helper to remove a single skill.
   */
  async remove(skillName: string, scope: 'local' | 'global', agents: string[]): Promise<void> {
    await this.removeMany([skillName], scope, agents)
  }

  /**
   * Helper to update a single skill.
   */
  async update(skillName: string): Promise<void> {
    await this.updateMany([skillName])
  }

  /**
   * Helper to repair a single skill.
   */
  async repair(skillName: string, scope: 'local' | 'global', agents: string[]): Promise<void> {
    await this.repairMany([skillName], scope, agents)
  }

  /**
   * Cancels an active or pending operation by its identifier.
   *
   * @param operationId - The unique id of the operation.
   */
  cancel(operationId: string): void {
    this.logger.info(`[${operationId}] Cancelling operation`)
    this.queue.cancel(operationId)
  }

  /**
   * Subscribes a handler to operation lifecycle events.
   *
   * @param handler - Function invoked on operation events.
   */
  onOperationEvent(handler: OperationEventHandler): void {
    this.eventHandlers.push(handler)
  }

  /**
   * Cleans up all resources and cancels active operations.
   */
  dispose(): void {
    this.queue.dispose()
  }

  /**
   * Enqueues jobs for core-based execution from a batch selection.
   */
  private async executeCorePlan(selection: LifecycleBatchSelection): Promise<void> {
    const batchId = randomUUID()
    const { action, skills, agents = [], scope } = selection

    const scopes: Array<'local' | 'global'> =
      scope === 'all' ? ['local', 'global'] : scope === 'local' || scope === 'global' ? [scope] : ['local']

    if (action === 'update') {
      const operationId = randomUUID()
      const job: QueuedJob = {
        operationId,
        operation: 'update',
        skillName: skills[0] ?? 'all',
        metadata: {
          batchId,
          batchSize: 1,
          skillNames: skills,
          scope: 'local',
          agents,
        },
      }
      this.logger.info(`[${operationId}] Enqueuing update batch=${batchId} skills=[${skills.join(', ') || 'all'}]`)
      this.queue.enqueue(job)
      return
    }

    const installMethod = selection.method ?? 'copy'
    for (const scopeItem of scopes) {
      const operationId = randomUUID()
      const skillLabel = skills[0] ?? `${action} (batch)`
      const job: QueuedJob = {
        operationId,
        operation: action,
        skillName: skillLabel,
        metadata: {
          batchId,
          batchSize: scopes.length * (skills.length || 1),
          skillNames: skills,
          scope: scopeItem,
          agents,
          method: action === 'install' ? installMethod : undefined,
        },
      }

      this.logger.info(
        `[${operationId}] Enqueuing ${action} batch=${batchId} scope=${scopeItem} skills=[${skills.join(', ')}] agents=[${agents.join(', ')}]`,
      )
      this.queue.enqueue(job)
    }
  }

  /**
   * Handles the start of an enqueued job.
   *
   * @param job - The actively running job.
   */
  private handleJobStarted(job: QueuedJob): void {
    this.logger.info(`[${job.operationId}] Job started: ${job.operation} ${job.skillName}`)
    this.emitEvent({
      operationId: job.operationId,
      operation: job.operation,
      skillName: job.skillName,
      type: 'started',
      metadata: job.metadata,
    })
  }

  /**
   * Dispatches progress updates to listeners.
   *
   * @param job - Job emitting the update.
   * @param message - Status text.
   */
  private handleJobProgress(job: QueuedJob, message: string): void {
    this.emitEvent({
      operationId: job.operationId,
      operation: job.operation,
      skillName: job.skillName,
      type: 'progress',
      message,
      metadata: job.metadata,
    })
  }

  /**
   * Processes the completion or failure of a job execution.
   *
   * @param result - Outcome of the completed job.
   */
  private async handleJobCompleted(result: JobResult): Promise<void> {
    if (result.status === 'error') {
      const errorMessage = result.errorMessage ?? 'Unknown error'
      this.logger.error(
        `[${result.operationId}] Job completed: error ${result.operation} ${result.skillName} - ${errorMessage}`,
        result.error ?? errorMessage,
      )
    } else {
      this.logger.info(`[${result.operationId}] Job completed: ${result.status}`)
    }

    this.emitEvent({
      operationId: result.operationId,
      operation: result.operation,
      skillName: result.skillName,
      type: 'completed',
      success: result.status === 'completed',
      errorMessage: result.errorMessage,
      metadata: result.metadata,
    })

    await this.handleCompletionNotification(result)
  }

  /**
   * Handles completion: post-install verification for install/repair.
   * Sidebar flow consolidates feedback in Status page; no IDE notifications for batch ops.
   *
   * @param result - Outcome of the completed job.
   */
  private async handleCompletionNotification(result: JobResult): Promise<void> {
    if (result.status === 'completed') {
      if ((result.operation === 'install' || result.operation === 'repair') && result.metadata) {
        await this.verifyInstallation(result, result.metadata)
      }
      return
    }

    if (result.status === 'error' || result.status === 'cancelled') {
      this.logger.info(
        `[${result.operationId}] ${result.status}: ${result.errorMessage ?? this.getCancelledMessage(result.operation)}`,
      )
    }
  }

  /**
   * Verifies that the skill artifacts are correctly placed post-installation.
   *
   * @param result - Outcome of the job.
   * @param metadata - Batch metadata containing scope and targets.
   * @returns `true` if verification passes, `false` otherwise.
   */
  private async verifyInstallation(result: JobResult, metadata: OperationBatchMetadata): Promise<boolean> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || null
    const scope: 'local' | 'global' = metadata.scope === 'local' ? 'local' : 'global'
    const verifyResult = await this.verifier.verify(result.skillName, metadata.agents, scope, workspaceRoot)

    if (verifyResult.ok) {
      return true
    }

    this.logger.warn(
      `[${result.operationId}] Post-install verification failed: ${JSON.stringify(verifyResult.corrupted)}`,
    )
    return false
  }

  /**
   * Emits an operation event to all registered handlers.
   *
   * @param event - The event to emit.
   */
  private emitEvent(event: OperationEvent): void {
    this.eventHandlers.forEach((handler) => handler(event))
  }

  /**
   * Gets the localized cancellation message for an operation type.
   *
   * @param operation - The operation type.
   * @returns Cancellation message string.
   */
  private getCancelledMessage(operation: OperationType): string {
    switch (operation) {
      case 'install':
        return '⊘ Skill(s) installation cancelled'
      case 'remove':
        return '⊘ Skill(s) removal cancelled'
      case 'update':
        return '⊘ Skill(s) update cancelled'
      case 'repair':
        return '⊘ Skill(s) repair cancelled'
    }
  }
}
