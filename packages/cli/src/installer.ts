import { cp, lstat, mkdir, readdir, readlink, rm, symlink } from 'node:fs/promises'
import { homedir, platform } from 'node:os'
import { join, normalize, relative, resolve, sep } from 'node:path'

import { getAgentConfig } from './agents'
import { getGlobalSkillPath, isGloballyInstalled } from './global-path'
import { addSkillToLock, removeSkillFromLock } from './lockfile'
import { findProjectRoot } from './project-root'
import type { AgentType, InstallOptions, InstallResult, SkillInfo } from './types'

const AGENTS_SKILLS_DIR = join('.agents', 'skills')
const EXCLUDE_FILES = new Set(['README.md', 'metadata.json', 'SKILL.md'])

function sanitizeName(name: string): string {
  let sanitized = name.replace(/[/\\]/g, '')
  sanitized = sanitized.replace(/[\0:]/g, '')
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '')
  sanitized = sanitized.replace(/^\.+/, '')
  if (!sanitized || sanitized.length === 0) sanitized = 'unnamed-skill'
  return sanitized.substring(0, 255)
}

function isPathSafe(basePath: string, targetPath: string): boolean {
  const normalizedBase = normalize(resolve(basePath))
  const normalizedTarget = normalize(resolve(targetPath))
  return normalizedTarget.startsWith(normalizedBase + sep) || normalizedTarget === normalizedBase
}

async function createSymlink(target: string, linkPath: string): Promise<boolean> {
  try {
    try {
      const stats = await lstat(linkPath)
      if (stats.isSymbolicLink()) {
        const existingTarget = await readlink(linkPath)
        if (resolve(existingTarget) === resolve(target)) return true
        await rm(linkPath)
      } else {
        await rm(linkPath, { recursive: true })
      }
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === 'ELOOP') {
        try {
          await rm(linkPath, { force: true })
        } catch {
          // ignore
        }
      }
    }

    const linkDir = join(linkPath, '..')
    await mkdir(linkDir, { recursive: true })
    const relativePath = relative(linkDir, target)
    const type = platform() === 'win32' ? 'junction' : undefined
    await symlink(relativePath, linkPath, type)
    return true
  } catch {
    return false
  }
}

async function copyDirectory(src: string, dest: string): Promise<void> {
  await mkdir(dest, { recursive: true })
  const entries = await readdir(src, { withFileTypes: true })

  for (const entry of entries) {
    if (EXCLUDE_FILES.has(entry.name) || entry.name.startsWith('_')) continue
    const srcPath = join(src, entry.name)
    const destPath = join(dest, entry.name)

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath)
    } else {
      await cp(srcPath, destPath)
    }
  }
}

export async function installSkills(skills: SkillInfo[], options: InstallOptions): Promise<InstallResult[]> {
  const results: InstallResult[] = []
  const projectRoot = findProjectRoot()

  for (const agent of options.agents) {
    const config = getAgentConfig(agent)
    const targetDir = options.global ? config.globalSkillsDir : join(projectRoot, config.skillsDir)

    for (const skill of skills) {
      const result = await installSkillForAgent(skill, agent, targetDir, options.method, projectRoot, options.global)
      results.push(result)
      if (result.success) await addSkillToLock(skill.name, 'local')
    }
  }

  return results
}

async function installSkillForAgent(
  skill: SkillInfo,
  agent: AgentType,
  targetDir: string,
  method: 'symlink' | 'copy',
  projectRoot: string,
  global: boolean,
): Promise<InstallResult> {
  const config = getAgentConfig(agent)
  const safeSkillName = sanitizeName(skill.name)
  const skillTargetPath = join(targetDir, safeSkillName)

  if (!isPathSafe(targetDir, skillTargetPath) && !global) {
    if (!isPathSafe(projectRoot, skillTargetPath) && !global) {
      return {
        agent: config.displayName,
        skill: skill.name,
        path: skillTargetPath,
        method,
        success: false,
        error: 'Security: Invalid skill destination path',
      }
    }
  }

  try {
    if (method === 'symlink') {
      const globalSkillPath = getGlobalSkillPath(skill.name)

      if (globalSkillPath) {
        const success = await createSymlink(globalSkillPath, skillTargetPath)
        if (success) {
          return {
            agent: config.displayName,
            skill: skill.name,
            path: skillTargetPath,
            method,
            success: true,
            usedGlobalSymlink: true,
          }
        }
      }

      const canonicalDir = join(projectRoot, AGENTS_SKILLS_DIR, safeSkillName)
      await mkdir(canonicalDir, { recursive: true })
      await cp(skill.path, canonicalDir, { recursive: true })
      const symlinkCreated = await createSymlink(canonicalDir, skillTargetPath)

      if (!symlinkCreated) {
        try {
          await rm(skillTargetPath, { recursive: true, force: true })
        } catch {
          // ignore
        }

        await copyDirectory(skill.path, skillTargetPath)

        return {
          agent: config.displayName,
          skill: skill.name,
          path: skillTargetPath,
          method: 'copy',
          success: true,
          symlinkFailed: true,
        }
      }

      return {
        agent: config.displayName,
        skill: skill.name,
        path: skillTargetPath,
        method,
        success: true,
        usedGlobalSymlink: false,
      }
    } else {
      await copyDirectory(skill.path, skillTargetPath)
      return {
        agent: config.displayName,
        skill: skill.name,
        path: skillTargetPath,
        method,
        success: true,
      }
    }
  } catch (error) {
    return {
      agent: config.displayName,
      skill: skill.name,
      path: skillTargetPath,
      method,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function listInstalledSkills(agent: AgentType, global: boolean): Promise<string[]> {
  const config = getAgentConfig(agent)
  const targetDir = global ? config.globalSkillsDir : join(findProjectRoot(), config.skillsDir)

  try {
    const entries = await readdir(targetDir, { withFileTypes: true })
    return entries.filter((entry) => entry.isDirectory() || entry.isSymbolicLink()).map((entry) => entry.name)
  } catch {
    return []
  }
}

export async function isSkillInstalled(
  skillName: string,
  agent: AgentType,
  options: { global?: boolean } = {},
): Promise<boolean> {
  const config = getAgentConfig(agent)
  const safeSkillName = sanitizeName(skillName)
  const targetBase = options.global ? config.globalSkillsDir : join(findProjectRoot(), config.skillsDir)
  const skillDir = join(targetBase, safeSkillName)

  if (!isPathSafe(targetBase, skillDir)) return false

  try {
    await lstat(skillDir)
    return true
  } catch {
    return false
  }
}

export function getInstallPath(skillName: string, agent: AgentType, options: { global?: boolean } = {}): string {
  const config = getAgentConfig(agent)
  const safeSkillName = sanitizeName(skillName)
  const targetBase = options.global ? config.globalSkillsDir : join(findProjectRoot(), config.skillsDir)
  const installPath = join(targetBase, safeSkillName)

  if (!isPathSafe(targetBase, installPath)) {
    throw new Error('Invalid skill name: potential path traversal detected')
  }

  return installPath
}

export function getCanonicalPath(skillName: string, options: { global?: boolean } = {}): string {
  const safeSkillName = sanitizeName(skillName)
  const baseDir = options.global ? homedir() : findProjectRoot()
  const canonicalPath = join(baseDir, AGENTS_SKILLS_DIR, safeSkillName)

  if (!isPathSafe(join(baseDir, AGENTS_SKILLS_DIR), canonicalPath)) {
    throw new Error('Invalid skill name: potential path traversal detected')
  }

  return canonicalPath
}

export async function removeSkill(
  skillName: string,
  agents: AgentType[],
  options: { global?: boolean } = {},
): Promise<{ agent: string; success: boolean; error?: string }[]> {
  const results: { agent: string; success: boolean; error?: string }[] = []
  const safeSkillName = sanitizeName(skillName)
  const projectRoot = findProjectRoot()

  const canonicalPath = getCanonicalPath(skillName, options)
  try {
    await rm(canonicalPath, { recursive: true, force: true })
  } catch {
    // Ignore
  }

  for (const agent of agents) {
    const config = getAgentConfig(agent)
    const targetDir = options.global ? config.globalSkillsDir : join(projectRoot, config.skillsDir)
    const skillPath = join(targetDir, safeSkillName)

    try {
      await rm(skillPath, { recursive: true, force: true })
      results.push({ agent: config.displayName, success: true })
    } catch (error) {
      results.push({
        agent: config.displayName,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  await removeSkillFromLock(skillName)
  return results
}

export { isGloballyInstalled }
