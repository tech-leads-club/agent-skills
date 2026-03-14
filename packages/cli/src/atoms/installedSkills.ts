import { atom } from 'jotai'
import { unwrap } from 'jotai/utils'
import { detectInstalledAgents, listInstalledSkills } from '@tech-leads-club/core'
import type { AgentType } from '@tech-leads-club/core'

import { ports } from '../ports'

export type InstallationMap = Record<string, AgentType[]>

const fetchInstalledSkills = async (): Promise<InstallationMap> => {
  const agents = detectInstalledAgents(ports)
  const status: InstallationMap = {}

  for (const agent of agents) {
    const [local, global] = await Promise.all([
      listInstalledSkills(ports, agent, false).catch(() => []),
      listInstalledSkills(ports, agent, true).catch(() => []),
    ])

    for (const skill of new Set([...local, ...global])) {
      if (!status[skill]) status[skill] = []
      if (!status[skill].includes(agent)) status[skill].push(agent)
    }
  }

  return status
}

export const installedSkillsRefreshAtom = atom(0)

const installedSkillsAsyncAtom = atom(async (get) => {
  get(installedSkillsRefreshAtom)
  return fetchInstalledSkills()
})

export const installedSkillsAtom = unwrap(installedSkillsAsyncAtom, (prev) => prev ?? {})
