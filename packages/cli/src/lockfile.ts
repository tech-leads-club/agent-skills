import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

const AGENTS_DIR = '.agents'
const LOCK_FILE = '.skill-lock.json'
const CURRENT_VERSION = 1

export interface SkillLockEntry {
  name: string
  source: string
  installedAt: string
  updatedAt: string
}

export interface SkillLockFile {
  version: number
  skills: Record<string, SkillLockEntry>
}

function getSkillLockPath(): string {
  return join(homedir(), AGENTS_DIR, LOCK_FILE)
}

function createEmptyLockFile(): SkillLockFile {
  return { version: CURRENT_VERSION, skills: {} }
}

export async function readSkillLock(): Promise<SkillLockFile> {
  const lockPath = getSkillLockPath()

  try {
    const content = await readFile(lockPath, 'utf-8')
    const parsed = JSON.parse(content) as SkillLockFile
    if (typeof parsed.version !== 'number' || !parsed.skills) return createEmptyLockFile()
    return parsed
  } catch {
    return createEmptyLockFile()
  }
}

export async function writeSkillLock(lock: SkillLockFile): Promise<void> {
  const lockPath = getSkillLockPath()
  await mkdir(dirname(lockPath), { recursive: true })
  await writeFile(lockPath, JSON.stringify(lock, null, 2), 'utf-8')
}

export async function addSkillToLock(skillName: string, source: string = 'local'): Promise<void> {
  const lock = await readSkillLock()
  const now = new Date().toISOString()
  const existingEntry = lock.skills[skillName]

  lock.skills[skillName] = {
    name: skillName,
    source,
    installedAt: existingEntry?.installedAt ?? now,
    updatedAt: now,
  }

  await writeSkillLock(lock)
}

export async function removeSkillFromLock(skillName: string): Promise<boolean> {
  const lock = await readSkillLock()
  if (!(skillName in lock.skills)) return false
  delete lock.skills[skillName]
  await writeSkillLock(lock)
  return true
}

export async function getSkillFromLock(skillName: string): Promise<SkillLockEntry | null> {
  const lock = await readSkillLock()
  return lock.skills[skillName] ?? null
}

export async function getAllLockedSkills(): Promise<Record<string, SkillLockEntry>> {
  const lock = await readSkillLock()
  return lock.skills
}
