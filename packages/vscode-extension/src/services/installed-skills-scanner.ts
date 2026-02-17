import { access } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { AgentInstallInfo, AvailableAgent, InstalledSkillInfo, InstalledSkillsMap, Skill } from '../shared/types'
import type { LoggingService } from './logging-service'

/**
 * Agent configuration for skill directory scanning.
 * Mirrors the structure from @tech-leads-club/core but defined inline
 * until the core package exports agent configs.
 */
export interface AgentScanConfig {
  name: string
  displayName: string
  skillsDir: string // Relative to workspace root
  globalSkillsDir: string // Absolute path
}

/**
 * All agent configurations (local + global paths) referenced during scanning.
 */
export const AGENT_CONFIGS: AgentScanConfig[] = [
  {
    name: 'cursor',
    displayName: 'Cursor',
    skillsDir: '.cursor/skills',
    globalSkillsDir: join(homedir(), '.cursor/skills'),
  },
  {
    name: 'claude-code',
    displayName: 'Claude Code',
    skillsDir: '.claude/skills',
    globalSkillsDir: join(homedir(), '.claude/skills'),
  },
  {
    name: 'github-copilot',
    displayName: 'GitHub Copilot',
    skillsDir: '.github/skills',
    globalSkillsDir: join(homedir(), '.copilot/skills'),
  },
  {
    name: 'windsurf',
    displayName: 'Windsurf',
    skillsDir: '.windsurf/skills',
    globalSkillsDir: join(homedir(), '.codeium/windsurf/skills'),
  },
  {
    name: 'cline',
    displayName: 'Cline',
    skillsDir: '.cline/skills',
    globalSkillsDir: join(homedir(), '.cline/skills'),
  },
  {
    name: 'aider',
    displayName: 'Aider',
    skillsDir: '.aider/skills',
    globalSkillsDir: join(homedir(), '.aider/skills'),
  },
  {
    name: 'codex',
    displayName: 'OpenAI Codex',
    skillsDir: '.codex/skills',
    globalSkillsDir: join(homedir(), '.codex/skills'),
  },
  {
    name: 'gemini',
    displayName: 'Gemini CLI',
    skillsDir: '.gemini/skills',
    globalSkillsDir: join(homedir(), '.gemini/skills'),
  },
  {
    name: 'antigravity',
    displayName: 'Antigravity',
    skillsDir: '.agent/skills',
    globalSkillsDir: join(homedir(), '.gemini/antigravity/global_skills'),
  },
  { name: 'roo', displayName: 'Roo Code', skillsDir: '.roo/skills', globalSkillsDir: join(homedir(), '.roo/skills') },
  {
    name: 'kilocode',
    displayName: 'Kilo Code',
    skillsDir: '.kilocode/skills',
    globalSkillsDir: join(homedir(), '.kilocode/skills'),
  },
  { name: 'trae', displayName: 'TRAE', skillsDir: '.trae/skills', globalSkillsDir: join(homedir(), '.trae/skills') },
  {
    name: 'amazon-q',
    displayName: 'Amazon Q',
    skillsDir: '.amazonq/skills',
    globalSkillsDir: join(homedir(), '.amazonq/skills'),
  },
  {
    name: 'augment',
    displayName: 'Augment',
    skillsDir: '.augment/skills',
    globalSkillsDir: join(homedir(), '.augment/skills'),
  },
  {
    name: 'tabnine',
    displayName: 'Tabnine',
    skillsDir: '.tabnine/skills',
    globalSkillsDir: join(homedir(), '.tabnine/skills'),
  },
  {
    name: 'opencode',
    displayName: 'OpenCode',
    skillsDir: '.opencode/skills',
    globalSkillsDir: join(homedir(), '.config/opencode/skills'),
  },
  {
    name: 'sourcegraph',
    displayName: 'Sourcegraph Cody',
    skillsDir: '.sourcegraph/skills',
    globalSkillsDir: join(homedir(), '.sourcegraph/skills'),
  },
  {
    name: 'droid',
    displayName: 'Droid (Factory.ai)',
    skillsDir: '.factory/skills',
    globalSkillsDir: join(homedir(), '.factory/skills'),
  },
]

interface ScopeCheck {
  scope: 'local' | 'global'
  path: string
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
   * @returns Map of skill name → installation metadata
   */
  async scan(registrySkills: Skill[], workspaceRoot: string | null): Promise<InstalledSkillsMap> {
    this.logger.debug(`Scanning installed skills (workspace: ${workspaceRoot ?? 'none'})`)

    const map: InstalledSkillsMap = {}

    for (const skill of registrySkills) {
      const info = await this.scanSkill(skill.name, workspaceRoot)
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
   * @returns Installation metadata aggregated across all agent configs.
   */
  private async scanSkill(skillName: string, workspaceRoot: string | null): Promise<InstalledSkillInfo> {
    const agentResults: AgentInstallInfo[] = []
    let localAny = false
    let globalAny = false

    for (const config of AGENT_CONFIGS) {
      const agentInfo = await this.buildAgentInstallInfo(config, skillName, workspaceRoot)
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
   * @returns Agent install info when any installation/corruption exists; otherwise `null`.
   */
  private async buildAgentInstallInfo(
    config: AgentScanConfig,
    skillName: string,
    workspaceRoot: string | null,
  ): Promise<AgentInstallInfo | null> {
    const scopeChecks = this.buildScopeChecks(config, skillName, workspaceRoot)
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
   * @returns Detected agents with id and display name.
   */
  async getAvailableAgents(workspaceRoot: string | null): Promise<AvailableAgent[]> {
    const results: AvailableAgent[] = []

    for (const config of AGENT_CONFIGS) {
      // Check global existence (parent of globalSkillsDir)
      // e.g. ~/.cursor/skills -> ~/.cursor
      const globalDir = join(config.globalSkillsDir, '..')
      const globalExists = await this.checkExists(globalDir)

      // Check local existence (parent of skillsDir)
      // e.g. .cursor/skills -> .cursor
      let localExists = false
      if (workspaceRoot) {
        const localDir = join(workspaceRoot, config.skillsDir, '..')
        localExists = await this.checkExists(localDir)
      }

      if (globalExists || localExists) {
        results.push({
          agent: config.name,
          displayName: config.displayName,
        })
      }
    }

    return results
  }

  /**
   * Builds local/global scope checks for a given agent and skill.
   *
   * @param config - Agent directory configuration.
   * @param skillName - Skill identifier.
   * @param workspaceRoot - Workspace path used for local scope checks, or `null`.
   * @returns Ordered list of scope checks to evaluate.
   */
  private buildScopeChecks(config: AgentScanConfig, skillName: string, workspaceRoot: string | null): ScopeCheck[] {
    const checks: ScopeCheck[] = []
    if (workspaceRoot) {
      checks.push({ scope: 'local', path: join(workspaceRoot, config.skillsDir, skillName) })
    }
    checks.push({ scope: 'global', path: join(config.globalSkillsDir, skillName) })
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
