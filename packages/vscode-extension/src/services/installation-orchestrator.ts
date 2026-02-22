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

export interface OperationEventHandler {
  (event: OperationEvent): void
}

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

export class InstallationOrchestrator implements vscode.Disposable {
  private eventHandlers: OperationEventHandler[] = []
  private activeOperations = new Map<string, vscode.CancellationTokenSource>()
  private progressResolvers = new Map<string, () => void>()
  private cliHealthy = true
  private readonly capabilities = getCliCapabilities()

  constructor(
    private readonly queue: OperationQueue,
    private readonly verifier: PostInstallVerifier,
    private readonly logger: LoggingService,
  ) {
    this.queue.onJobStarted((job) => this.handleJobStarted(job))
    this.queue.onJobCompleted((result) => this.handleJobCompleted(result))
    this.queue.onJobProgress((job, message) => this.handleJobProgress(job, message))
  }

  setCliHealthy(healthy: boolean): void {
    this.cliHealthy = healthy
  }

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

  async install(skillName: string, scope: 'local' | 'global', agents: string[]): Promise<void> {
    await this.installMany([skillName], scope, agents)
  }

  async remove(skillName: string, scope: 'local' | 'global', agents: string[]): Promise<void> {
    await this.removeMany([skillName], scope, agents)
  }

  async update(skillName: string): Promise<void> {
    await this.updateMany([skillName])
  }

  async repair(skillName: string, scope: 'local' | 'global', agents: string[]): Promise<void> {
    await this.repairMany([skillName], scope, agents)
  }

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

  onOperationEvent(handler: OperationEventHandler): void {
    this.eventHandlers.push(handler)
  }

  dispose(): void {
    this.queue.dispose()
    this.activeOperations.forEach((tokenSource) => tokenSource.dispose())
    this.activeOperations.clear()
  }

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

  private cleanupActiveOperation(operationId: string): void {
    const tokenSource = this.activeOperations.get(operationId)
    if (tokenSource) {
      tokenSource.dispose()
      this.activeOperations.delete(operationId)
    }
    this.resolveProgress(operationId)
  }

  private resolveProgress(operationId: string): void {
    const resolver = this.progressResolvers.get(operationId)
    if (resolver) {
      resolver()
      this.progressResolvers.delete(operationId)
    }
  }

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

  private emitEvent(event: OperationEvent): void {
    this.eventHandlers.forEach((handler) => handler(event))
  }

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
