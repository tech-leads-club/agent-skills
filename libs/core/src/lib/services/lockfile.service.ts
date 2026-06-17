import { dirname, join } from 'node:path'

import { z } from 'zod'

import { AGENTS_DIR, LOCK_FILE, LOCK_FILE_BACKUP } from '../constants'
import type { CorePorts } from '../ports'
import type { AgentType, SkillLockEntry, SkillLockFile } from '../types'
import { AGENT_TYPES } from '../types'

import { findProjectRoot } from './project-root.service'

const CURRENT_VERSION = 2

const AgentTypeSchema = z.enum(AGENT_TYPES as unknown as [string, ...string[]])

const SkillLockEntrySchema = z.object({
  name: z.string(),
  source: z.string(),
  contentHash: z.string().optional(),
  installedAt: z.string(),
  updatedAt: z.string(),
  agents: z.array(AgentTypeSchema).optional(),
  method: z.enum(['copy', 'symlink']).optional(),
  global: z.boolean().optional(),
  version: z.string().optional(),
})

const SkillLockFileSchema = z.object({
  version: z.number(),
  skills: z.record(z.string(), SkillLockEntrySchema),
})

function getSkillLockPath(ports: CorePorts, global: boolean): string {
  if (global) return join(ports.env.homedir(), AGENTS_DIR, LOCK_FILE)
  const projectRoot = findProjectRoot(ports)
  return join(projectRoot, AGENTS_DIR, LOCK_FILE)
}

function getBackupPath(ports: CorePorts, global: boolean): string {
  if (global) return join(ports.env.homedir(), AGENTS_DIR, LOCK_FILE_BACKUP)
  const projectRoot = findProjectRoot(ports)
  return join(projectRoot, AGENTS_DIR, LOCK_FILE_BACKUP)
}

function createEmptyLockFile(): SkillLockFile {
  return { version: CURRENT_VERSION, skills: {} }
}

function migrateLockFile(data: unknown): SkillLockFile {
  try {
    const parsed = SkillLockFileSchema.parse(data)

    if (parsed.version === 1) {
      return {
        version: CURRENT_VERSION,
        skills: Object.fromEntries(
          Object.entries(parsed.skills).map(([key, entry]) => [
            key,
            {
              ...entry,
              agents: (entry.agents || []) as AgentType[],
              method: entry.method || 'copy',
              global: entry.global ?? false,
            },
          ]),
        ),
      } as SkillLockFile
    }

    return parsed as SkillLockFile
  } catch {
    return createEmptyLockFile()
  }
}

/**
 * Reads and validates the shared skill lockfile.
 *
 * Missing, unreadable, or corrupted lockfiles resolve to an empty v2 lockfile
 * so consumers can recover gracefully without throwing.
 *
 * @param ports - Core ports that expose filesystem and environment access.
 * @param global - When `true`, reads the global lockfile in the user's home directory.
 * @returns The parsed lockfile, migrated to the current schema version when needed.
 *
 * @example
 * ```ts
 * const lock = await readSkillLock(ports)
 * ```
 */
export async function readSkillLock(ports: CorePorts, global = false): Promise<SkillLockFile> {
  const lockPath = getSkillLockPath(ports, global)

  try {
    const content = await ports.fs.readFile(lockPath, 'utf-8')
    const parsed = JSON.parse(content)
    return migrateLockFile(parsed)
  } catch {
    return createEmptyLockFile()
  }
}

/**
 * Writes the shared skill lockfile using a temporary file and backup copy.
 *
 * @param ports - Core ports that expose filesystem and environment access.
 * @param lock - Lockfile payload to persist.
 * @param global - When `true`, writes the global lockfile in the user's home directory.
 * @returns A promise that resolves when the lockfile has been written atomically.
 * @throws {unknown} Rethrows filesystem errors after attempting temp-file cleanup.
 *
 * @example
 * ```ts
 * await writeSkillLock(ports, lock)
 * ```
 */
export async function writeSkillLock(ports: CorePorts, lock: SkillLockFile, global = false): Promise<void> {
  const lockPath = getSkillLockPath(ports, global)
  const backupPath = getBackupPath(ports, global)
  const tempPath = `${lockPath}.tmp`

  try {
    try {
      const existing = await ports.fs.readFile(lockPath, 'utf-8')
      await ports.fs.writeFile(backupPath, existing, 'utf-8')
    } catch {
      // No existing file to back up.
    }

    await ports.fs.mkdir(dirname(lockPath), { recursive: true })
    await ports.fs.writeFile(tempPath, JSON.stringify(lock, null, 2), 'utf-8')
    await ports.fs.rename(tempPath, lockPath)
  } catch (error) {
    try {
      await ports.fs.rm(tempPath, { force: true })
    } catch {
      // Ignore cleanup errors.
    }

    throw error
  }
}

/**
 * Adds or updates a skill entry in the shared lockfile.
 *
 * @param ports - Core ports that expose filesystem and environment access.
 * @param skillName - Canonical skill name to persist.
 * @param agents - Agents currently associated with the skill.
 * @param options - Optional metadata persisted with the lock entry.
 * @returns A promise that resolves when the lockfile update has been persisted.
 *
 * @example
 * ```ts
 * await addSkillToLock(ports, 'accessibility', ['cursor'], { source: 'local' })
 * ```
 */
export async function addSkillToLock(
  ports: CorePorts,
  skillName: string,
  agents: AgentType[],
  options: {
    source?: string
    contentHash?: string
    method?: 'copy' | 'symlink'
    global?: boolean
    version?: string
  } = {},
): Promise<void> {
  const lock = await readSkillLock(ports, options.global)
  const now = new Date().toISOString()
  const existingEntry = lock.skills[skillName]
  const existingAgents = existingEntry?.agents || []
  const mergedAgents = Array.from(new Set([...existingAgents, ...agents]))

  lock.skills[skillName] = {
    name: skillName,
    source: options.source || 'local',
    contentHash: options.contentHash ?? existingEntry?.contentHash,
    installedAt: existingEntry?.installedAt ?? now,
    updatedAt: now,
    agents: mergedAgents,
    method: options.method || 'copy',
    global: options.global ?? false,
    version: options.version,
  }

  await writeSkillLock(ports, lock, options.global)
}

/**
 * Removes a specific agent from a skill entry in the shared lockfile.
 * Deletes the entire skill entry when no agents remain.
 *
 * @param ports - Core ports that expose filesystem and environment access.
 * @param skillName - Canonical skill name to update.
 * @param agent - Agent to remove from the skill entry.
 * @param global - When `true`, targets the global lockfile in the user's home directory.
 * @returns `true` when the agent was removed or the entry was deleted; otherwise `false`.
 *
 * @example
 * ```ts
 * const removed = await removeAgentFromLock(ports, 'accessibility', 'cursor')
 * ```
 */
export async function removeAgentFromLock(
  ports: CorePorts,
  skillName: string,
  agent: AgentType,
  global = false,
): Promise<boolean> {
  const lock = await readSkillLock(ports, global)
  const entry = lock.skills[skillName]
  if (!entry) return false

  const agents = entry.agents || []
  const updatedAgents = agents.filter((a) => a !== agent)

  if (updatedAgents.length === agents.length) {
    return false
  }

  if (updatedAgents.length === 0) {
    delete lock.skills[skillName]
  } else {
    lock.skills[skillName] = {
      ...entry,
      agents: updatedAgents,
      updatedAt: new Date().toISOString(),
    }
  }

  await writeSkillLock(ports, lock, global)
  return true
}

/**
 * Removes a skill entry from the shared lockfile.
 *
 * @deprecated Use removeAgentFromLock to remove specific agents, or call this only when removing all agents.
 * @param ports - Core ports that expose filesystem and environment access.
 * @param skillName - Canonical skill name to remove.
 * @param global - When `true`, targets the global lockfile in the user's home directory.
 * @returns `true` when the skill existed and was removed; otherwise `false`.
 *
 * @example
 * ```ts
 * const removed = await removeSkillFromLock(ports, 'accessibility')
 * ```
 */
export async function removeSkillFromLock(ports: CorePorts, skillName: string, global = false): Promise<boolean> {
  const lock = await readSkillLock(ports, global)
  if (!(skillName in lock.skills)) return false

  delete lock.skills[skillName]
  await writeSkillLock(ports, lock, global)
  return true
}

/**
 * Looks up a single skill entry in the shared lockfile.
 *
 * @param ports - Core ports that expose filesystem and environment access.
 * @param skillName - Canonical skill name to look up.
 * @param global - When `true`, reads from the global lockfile in the user's home directory.
 * @returns The matching lock entry or `null` when no entry exists.
 *
 * @example
 * ```ts
 * const entry = await getSkillFromLock(ports, 'accessibility')
 * ```
 */
export async function getSkillFromLock(
  ports: CorePorts,
  skillName: string,
  global = false,
): Promise<SkillLockEntry | null> {
  const lock = await readSkillLock(ports, global)
  return lock.skills[skillName] ?? null
}

/**
 * Returns all skill entries currently recorded in the shared lockfile.
 *
 * @param ports - Core ports that expose filesystem and environment access.
 * @param global - When `true`, reads from the global lockfile in the user's home directory.
 * @returns A record keyed by skill name containing all persisted lock entries.
 *
 * @example
 * ```ts
 * const skills = await getAllLockedSkills(ports)
 * ```
 */
export async function getAllLockedSkills(ports: CorePorts, global = false): Promise<Record<string, SkillLockEntry>> {
  const lock = await readSkillLock(ports, global)
  return lock.skills
}
