import { atom } from 'jotai'
import { unwrap } from 'jotai/utils'

import { detectInstalledAgents } from '../services/agents'
import { listInstalledSkills } from '../services/installer'
import type { AgentType } from '../types'

export type InstallationMap = Record<string, AgentType[]>

const fetchInstalledSkills = async (): Promise<InstallationMap> => {
  const agents = detectInstalledAgents()
  const status: InstallationMap = {}

  for (const agent of agents) {
    const [local, global] = await Promise.all([
      listInstalledSkills(agent, false).catch(() => []),
      listInstalledSkills(agent, true).catch(() => []),
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
