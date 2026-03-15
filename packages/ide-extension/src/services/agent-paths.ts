import type { CorePorts } from '@tech-leads-club/core'
import { getAllAgentTypes, getAgentConfig } from '@tech-leads-club/core'

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

/**
 * Builds agent path configs from core's agent definitions.
 *
 * @param ports - Core ports for path resolution.
 * @returns Stable list of local/global path configurations for every agent.
 */
export function getAgentPathConfigs(ports: CorePorts): AgentPathConfig[] {
  const agentTypes = getAllAgentTypes()
  return agentTypes.map((type) => {
    const config = getAgentConfig(ports, type)
    return {
      agent: config.name,
      displayName: config.displayName,
      company: '',
      localSkillsDir: config.skillsDir,
      globalSkillsDir: config.globalSkillsDir,
      localWatcherGlob: `${config.skillsDir}/**`,
    }
  })
}

/**
 * Finds a single agent path configuration by agent identifier.
 *
 * @param ports - Core ports for path resolution.
 * @param agentId - Agent identifier such as `cursor` or `claude-code`.
 * @returns Matching config when found; otherwise `undefined`.
 */
export function findAgentPathConfig(ports: CorePorts, agentId: string): AgentPathConfig | undefined {
  const configs = getAgentPathConfigs(ports)
  return configs.find((config) => config.agent === agentId)
}

/**
 * Returns all local watcher glob patterns derived from agent topology.
 *
 * @param ports - Core ports for path resolution.
 * @returns Local watcher glob patterns for every supported agent.
 */
export function getLocalWatcherPatterns(ports: CorePorts): string[] {
  return getAgentPathConfigs(ports).map((config) => config.localWatcherGlob)
}
