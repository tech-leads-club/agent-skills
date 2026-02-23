import { getAgentMetadata } from '@tech-leads-club/core'
import { access } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { AgentInstallInfo, AvailableAgent, InstalledSkillInfo, InstalledSkillsMap, Skill } from '../shared/types'
import type { LoggingService } from './logging-service'

/**
 * Agent configuration for skill directory scanning.
 * Sourced from the shared core agent metadata.
 */
export interface AgentScanConfig {
  name: string
  displayName: string
  company: string
  skillsDir: string // Relative to workspace root
  globalSkillsDir: string // Absolute path
}

/**
 * All agent configurations (local + global paths) referenced during scanning.
 */
export const AGENT_CONFIGS: AgentScanConfig[] = Object.values(getAgentMetadata(homedir())).map((agent) => ({
  name: agent.name,
  displayName: agent.displayName,
  company: agent.company,
  skillsDir: agent.skillsDir,
  globalSkillsDir: agent.globalSkillsDir,
}))

/**
 * Defines a specific scope and path to check for an installed skill.
 */
interface ScopeCheck {
  scope: 'local' | 'global'
  path: string
}

/**
 * Options used to filter the scan execution based on local/global presence.
 */
export interface ScanOptions {
  includeLocal: boolean
  includeGlobal: boolean
}

/**
 * Scans disk to build an InstalledSkillsMap reflecting which skills are installed
 * in which scopes, with per-agent granularity.
 */
export class InstalledSkillsScanner {
  /**
   * Creates a scanner instance.
   *
   * @param logger - Logging service used for scan diagnostics.
   */
  constructor(private readonly logger: LoggingService) {}

  /**
   * Scans all agent directories (local + global) for installed skills.
   * @param registrySkills List of known skills from the registry
   * @param workspaceRoot Workspace folder path (null if no workspace open)
   * @param options Scope filtering options (defaults to all)
   * @returns Map of skill name → installation metadata
   */
  async scan(
    registrySkills: Skill[],
    workspaceRoot: string | null,
    options: ScanOptions = { includeLocal: true, includeGlobal: true },
  ): Promise<InstalledSkillsMap> {
    this.logger.debug(
      `Scanning installed skills (workspace: ${workspaceRoot ?? 'none'}, local: ${options.includeLocal}, global: ${
        options.includeGlobal
      })`,
    )

    const map: InstalledSkillsMap = {}

    for (const skill of registrySkills) {
      const info = await this.scanSkill(skill.name, workspaceRoot, options)
      map[skill.name] = info.agents.length > 0 ? info : null
    }

    const installedCount = Object.values(map).filter((v) => v !== null).length
    this.logger.debug(`Scan complete: ${installedCount} skills installed`)

    return map
  }

  /**
   * Scans a single skill across all agents and scopes.
   *
   * @param skillName - Skill identifier to scan.
   * @param workspaceRoot - Workspace path used for local scope checks, or `null`.
   * @param options - Scope filtering options.
   * @returns Installation metadata aggregated across all agent configs.
   */
  private async scanSkill(
    skillName: string,
    workspaceRoot: string | null,
    options: ScanOptions,
  ): Promise<InstalledSkillInfo> {
    const agentResults: AgentInstallInfo[] = []
    let localAny = false
    let globalAny = false

    for (const config of AGENT_CONFIGS) {
      const agentInfo = await this.buildAgentInstallInfo(config, skillName, workspaceRoot, options)
      if (!agentInfo) continue

      localAny ||= agentInfo.local
      globalAny ||= agentInfo.global
      agentResults.push(agentInfo)
    }

    return {
      local: localAny,
      global: globalAny,
      agents: agentResults,
    }
  }

  /**
   * Builds per-agent installation metadata by checking local/global scopes.
   *
   * @param config - Agent directory configuration.
   * @param skillName - Skill identifier to scan.
   * @param workspaceRoot - Workspace path used for local scope checks, or `null`.
   * @param options - Scope filtering options.
   * @returns Agent install info when any installation/corruption exists; otherwise `null`.
   */
  private async buildAgentInstallInfo(
    config: AgentScanConfig,
    skillName: string,
    workspaceRoot: string | null,
    options: ScanOptions,
  ): Promise<AgentInstallInfo | null> {
    const scopeChecks = this.buildScopeChecks(config, skillName, workspaceRoot, options)
    let local = false
    let global = false
    let corrupted = false

    for (const check of scopeChecks) {
      const { installed, corrupted: checkCorrupted } = await this.evaluateScope(check)
      if (installed) {
        if (check.scope === 'local') local = true
        else global = true
      }
      if (checkCorrupted) {
        corrupted = true
      }
    }

    if (!local && !global && !corrupted) {
      return null
    }

    return {
      agent: config.name,
      displayName: config.displayName,
      local,
      global,
      corrupted,
    }
  }

  /**
   * Checks if a file exists using fs.promises.access (fast, no read).
   *
   * @param path - Absolute path to test.
   * @returns `true` when the path exists and is accessible.
   */
  private async checkExists(path: string): Promise<boolean> {
    try {
      await access(path)
      return true
    } catch {
      return false
    }
  }

  /**
   * Returns a list of agents detected on the system.
   * Checks if the agent's configuration directory exists locally or globally.
   *
   * @param workspaceRoot - Workspace path used for local agent detection, or `null`.
   * @returns Detected agents with id, display name, and company.
   */
  async getAvailableAgents(workspaceRoot: string | null): Promise<AvailableAgent[]> {
    const results: AvailableAgent[] = []

    for (const config of AGENT_CONFIGS) {
      const globalDir = join(config.globalSkillsDir, '..')
      const globalExists = await this.checkExists(globalDir)

      let localExists = false
      if (workspaceRoot) {
        const localDir = join(workspaceRoot, config.skillsDir, '..')
        localExists = await this.checkExists(localDir)
      }

      if (globalExists || localExists) {
        results.push({
          agent: config.name,
          displayName: config.displayName,
          company: config.company,
        })
      }
    }

    return results
  }

  /**
   * Returns all supported agents, regardless of local/global detection status.
   *
   * @returns Complete agent host catalog for selection UIs.
   */
  getAllAgents(): AvailableAgent[] {
    return AGENT_CONFIGS.map((config) => ({
      agent: config.name,
      displayName: config.displayName,
      company: config.company,
    }))
  }

  /**
   * Builds local/global scope checks for a given agent and skill.
   *
   * @param config - Agent directory configuration.
   * @param skillName - Skill identifier.
   * @param workspaceRoot - Workspace path used for local scope checks, or `null`.
   * @param options - Scope filtering options.
   * @returns Ordered list of scope checks to evaluate.
   */
  private buildScopeChecks(
    config: AgentScanConfig,
    skillName: string,
    workspaceRoot: string | null,
    options: ScanOptions,
  ): ScopeCheck[] {
    const checks: ScopeCheck[] = []
    if (workspaceRoot && options.includeLocal) {
      checks.push({ scope: 'local', path: join(workspaceRoot, config.skillsDir, skillName) })
    }
    if (options.includeGlobal) {
      checks.push({ scope: 'global', path: join(config.globalSkillsDir, skillName) })
    }
    return checks
  }

  /**
   * Evaluates installation and corruption state for a single scope path.
   *
   * @param check - Scope/path pair to evaluate.
   * @returns Installation/corruption flags for the checked scope.
   */
  private async evaluateScope(check: ScopeCheck): Promise<{ installed: boolean; corrupted: boolean }> {
    if (!(await this.checkExists(check.path))) {
      return { installed: false, corrupted: false }
    }

    const mdExists = await this.checkExists(join(check.path, 'SKILL.md'))
    return { installed: true, corrupted: !mdExists }
  }
}
