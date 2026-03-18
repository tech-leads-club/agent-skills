import type { AgentType, CorePorts, InstallResult } from '@tech-leads-club/core'
import {
  getAllLockedSkills,
  getSkillWithPath,
  getUpdatableSkills,
  installSkills,
  removeSkill,
} from '@tech-leads-club/core'
import type { JobProgressCallback, JobResult, QueuedJob } from './operation-queue'

/**
 * Executes queued jobs by calling core services directly (no CLI subprocess).
 */
export class CoreJobExecutor {
  constructor(private readonly ports: CorePorts) {}

  async execute(job: QueuedJob, onProgress?: JobProgressCallback): Promise<JobResult> {
    const meta = job.metadata
    const agents = (meta?.agents ?? []) as AgentType[]
    const skillNames = meta?.skillNames ?? [job.skillName]
    const scope = meta?.scope ?? 'local'
    const global = scope === 'global'
    const method = meta?.method ?? 'copy'

    switch (job.operation) {
      case 'install':
        return this.executeInstall(skillNames, agents, global, method, job, onProgress)
      case 'remove':
        return this.executeRemove(skillNames, agents, global, job, onProgress)
      case 'update':
        return this.executeUpdate(skillNames, job, onProgress)
      default:
        return {
          operationId: job.operationId,
          operation: job.operation,
          skillName: job.skillName,
          status: 'error',
          errorMessage: `Unsupported operation: ${job.operation}`,
          metadata: job.metadata,
        }
    }
  }

  private async executeInstall(
    skillNames: string[],
    agents: AgentType[],
    global: boolean,
    method: 'copy' | 'symlink',
    job: QueuedJob,
    onProgress?: JobProgressCallback,
  ): Promise<JobResult> {
    if (agents.length === 0 || skillNames.length === 0) {
      onProgress?.('No agents or skills specified', 'error')
      return {
        operationId: job.operationId,
        operation: 'install',
        skillName: job.skillName,
        status: 'error',
        errorMessage: 'No agents or skills specified',
        metadata: job.metadata,
      }
    }

    onProgress?.(`Downloading ${skillNames.length} skill(s)...`)
    const skills: Array<{ name: string; description: string; path: string; category?: string }> = []
    for (const name of skillNames) {
      const skill = await getSkillWithPath(this.ports, name)
      if (!skill) {
        const msg = `Skill not found or failed to download: ${name}`
        onProgress?.(msg, 'error')
        return {
          operationId: job.operationId,
          operation: 'install',
          skillName: name,
          status: 'error',
          errorMessage: msg,
          metadata: job.metadata,
        }
      }
      skills.push(skill)
      onProgress?.(`Downloaded ${name}`)
    }

    onProgress?.(`Installing to ${agents.length} agent(s)...`)
    const results = await installSkills(this.ports, skills, {
      agents,
      method,
      global,
      skills: skillNames,
    })

    const failed = results.filter((r) => !r.success)
    if (failed.length > 0) {
      const msg = failed.map((r) => `${r.agent}: ${r.error}`).join('; ')
      onProgress?.(msg, 'error')
      return {
        operationId: job.operationId,
        operation: 'install',
        skillName: job.skillName,
        status: 'error',
        errorMessage: msg,
        metadata: job.metadata,
      }
    }

    onProgress?.('Installation completed')
    return {
      operationId: job.operationId,
      operation: 'install',
      skillName: job.skillName,
      status: 'completed',
      metadata: job.metadata,
    }
  }

  private async executeRemove(
    skillNames: string[],
    agents: AgentType[],
    global: boolean,
    job: QueuedJob,
    onProgress?: JobProgressCallback,
  ): Promise<JobResult> {
    if (agents.length === 0) {
      onProgress?.('No agents specified', 'error')
      return {
        operationId: job.operationId,
        operation: 'remove',
        skillName: job.skillName,
        status: 'error',
        errorMessage: 'No agents specified',
        metadata: job.metadata,
      }
    }

    onProgress?.(`Removing ${skillNames.length} skill(s) from ${agents.length} agent(s)...`)
    for (const skillName of skillNames) {
      const results = await removeSkill(this.ports, skillName, agents, { global })
      const failed = results.filter((r) => !r.success)
      if (failed.length > 0) {
        const msg = failed.map((r) => `${r.agent}: ${r.error}`).join('; ')
        onProgress?.(msg, 'error')
        return {
          operationId: job.operationId,
          operation: 'remove',
          skillName,
          status: 'error',
          errorMessage: msg,
          metadata: job.metadata,
        }
      }
      onProgress?.(`Removed ${skillName}`)
    }

    onProgress?.('Removal completed')
    return {
      operationId: job.operationId,
      operation: 'remove',
      skillName: job.skillName,
      status: 'completed',
      metadata: job.metadata,
    }
  }

  private async executeUpdate(
    skillNames: string[],
    job: QueuedJob,
    onProgress?: JobProgressCallback,
  ): Promise<JobResult> {
    onProgress?.('Checking for updatable skills...')
    const meta = job.metadata

    const [localLock, globalLock] = await Promise.all([
      getAllLockedSkills(this.ports, false),
      getAllLockedSkills(this.ports, true),
    ])

    const candidates =
      skillNames.length > 0 ? skillNames : [...new Set([...Object.keys(localLock), ...Object.keys(globalLock)])]

    const { toUpdate } = await getUpdatableSkills(this.ports, candidates)

    if (toUpdate.length === 0) {
      onProgress?.('All skills are up to date')
      return {
        operationId: job.operationId,
        operation: 'update',
        skillName: job.skillName,
        status: 'completed',
        metadata: job.metadata,
      }
    }

    interface ScopedWork {
      name: string
      global: boolean
      method: 'copy' | 'symlink'
      agents: AgentType[]
    }

    // null = auto-detect from both lockfiles; false = local only; true = global only
    const scopeFilter = meta?.scope === 'local' ? false : meta?.scope === 'global' ? true : null

    const work: ScopedWork[] = []
    for (const name of toUpdate) {
      const localEntry = localLock[name]
      const globalEntry = globalLock[name]
      if (localEntry && scopeFilter !== true) {
        work.push({
          name,
          global: false,
          method: (localEntry.method ?? 'copy') as 'copy' | 'symlink',
          agents: (localEntry.agents ?? []) as AgentType[],
        })
      }
      if (globalEntry && scopeFilter !== false) {
        work.push({
          name,
          global: true,
          method: (globalEntry.method ?? 'copy') as 'copy' | 'symlink',
          agents: (globalEntry.agents ?? []) as AgentType[],
        })
      }
    }

    if (work.length === 0) {
      onProgress?.('All skills are up to date')
      return {
        operationId: job.operationId,
        operation: 'update',
        skillName: job.skillName,
        status: 'completed',
        metadata: job.metadata,
      }
    }

    onProgress?.(`Downloading ${toUpdate.length} skill(s) for update...`)
    const skillInfoMap = new Map<string, { name: string; description: string; path: string; category?: string }>()
    for (const name of toUpdate) {
      const skill = await getSkillWithPath(this.ports, name)
      if (skill) {
        skillInfoMap.set(name, skill)
        onProgress?.(`Downloaded ${name}`)
      }
    }

    if (skillInfoMap.size === 0) {
      const msg = 'No skills could be downloaded for update'
      onProgress?.(msg, 'error')
      return {
        operationId: job.operationId,
        operation: 'update',
        skillName: job.skillName,
        status: 'error',
        errorMessage: msg,
        metadata: job.metadata,
      }
    }

    onProgress?.('Installing updates...')
    const allResults: InstallResult[] = []
    for (const { name, global, method, agents } of work) {
      const skill = skillInfoMap.get(name)
      if (!skill || agents.length === 0) continue
      const results = await installSkills(this.ports, [skill], {
        agents,
        method,
        global,
        skills: [name],
        forceUpdate: true,
        isUpdate: true,
      })
      allResults.push(...results)
      onProgress?.(`Updated ${name} (${global ? 'global' : 'local'})`)
    }

    const failed = allResults.filter((r) => !r.success)
    if (failed.length > 0) {
      const msg = failed.map((r) => `${r.agent}: ${r.error}`).join('; ')
      onProgress?.(msg, 'error')
      return {
        operationId: job.operationId,
        operation: 'update',
        skillName: job.skillName,
        status: 'error',
        errorMessage: msg,
        metadata: job.metadata,
      }
    }

    onProgress?.('Update completed')
    return {
      operationId: job.operationId,
      operation: 'update',
      skillName: job.skillName,
      status: 'completed',
      metadata: job.metadata,
    }
  }
}
