import { join } from 'node:path'

import { AGENT_TEMPLATES } from './agents'
import type { AgentType } from './types'

/**
 * Canonical topology entry used by downstream packages to discover
 * local/global skill paths and local watcher globs for each supported agent.
 */
export interface AgentTopologyEntry {
  name: AgentType
  displayName: string
  company: string
  localSkillsDir: string
  globalSkillsDir: string
  localWatcherGlob: string
}

/**
 * Builds the canonical agent topology catalog from shared agent templates.
 *
 * @param homeDir - User home directory used to resolve global skill directories.
 * @returns A topology entry for every supported agent type.
 *
 * @example
 * ```ts
 * const topology = getAgentTopology('/home/alex')
 * const cursor = topology.find((entry) => entry.name === 'cursor')
 * // cursor?.localWatcherGlob includes '.cursor/skills'
 * ```
 */
export function getAgentTopology(homeDir: string): AgentTopologyEntry[] {
  return Object.values(AGENT_TEMPLATES).map((template) => ({
    name: template.name,
    displayName: template.displayName,
    company: template.company,
    localSkillsDir: template.skillsDir,
    globalSkillsDir: join(homeDir, template.globalSkillsDirRelative),
    localWatcherGlob: `**/${template.skillsDir}/**`,
  }))
}
