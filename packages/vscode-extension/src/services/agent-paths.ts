import { getAgentTopology } from '@tech-leads-club/core'
import { homedir } from 'node:os'

/**
 * Extension-facing projection of shared agent topology information.
 */
export interface AgentPathConfig {
  agent: string
  displayName: string
  company: string
  localSkillsDir: string
  globalSkillsDir: string
  localWatcherGlob: string
}

const AGENT_PATH_CONFIGS: AgentPathConfig[] = getAgentTopology(homedir()).map((entry) => ({
  agent: entry.name,
  displayName: entry.displayName,
  company: entry.company,
  localSkillsDir: entry.localSkillsDir,
  globalSkillsDir: entry.globalSkillsDir,
  localWatcherGlob: entry.localWatcherGlob,
}))

/**
 * Returns all supported agent path configurations consumed by extension services.
 *
 * @returns A stable list of local/global path configurations for every agent.
 */
export function getAgentPathConfigs(): AgentPathConfig[] {
  return AGENT_PATH_CONFIGS
}

/**
 * Finds a single agent path configuration by agent identifier.
 *
 * @param agentId - Agent identifier such as `cursor` or `claude-code`.
 * @returns Matching config when found; otherwise `undefined`.
 */
export function findAgentPathConfig(agentId: string): AgentPathConfig | undefined {
  return AGENT_PATH_CONFIGS.find((config) => config.agent === agentId)
}

/**
 * Returns all local watcher glob patterns derived from shared topology.
 *
 * @returns Local watcher glob patterns for every supported agent.
 *
 * @example
 * ```ts
 * const patterns = getLocalWatcherPatterns()
 * // patterns include '.cursor/skills' and other agent directories
 * ```
 */
export function getLocalWatcherPatterns(): string[] {
  return AGENT_PATH_CONFIGS.map((config) => config.localWatcherGlob)
}
