import { randomUUID } from 'node:crypto'
import * as vscode from 'vscode'
import type {
  ActionRequest,
  ActionResultLine,
  ActionState,
  InstalledSkillInfo,
  LifecycleAction,
  LifecycleScope,
} from '../shared/types'
import { ActionMutex } from './action-mutex'
import type { InstalledStateStore } from './installed-state-store'
import type { LoggingService } from './logging-service'
import type { JobExecutor, JobProgressCallback, JobResult, QueuedJob } from './operation-queue'
import type { PostInstallVerifier } from './post-install-verifier'
import type { RegistryStore } from './registry-store'

interface ActionRunResult {
  accepted: boolean
  state: ActionState
}

interface PlannedJobSpec {
  operation: LifecycleAction
  skillName: string
  scope: LifecycleScope
  agents: string[]
  method?: 'copy' | 'symlink'
}

type ActionStateListener = (state: ActionState) => void

const CONCURRENT_ACTION_MESSAGE = 'Another action is already running. Wait for it to finish before starting a new one.'

const createIdleState = (): ActionState => ({
  status: 'idle',
  actionId: null,
  action: null,
  currentStep: null,
  errorMessage: null,
  request: null,
  results: [],
  logs: [],
  rejectionMessage: null,
})

export class ActionRunner implements vscode.Disposable {
  private state: ActionState = createIdleState()
  private readonly listeners = new Set<ActionStateListener>()

  constructor(
    private readonly executor: Pick<JobExecutor, 'execute'>,
    private readonly verifier: Pick<PostInstallVerifier, 'verify'>,
    private readonly installedStateStore: Pick<InstalledStateStore, 'getSnapshot' | 'refresh'>,
    private readonly registryStore: Pick<RegistryStore, 'getSnapshot'>,
    private readonly logger: Pick<LoggingService, 'debug' | 'error' | 'info' | 'warn'>,
    private readonly mutex = new ActionMutex(),
  ) {}

  public getState(): ActionState {
    return {
      ...this.state,
      request: this.state.request
        ? { ...this.state.request, agents: [...this.state.request.agents], skills: [...this.state.request.skills] }
        : null,
      results: this.state.results.map((result) => ({ ...result })),
      logs: this.state.logs.map((entry) => ({ ...entry })),
    }
  }

  public subscribe(listener: ActionStateListener): { dispose(): void } {
    this.listeners.add(listener)
    return {
      dispose: () => {
        this.listeners.delete(listener)
      },
    }
  }

  public async run(request: ActionRequest): Promise<ActionRunResult> {
    const actionId = randomUUID()
    const lease = this.mutex.acquire(actionId)

    if (!lease) {
      this.logger.warn(CONCURRENT_ACTION_MESSAGE)
      this.publishState({ ...this.state, rejectionMessage: CONCURRENT_ACTION_MESSAGE })
      return { accepted: false, state: this.getState() }
    }

    this.publishState({
      status: 'running',
      actionId,
      action: request.action,
      currentStep: `Starting ${request.action}`,
      errorMessage: null,
      request,
      results: [],
      logs: [],
      rejectionMessage: null,
    })

    try {
      const jobs = this.planJobs(actionId, request)
      if (jobs.length === 0) {
        this.completeAction(request, [this.createNoopResult(request)], null)
        return { accepted: true, state: this.getState() }
      }

      const results: ActionResultLine[] = []
      for (const job of jobs) {
        results.push(await this.executeJob(job))
      }

      await this.installedStateStore.refresh()
      const failedResults = results.filter((result) => !result.success)
      const errorMessage =
        failedResults.length > 0
          ? `Failed to ${request.action}: ${failedResults.map((result) => result.skillName).join(', ')}`
          : null

      this.completeAction(request, results, errorMessage)
      return { accepted: true, state: this.getState() }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown action execution error'
      this.logger.error(`Action ${request.action} failed`, error)
      await this.installedStateStore.refresh().catch(() => undefined)
      this.completeAction(request, [], message)
      return { accepted: true, state: this.getState() }
    } finally {
      lease.release()
    }
  }

  public dispose(): void {
    this.listeners.clear()
  }

  private planJobs(actionId: string, request: ActionRequest): QueuedJob[] {
    const specs = request.action === 'update' ? this.planUpdateJobs(request) : this.planLifecycleJobs(request)
    return specs.map((spec) => ({
      operationId: randomUUID(),
      operation: spec.operation,
      skillName: spec.skillName,
      metadata: {
        batchId: actionId,
        batchSize: specs.length,
        skillNames: [spec.skillName],
        scope: spec.scope,
        agents: spec.agents,
        method: spec.method,
      },
    }))
  }

  private planLifecycleJobs(request: ActionRequest): PlannedJobSpec[] {
    const scopes = request.scope === 'all' ? (['local', 'global'] as const) : [request.scope]
    return scopes.flatMap((scope) =>
      request.skills.map((skillName) => ({
        operation: request.action,
        skillName,
        scope,
        agents: [...request.agents],
        method: request.action === 'install' ? (request.method ?? 'copy') : undefined,
      })),
    )
  }

  private planUpdateJobs(request: ActionRequest): PlannedJobSpec[] {
    const registry = this.registryStore.getSnapshot().registry
    if (!registry) {
      throw new Error('Registry data is unavailable for update.')
    }

    const installedSkills = this.installedStateStore.getSnapshot().installedSkills
    const registryIndex = new Map(registry.skills.map((skill) => [skill.name, skill]))
    const candidateNames = request.skills.length > 0 ? request.skills : registry.skills.map((skill) => skill.name)
    const specs: PlannedJobSpec[] = []

    for (const skillName of candidateNames) {
      const skill = registryIndex.get(skillName)
      const installed = installedSkills[skillName]
      if (!skill?.contentHash || !installed) {
        continue
      }

      for (const scope of this.getOutdatedScopes(installed, skill.contentHash)) {
        const agents = installed.agents.filter((agent) => agent[scope]).map((agent) => agent.agent)
        if (agents.length === 0) {
          continue
        }

        specs.push({
          operation: 'update',
          skillName,
          scope,
          agents,
          method: 'copy',
        })
      }
    }

    return specs
  }

  private getOutdatedScopes(installed: InstalledSkillInfo, registryHash: string): LifecycleScope[] {
    const scopes: LifecycleScope[] = []

    for (const scope of ['local', 'global'] as const) {
      if (!installed[scope]) {
        continue
      }

      const installedHash = installed.scopeHashes?.[scope] ?? installed.contentHash
      if (installedHash !== registryHash || installedHash === undefined) {
        scopes.push(scope)
      }
    }

    return scopes
  }

  private async executeJob(job: QueuedJob): Promise<ActionResultLine> {
    const scope = job.metadata?.scope === 'global' ? 'global' : 'local'
    this.updateCurrentStep(`${this.capitalize(job.operation)} ${job.skillName} (${scope})`)

    try {
      const result = await this.executor.execute(job, this.createProgressHandler(job, scope))
      if (result.status === 'completed' && job.operation === 'install') {
        await this.verifyInstallation(job, scope)
      }

      return this.toResultLine(job, result, scope)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown action execution error'
      this.appendLog(job.operation as LifecycleAction, job.skillName, scope, errorMessage, 'error')
      return {
        skillName: job.skillName,
        operation: job.operation as LifecycleAction,
        scope,
        success: false,
        errorMessage,
      }
    }
  }

  private createProgressHandler(job: QueuedJob, scope: LifecycleScope): JobProgressCallback {
    return (message, severity = 'info') => {
      this.updateCurrentStep(message)
      this.appendLog(job.operation as LifecycleAction, job.skillName, scope, message, severity)
    }
  }

  private async verifyInstallation(job: QueuedJob, scope: LifecycleScope): Promise<void> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? null
    const verifyResult = await this.verifier.verify(job.skillName, job.metadata?.agents ?? [], scope, workspaceRoot)
    if (!verifyResult.ok) {
      this.logger.warn(`[${job.skillName}] Post-install verification failed`)
      this.appendLog('install', job.skillName, scope, 'Post-install verification reported corrupted files.', 'warn')
    }
  }

  private toResultLine(job: QueuedJob, result: JobResult, scope: LifecycleScope): ActionResultLine {
    return {
      skillName: job.skillName,
      operation: job.operation as LifecycleAction,
      scope,
      success: result.status === 'completed',
      errorMessage: result.errorMessage,
    }
  }

  private createNoopResult(request: ActionRequest): ActionResultLine {
    if (request.action === 'update') {
      return {
        skillName: 'all',
        operation: 'update',
        success: true,
        message:
          request.skills.length > 0
            ? 'Selected skills are already up to date.'
            : 'All installed skills are already up to date.',
      }
    }

    return {
      skillName: 'all',
      operation: request.action,
      success: true,
      message: 'Nothing to do.',
    }
  }

  private completeAction(request: ActionRequest, results: ActionResultLine[], errorMessage: string | null): void {
    this.publishState({
      ...this.state,
      status: 'completed',
      action: request.action,
      currentStep: errorMessage ? `Completed ${request.action} with errors` : `Completed ${request.action}`,
      errorMessage,
      request,
      results,
    })
  }

  private updateCurrentStep(currentStep: string): void {
    this.publishState({ ...this.state, currentStep })
  }

  private appendLog(
    operation: LifecycleAction,
    skillName: string,
    scope: LifecycleScope,
    message: string,
    severity: 'info' | 'warn' | 'error',
  ): void {
    this.publishState({
      ...this.state,
      logs: [...this.state.logs, { operation, skillName, scope, message, severity }],
    })
  }

  private publishState(state: ActionState): void {
    this.state = state
    for (const listener of this.listeners) {
      listener(this.getState())
    }
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1)
  }
}
