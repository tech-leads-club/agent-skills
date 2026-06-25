import { join } from 'node:path'

import type { CorePorts } from '../ports'
import type { AgentType, DiscoveredSkill, OrphanedSkill, SkillLockEntry } from '../types'

import { getAgentConfig, getAllAgentTypes } from './agents.service'
import { readSkillLock } from './lockfile.service'
import { findProjectRoot } from './project-root.service'

interface ScanOptions {
  includeGlobal: boolean
}

interface ScanResult {
  skills: DiscoveredSkill[]
  orphans: OrphanedSkill[]
}

async function listSkillDirectories(ports: CorePorts, dirPath: string): Promise<string[]> {
  if (!ports.fs.existsSync(dirPath)) return []
  try {
    const entries = await ports.fs.readdir(dirPath, { withFileTypes: true })
    return entries.filter((e) => e.isDirectory()).map((e) => e.name)
  } catch {
    return []
  }
}

function buildLockIndex(
  localSkills: Record<string, SkillLockEntry>,
  globalSkills: Record<string, SkillLockEntry>,
): Map<string, { entry: SkillLockEntry; location: 'local' | 'global' }[]> {
  const index = new Map<string, { entry: SkillLockEntry; location: 'local' | 'global' }[]>()

  for (const [name, entry] of Object.entries(localSkills)) {
    index.set(name, [{ entry, location: 'local' }])
  }
  for (const [name, entry] of Object.entries(globalSkills)) {
    const existing = index.get(name) ?? []
    existing.push({ entry, location: 'global' })
    index.set(name, existing)
  }

  return index
}

export async function scanInstalledSkills(ports: CorePorts, options: ScanOptions): Promise<ScanResult> {
  const allAgents = getAllAgentTypes()
  const projectRoot = findProjectRoot(ports)

  const localLock = await readSkillLock(ports, false)
  const globalLock = options.includeGlobal ? await readSkillLock(ports, true) : { version: 2, skills: {} }
  const lockIndex = buildLockIndex(localLock.skills, globalLock.skills)

  const skills: DiscoveredSkill[] = []
  const orphans: OrphanedSkill[] = []
  const seenOnDisk = new Set<string>()

  for (const agentType of allAgents) {
    const config = getAgentConfig(ports, agentType)

    const scans: { dirPath: string; location: 'local' | 'global' }[] = [
      { dirPath: join(projectRoot, config.skillsDir), location: 'local' },
    ]
    if (options.includeGlobal) {
      scans.push({ dirPath: config.globalSkillsDir, location: 'global' })
    }

    for (const { dirPath, location } of scans) {
      const skillNames = await listSkillDirectories(ports, dirPath)

      for (const name of skillNames) {
        const key = `${agentType}:${location}:${name}`
        seenOnDisk.add(key)

        const lockEntries = lockIndex.get(name)
        const matchingLock = lockEntries?.find(
          (l) => l.location === location && l.entry.agents?.includes(agentType),
        )

        const skill: DiscoveredSkill = {
          name,
          agent: agentType,
          location,
          path: join(dirPath, name),
          inLockfile: !!matchingLock,
          lockEntry: matchingLock?.entry,
          physicallyPresent: true,
        }
        skills.push(skill)

        if (!matchingLock) {
          orphans.push({ skillName: name, agent: agentType, location, path: join(dirPath, name) })
        }
      }
    }
  }

  addLockfileOnlySkills(skills, localLock.skills, 'local', allAgents, seenOnDisk, ports)
  if (options.includeGlobal) {
    addLockfileOnlySkills(skills, globalLock.skills, 'global', allAgents, seenOnDisk, ports)
  }

  return { skills, orphans }
}

function addLockfileOnlySkills(
  skills: DiscoveredSkill[],
  lockSkills: Record<string, SkillLockEntry>,
  location: 'local' | 'global',
  allAgents: AgentType[],
  seenOnDisk: Set<string>,
  ports: CorePorts,
): void {
  const projectRoot = findProjectRoot(ports)

  for (const [name, entry] of Object.entries(lockSkills)) {
    const agents = entry.agents ?? []
    for (const agent of agents) {
      if (!allAgents.includes(agent)) continue
      const key = `${agent}:${location}:${name}`
      if (seenOnDisk.has(key)) continue

      const config = getAgentConfig(ports, agent)
      const dirPath = location === 'local' ? join(projectRoot, config.skillsDir) : config.globalSkillsDir

      skills.push({
        name,
        agent,
        location,
        path: join(dirPath, name),
        inLockfile: true,
        lockEntry: entry,
        physicallyPresent: false,
      })
    }
  }
}
