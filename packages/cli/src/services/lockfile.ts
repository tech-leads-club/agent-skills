import { AGENT_TYPES } from '@tech-leads-club/core'
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { z } from 'zod'

import type { AgentType } from '../types'
import { findProjectRoot } from './project-root'

const AGENTS_DIR = '.agents'
const LOCK_FILE = '.skill-lock.json'
const LOCK_FILE_BACKUP = '.skill-lock.json.backup'
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

export interface SkillLockEntry {
  name: string
  source: string
  contentHash?: string
  installedAt: string
  updatedAt: string
  agents?: AgentType[]
  method?: 'copy' | 'symlink'
  global?: boolean
  version?: string
}

export interface SkillLockFile {
  version: number
  skills: Record<string, SkillLockEntry>
}

function getSkillLockPath(global: boolean): string {
  if (global) return join(homedir(), AGENTS_DIR, LOCK_FILE)
  const projectRoot = findProjectRoot()
  return join(projectRoot, AGENTS_DIR, LOCK_FILE)
}

function getBackupPath(global: boolean): string {
  if (global) return join(homedir(), AGENTS_DIR, LOCK_FILE_BACKUP)
  const projectRoot = findProjectRoot()
  return join(projectRoot, AGENTS_DIR, LOCK_FILE_BACKUP)
}

function createEmptyLockFile(): SkillLockFile {
  return { version: CURRENT_VERSION, skills: {} }
}

// Migrate old lockfile format to new format
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

export async function readSkillLock(global = false): Promise<SkillLockFile> {
  const lockPath = getSkillLockPath(global)

  try {
    const content = await readFile(lockPath, 'utf-8')
    const parsed = JSON.parse(content)
    return migrateLockFile(parsed)
  } catch {
    return createEmptyLockFile()
  }
}

export async function writeSkillLock(lock: SkillLockFile, global = false): Promise<void> {
  const lockPath = getSkillLockPath(global)
  const backupPath = getBackupPath(global)
  const tempPath = `${lockPath}.tmp`

  try {
    try {
      const existing = await readFile(lockPath, 'utf-8')
      await writeFile(backupPath, existing, 'utf-8')
    } catch {
      // No existing file to backup
    }

    await mkdir(dirname(lockPath), { recursive: true })
    await writeFile(tempPath, JSON.stringify(lock, null, 2), 'utf-8')
    await rename(tempPath, lockPath)
  } catch (error) {
    try {
      await unlink(tempPath)
    } catch {
      // Ignore cleanup errors
    }
    throw error
  }
}

export async function addSkillToLock(
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
  const lock = await readSkillLock(options.global)
  const now = new Date().toISOString()
  const existingEntry = lock.skills[skillName]

  lock.skills[skillName] = {
    name: skillName,
    source: options.source || 'local',
    contentHash: options.contentHash ?? existingEntry?.contentHash,
    installedAt: existingEntry?.installedAt ?? now,
    updatedAt: now,
    agents: agents,
    method: options.method || 'copy',
    global: options.global ?? false,
    version: options.version,
  }

  await writeSkillLock(lock, options.global)
}

export async function removeSkillFromLock(skillName: string, global = false): Promise<boolean> {
  const lock = await readSkillLock(global)
  if (!(skillName in lock.skills)) return false
  delete lock.skills[skillName]
  await writeSkillLock(lock, global)
  return true
}

export async function getSkillFromLock(skillName: string, global = false): Promise<SkillLockEntry | null> {
  const lock = await readSkillLock(global)
  return lock.skills[skillName] ?? null
}

export async function getAllLockedSkills(global = false): Promise<Record<string, SkillLockEntry>> {
  const lock = await readSkillLock(global)
  return lock.skills
}
