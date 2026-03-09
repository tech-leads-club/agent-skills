import { join } from 'node:path'

import { z } from 'zod'

import { AGENTS_DIR, LOCK_FILE } from '../constants'
import type { CorePorts } from '../ports'
import type { AgentType, SkillLockFile } from '../types'
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
