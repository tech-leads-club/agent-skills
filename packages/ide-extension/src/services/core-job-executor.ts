import type { CorePorts } from '@tech-leads-club/core'
import {
  detectInstalledAgents,
  ensureSkillDownloaded,
  getAllLockedSkills,
  getSkillMetadata,
  getSkillWithPath,
  getUpdatableSkills,
  installSkills,
  removeSkill,
} from '@tech-leads-club/core'
import type { AgentType } from '@tech-leads-club/core'
import type { JobResult, QueuedJob } from './operation-queue'

/**
 * Executes queued jobs by calling core services directly (no CLI subprocess).
 */
export class CoreJobExecutor {
  constructor(private readonly ports: CorePorts) {}

  async execute(job: QueuedJob): Promise<JobResult> {
    const meta = job.metadata
    const agents = (meta?.agents ?? []) as AgentType[]
    const skillNames = meta?.skillNames ?? [job.skillName]
    const scope = meta?.scope ?? 'local'
    const global = scope === 'global'
    const method = meta?.method ?? 'copy'

    switch (job.operation) {
      case 'install':
        return this.executeInstall(skillNames, agents, global, method, job)
      case 'remove':
        return this.executeRemove(skillNames, agents, global, job)
      case 'update':
        return this.executeUpdate(skillNames, agents, job)
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
  ): Promise<JobResult> {
    if (agents.length === 0 || skillNames.length === 0) {
      return {
        operationId: job.operationId,
        operation: 'install',
        skillName: job.skillName,
        status: 'error',
        errorMessage: 'No agents or skills specified',
        metadata: job.metadata,
      }
    }

    const skills: Array<{ name: string; description: string; path: string; category?: string }> = []
    for (const name of skillNames) {
      const skill = await getSkillWithPath(this.ports, name)
      if (!skill) {
        return {
          operationId: job.operationId,
          operation: 'install',
          skillName: name,
          status: 'error',
          errorMessage: `Skill not found or failed to download: ${name}`,
          metadata: job.metadata,
        }
      }
      skills.push(skill)
    }

    const results = await installSkills(this.ports, skills, {
      agents,
      method,
      global,
      skills: skillNames,
    })

    const failed = results.filter((r) => !r.success)
    if (failed.length > 0) {
      const msg = failed.map((r) => `${r.agent}: ${r.error}`).join('; ')
      return {
        operationId: job.operationId,
        operation: 'install',
        skillName: job.skillName,
        status: 'error',
        errorMessage: msg,
        metadata: job.metadata,
      }
    }

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
  ): Promise<JobResult> {
    if (agents.length === 0) {
      return {
        operationId: job.operationId,
        operation: 'remove',
        skillName: job.skillName,
        status: 'error',
        errorMessage: 'No agents specified',
        metadata: job.metadata,
      }
    }

    for (const skillName of skillNames) {
      const results = await removeSkill(this.ports, skillName, agents, { global })
      const failed = results.filter((r) => !r.success)
      if (failed.length > 0) {
        const msg = failed.map((r) => `${r.agent}: ${r.error}`).join('; ')
        return {
          operationId: job.operationId,
          operation: 'remove',
          skillName,
          status: 'error',
          errorMessage: msg,
          metadata: job.metadata,
        }
      }
    }

    return {
      operationId: job.operationId,
      operation: 'remove',
      skillName: job.skillName,
      status: 'completed',
      metadata: job.metadata,
    }
  }

  private async executeUpdate(skillNames: string[], agents: AgentType[], job: QueuedJob): Promise<JobResult> {
    let namesToUpdate: string[]
    if (skillNames.length === 0) {
      const local = await getAllLockedSkills(this.ports, false)
      const global = await getAllLockedSkills(this.ports, true)
      const allNames = [...new Set([...Object.keys(local), ...Object.keys(global)])]
      namesToUpdate = (await getUpdatableSkills(this.ports, allNames)).toUpdate
    } else {
      namesToUpdate = (await getUpdatableSkills(this.ports, skillNames)).toUpdate
    }

    if (namesToUpdate.length === 0) {
      return {
        operationId: job.operationId,
        operation: 'update',
        skillName: job.skillName,
        status: 'completed',
        metadata: job.metadata,
      }
    }

    const skills: Array<{ name: string; description: string; path: string; category?: string }> = []
    for (const name of namesToUpdate) {
      const path = await ensureSkillDownloaded(this.ports, name)
      const meta = await getSkillMetadata(this.ports, name)
      if (!path || !meta) continue
      skills.push({ name: meta.name, description: meta.description, path, category: meta.category })
    }

    if (skills.length === 0) {
      return {
        operationId: job.operationId,
        operation: 'update',
        skillName: job.skillName,
        status: 'error',
        errorMessage: 'No skills could be downloaded for update',
        metadata: job.metadata,
      }
    }

    const targetAgents = agents.length > 0 ? agents : detectInstalledAgents(this.ports)
    const results = await installSkills(this.ports, skills, {
      agents: targetAgents,
      method: 'copy',
      global: false,
      skills: namesToUpdate,
      forceUpdate: true,
      isUpdate: true,
    })

    const failed = results.filter((r) => !r.success)
    if (failed.length > 0) {
      const msg = failed.map((r) => `${r.agent}: ${r.error}`).join('; ')
      return {
        operationId: job.operationId,
        operation: 'update',
        skillName: job.skillName,
        status: 'error',
        errorMessage: msg,
        metadata: job.metadata,
      }
    }

    return {
      operationId: job.operationId,
      operation: 'update',
      skillName: job.skillName,
      status: 'completed',
      metadata: job.metadata,
    }
  }
}
