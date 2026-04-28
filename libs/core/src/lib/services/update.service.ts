import type { CorePorts } from '../ports'
import type { InstallResult, SkillInfo } from '../types'

import { installSkills } from './installer.service'
import { readSkillLock } from './lockfile.service'
import { forceDownloadSkill, getSkillMetadata } from './registry.service'

/**
 * Updates skills by force-downloading fresh content from the remote registry and
 * reinstalling them to each agent and scope recorded in the lockfile.
 *
 * This is the correct update primitive: it both refreshes the local cache *and*
 * propagates the new content to every agent directory that previously received
 * the skill, preserving the original installation method (copy vs symlink) and scope
 * (local vs global) from the lockfile.
 *
 * @param ports - Core ports used for filesystem, HTTP, and environment access.
 * @param skillNames - Canonical skill names to update.
 * @returns Installation results for every agent/scope/skill combination updated.
 *          An empty array means the skill was not found in any lockfile; the cache
 *          was still refreshed.
 *
 * @example
 * ```ts
 * const results = await updateSkills(ports, ['tlc-spec-driven'])
 * const failed = results.filter((r) => !r.success)
 * ```
 */
export async function updateSkills(ports: CorePorts, skillNames: string[]): Promise<InstallResult[]> {
  const allResults: InstallResult[] = []

  for (const skillName of skillNames) {
    const freshPath = await forceDownloadSkill(ports, skillName)

    if (!freshPath) {
      allResults.push({
        agent: 'unknown',
        skill: skillName,
        path: '',
        method: 'copy',
        success: false,
        error: `Failed to download skill "${skillName}"`,
      })
      continue
    }

    const metadata = await getSkillMetadata(ports, skillName)
    const skillInfo: SkillInfo = {
      name: skillName,
      description: metadata?.description ?? '',
      path: freshPath,
      category: metadata?.category ?? '',
    }

    for (const global of [false, true] as const) {
      const lock = await readSkillLock(ports, global)
      const entry = lock.skills[skillName]
      if (!entry?.agents?.length) continue

      const results = await installSkills(ports, [skillInfo], {
        agents: entry.agents,
        method: entry.method ?? 'copy',
        global,
        skills: [skillName],
      })
      allResults.push(...results)
    }
  }

  return allResults
}
