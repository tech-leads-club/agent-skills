import { randomUUID } from 'node:crypto'
import * as vscode from 'vscode'
import type {
  LifecycleBatchSelection,
  LifecycleScopeHint,
  OperationBatchMetadata,
  OperationType,
} from '../shared/types'
import type { CliInvocationPlan } from './batch-execution-planner'
import { getCliCapabilities, planBatch } from './batch-execution-planner'
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
  private activeOperations = new Map<string, vscode.CancellationTokenSource>()
  private progressResolvers = new Map<string, () => void>()
  private cliHealthy = true
  private readonly capabilities = getCliCapabilities()

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
   * Sets the CLI healthy state which restricts execution if false.
   *
   * @param healthy - True if the CLI is ready.
   */
  setCliHealthy(healthy: boolean): void {
    this.cliHealthy = healthy
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
  ): Promise<void> {
    if (!this.checkHealth()) return
    if (skills.length === 0) return

    const selection: LifecycleBatchSelection = {
      action: 'install',
      skills,
      agents,
      scope,
      source,
    }
    await this.executePlan(planBatch(selection, this.capabilities))
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
    if (!this.checkHealth()) return
    if (skills.length === 0) return

    const selection: LifecycleBatchSelection = {
      action: 'remove',
      skills,
      agents,
      scope,
      source,
    }
    await this.executePlan(planBatch(selection, this.capabilities))
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
    if (!this.checkHealth()) return

    const isUpdateAll = skills === 'all'
    const selection: LifecycleBatchSelection = {
      action: 'update',
      skills: isUpdateAll ? [] : skills,
      agents: [],
      scope: 'auto',
      source,
      updateAll: isUpdateAll,
    }
    await this.executePlan(planBatch(selection, this.capabilities))
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
    skills: string[],
    scope: 'local' | 'global' | 'all',
    agents: string[],
    source: 'card' | 'command-palette' = 'card',
  ): Promise<void> {
    if (!this.checkHealth()) return
    if (skills.length === 0) return

    const selection: LifecycleBatchSelection = {
      action: 'repair',
      skills,
      agents,
      scope,
      source,
    }
    await this.executePlan(planBatch(selection, this.capabilities))
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
    const cancelled = this.queue.cancel(operationId)
    if (cancelled) {
      const tokenSource = this.activeOperations.get(operationId)
      if (tokenSource) {
        tokenSource.cancel()
        this.activeOperations.delete(operationId)
      }
    }
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
    this.activeOperations.forEach((tokenSource) => tokenSource.dispose())
    this.activeOperations.clear()
  }

  /**
   * Checks if the CLI is ready for use, showing a warning otherwise.
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
   * Enqueues all invocations defined within a CLI invocation plan.
   *
   * @param plan - The evaluated invocation plan.
   */
  private async executePlan(plan: CliInvocationPlan): Promise<void> {
    for (const invocation of plan.invocations) {
      const operationId = randomUUID()
      const skillLabel = invocation.skillNames[0] ?? `${invocation.operation} (batch)`
      const job: QueuedJob = {
        operationId,
        operation: invocation.operation,
        skillName: skillLabel,
        args: invocation.args,
        cwd: this.getCwd(invocation.scope),
        metadata: {
          batchId: plan.batchId,
          batchSize: plan.invocations.length,
          skillNames: invocation.skillNames,
          scope: invocation.scope,
          agents: invocation.agents,
        },
      }

      this.logger.info(
        `[${operationId}] Enqueuing ${invocation.operation} batch=${plan.batchId} scope=${invocation.scope} skills=[${invocation.skillNames.join(', ')}] agents=[${invocation.agents.join(', ')}]`,
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
    this.showProgress(job)
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

    this.cleanupActiveOperation(result.operationId)
    await this.handleCompletionNotification(result)
  }

  /**
   * Initializes a VS Code progress notification for the job.
   *
   * @param job - The target job.
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
        title: this.getProgressMessage(job.operation),
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
   * Cleans up the active operation state and resolves progress.
   *
   * @param operationId - The target operation identifier.
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
   * Resolves the progress notification for a given operation.
   *
   * @param operationId - The target operation identifier.
   */
  private resolveProgress(operationId: string): void {
    const resolver = this.progressResolvers.get(operationId)
    if (resolver) {
      resolver()
      this.progressResolvers.delete(operationId)
    }
  }

  /**
   * Displays completion notifications and triggers post-install validation.
   *
   * @param result - Outcome of the completed job.
   */
  private async handleCompletionNotification(result: JobResult): Promise<void> {
    if (result.status === 'completed') {
      if ((result.operation === 'install' || result.operation === 'repair') && result.metadata) {
        const verified = await this.verifyInstallation(result, result.metadata)
        if (!verified) {
          return
        }
      }

      void vscode.window.showInformationMessage(this.getCompletionMessage(result.operation))
      return
    }

    if (result.status === 'error') {
      void vscode.window.showErrorMessage(
        this.getFailureMessage(result.operation, result.errorMessage ?? 'Unknown error'),
      )
    } else if (result.status === 'cancelled') {
      void vscode.window.showWarningMessage(this.getCancelledMessage(result.operation))
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

    const action = await vscode.window.showWarningMessage(
      `Skill '${result.skillName}' may be corrupted — SKILL.md not found in expected locations.`,
      'Repair',
    )

    if (action === 'Repair') {
      const repairScope: 'local' | 'global' = metadata.scope === 'local' ? 'local' : 'global'
      void this.repair(result.skillName, repairScope, metadata.agents)
    }

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
   * Resolves the working directory for an operation based on its target scope.
   *
   * @param scope - The installation scope hint.
   * @returns Absolute path to use as the working directory.
   */
  private getCwd(scope: LifecycleScopeHint): string {
    if (scope === 'local') {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
      if (!workspaceFolder) {
        throw new Error('No workspace folder open. Cannot install locally.')
      }
      return workspaceFolder.uri.fsPath
    }

    if (scope === 'global') {
      return process.env.HOME || process.env.USERPROFILE || '~'
    }

    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.env.HOME || process.env.USERPROFILE || '~'
  }

  /**
   * Gets the localized progress message for an operation type.
   *
   * @param operation - The operation type.
   * @returns Progress message string.
   */
  private getProgressMessage(operation: OperationType): string {
    switch (operation) {
      case 'install':
        return 'Installing skill(s)...'
      case 'remove':
        return 'Removing skill(s)...'
      case 'update':
        return 'Updating skill(s)...'
      case 'repair':
        return 'Repairing skill(s)...'
    }
  }

  /**
   * Gets the localized completion message for an operation type.
   *
   * @param operation - The operation type.
   * @returns Completion message string.
   */
  private getCompletionMessage(operation: OperationType): string {
    switch (operation) {
      case 'install':
        return '✓ Skill(s) installation completed'
      case 'remove':
        return '✓ Skill(s) removal completed'
      case 'update':
        return '✓ Skill(s) update completed'
      case 'repair':
        return '✓ Skill(s) repair completed'
    }
  }

  /**
   * Gets the localized failure message for an operation type.
   *
   * @param operation - The operation type.
   * @param error - The underlying error detail.
   * @returns Failure message string.
   */
  private getFailureMessage(operation: OperationType, error: string): string {
    switch (operation) {
      case 'install':
        return `✗ Skill(s) installation failed: ${error}`
      case 'remove':
        return `✗ Skill(s) removal failed: ${error}`
      case 'update':
        return `✗ Skill(s) update failed: ${error}`
      case 'repair':
        return `✗ Skill(s) repair failed: ${error}`
    }
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
