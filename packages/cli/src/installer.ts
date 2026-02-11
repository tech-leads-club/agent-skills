import { cp, lstat, mkdir, readdir, readlink, rm, symlink } from 'node:fs/promises'
import { homedir, platform } from 'node:os'
import { join, normalize, relative, resolve, sep } from 'node:path'

import { getAgentConfig } from './agents'
import { isGloballyInstalled } from './global-path'
import { addSkillToLock, removeSkillFromLock } from './lockfile'
import { findProjectRoot } from './project-root'
import { getCachedContentHash } from './registry'
import type { AgentType, InstallOptions, InstallResult, SkillInfo } from './types'

const CANONICAL_SKILLS_DIR = join('.agents', 'skills')

type InstallMode = 'symlink-global' | 'symlink-local' | 'copy-global' | 'copy-local'

interface InstallContext {
  skill: SkillInfo
  config: ReturnType<typeof getAgentConfig>
  safeSkillName: string
  skillTargetPath: string
  projectRoot: string
}

const sanitizeName = (name: string): string => {
  const sanitized = name
    .replace(/[/\\]/g, '')
    .replace(/[\0:]/g, '')
    .replace(/^[.\s]+|[.\s]+$/g, '')
    .replace(/^\.+/, '')

  return (sanitized || 'unnamed-skill').substring(0, 255)
}

const isPathSafe = (basePath: string, targetPath: string): boolean => {
  const normalizedBase = normalize(resolve(basePath))
  const normalizedTarget = normalize(resolve(targetPath))
  return normalizedTarget.startsWith(normalizedBase + sep) || normalizedTarget === normalizedBase
}

const createSymlink = async (target: string, linkPath: string): Promise<boolean> => {
  try {
    await cleanExistingPath(linkPath, target)
    await mkdir(join(linkPath, '..'), { recursive: true })
    const relativePath = relative(join(linkPath, '..'), target)
    const type = platform() === 'win32' ? 'junction' : undefined
    await symlink(relativePath, linkPath, type)
    return true
  } catch {
    return false
  }
}

const cleanExistingPath = async (linkPath: string, target: string): Promise<void> => {
  try {
    const stats = await lstat(linkPath)
    if (stats.isSymbolicLink()) {
      const existingTarget = await readlink(linkPath)
      if (resolve(existingTarget) === resolve(target)) return
      await rm(linkPath)
    } else {
      await rm(linkPath, { recursive: true })
    }
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === 'ELOOP') {
      await rm(linkPath, { force: true }).catch(() => {})
    }
  }
}

const copySkillDirectory = async (src: string, dest: string): Promise<void> => {
  await rm(dest, { recursive: true, force: true })
  await cp(src, dest, { recursive: true })
}

const getInstallMode = (method: 'symlink' | 'copy', global: boolean): InstallMode =>
  `${method}-${global ? 'global' : 'local'}` as InstallMode

const createSuccessResult = (
  ctx: InstallContext,
  method: 'symlink' | 'copy',
  extras: Partial<InstallResult> = {},
): InstallResult => ({
  agent: ctx.config.displayName,
  skill: ctx.skill.name,
  path: ctx.skillTargetPath,
  method,
  success: true,
  ...extras,
})

const createErrorResult = (ctx: InstallContext, method: 'symlink' | 'copy', error: unknown): InstallResult => ({
  agent: ctx.config.displayName,
  skill: ctx.skill.name,
  path: ctx.skillTargetPath,
  method,
  success: false,
  error: error instanceof Error ? error.message : String(error),
})

const installHandlers: Record<InstallMode, (ctx: InstallContext) => Promise<InstallResult>> = {
  'symlink-global': async (ctx) => {
    if (await createSymlink(ctx.skill.path, ctx.skillTargetPath)) {
      return createSuccessResult(ctx, 'symlink')
    }

    await copySkillDirectory(ctx.skill.path, ctx.skillTargetPath)
    return createSuccessResult(ctx, 'copy', { symlinkFailed: true })
  },

  'symlink-local': async (ctx) => {
    const canonicalDir = join(ctx.projectRoot, CANONICAL_SKILLS_DIR, ctx.safeSkillName)
    await copySkillDirectory(ctx.skill.path, canonicalDir)

    if (await createSymlink(canonicalDir, ctx.skillTargetPath)) {
      return createSuccessResult(ctx, 'symlink', { usedGlobalSymlink: false })
    }

    await copySkillDirectory(ctx.skill.path, ctx.skillTargetPath)
    return createSuccessResult(ctx, 'copy', { symlinkFailed: true })
  },

  'copy-global': async (ctx) => {
    await copySkillDirectory(ctx.skill.path, ctx.skillTargetPath)
    return createSuccessResult(ctx, 'copy')
  },

  'copy-local': async (ctx) => {
    await copySkillDirectory(ctx.skill.path, ctx.skillTargetPath)
    return createSuccessResult(ctx, 'copy')
  },
}

const validatePath = (
  targetDir: string,
  skillTargetPath: string,
  projectRoot: string,
  global: boolean,
): string | null => {
  if (global) return null
  if (isPathSafe(targetDir, skillTargetPath)) return null
  if (isPathSafe(projectRoot, skillTargetPath)) return null
  return 'Security: Invalid skill destination path'
}

const installSkillForAgent = async (
  skill: SkillInfo,
  agent: AgentType,
  targetDir: string,
  method: 'symlink' | 'copy',
  projectRoot: string,
  global: boolean,
): Promise<InstallResult> => {
  const config = getAgentConfig(agent)
  const safeSkillName = sanitizeName(skill.name)
  const skillTargetPath = join(targetDir, safeSkillName)
  const ctx: InstallContext = { skill, config, safeSkillName, skillTargetPath, projectRoot }
  const validationError = validatePath(targetDir, skillTargetPath, projectRoot, global)

  if (validationError) {
    return createErrorResult(ctx, method, validationError)
  }

  try {
    const mode = getInstallMode(method, global)
    return await installHandlers[mode](ctx)
  } catch (error) {
    return createErrorResult(ctx, method, error)
  }
}

export const installSkills = async (skills: SkillInfo[], options: InstallOptions): Promise<InstallResult[]> => {
  const projectRoot = findProjectRoot()
  const results: InstallResult[] = []

  for (const agent of options.agents) {
    const config = getAgentConfig(agent)
    const targetDir = options.global ? config.globalSkillsDir : join(projectRoot, config.skillsDir)

    for (const skill of skills) {
      const result = await installSkillForAgent(skill, agent, targetDir, options.method, projectRoot, options.global)
      results.push(result)
      if (result.success) await addSkillToLock(skill.name, 'local', getCachedContentHash(skill.name))
    }
  }

  return results
}

export const listInstalledSkills = async (agent: AgentType, global: boolean): Promise<string[]> => {
  const config = getAgentConfig(agent)
  const targetDir = global ? config.globalSkillsDir : join(findProjectRoot(), config.skillsDir)

  try {
    const entries = await readdir(targetDir, { withFileTypes: true })
    return entries.filter((e) => e.isDirectory() || e.isSymbolicLink()).map((e) => e.name)
  } catch {
    return []
  }
}

export const isSkillInstalled = async (
  skillName: string,
  agent: AgentType,
  options: { global?: boolean } = {},
): Promise<boolean> => {
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

export const getInstallPath = (skillName: string, agent: AgentType, options: { global?: boolean } = {}): string => {
  const config = getAgentConfig(agent)
  const safeSkillName = sanitizeName(skillName)
  const targetBase = options.global ? config.globalSkillsDir : join(findProjectRoot(), config.skillsDir)
  const installPath = join(targetBase, safeSkillName)

  if (!isPathSafe(targetBase, installPath)) {
    throw new Error('Invalid skill name: potential path traversal detected')
  }

  return installPath
}

export const getCanonicalPath = (skillName: string, options: { global?: boolean } = {}): string => {
  const safeSkillName = sanitizeName(skillName)
  const baseDir = options.global ? homedir() : findProjectRoot()
  const canonicalPath = join(baseDir, CANONICAL_SKILLS_DIR, safeSkillName)

  if (!isPathSafe(join(baseDir, CANONICAL_SKILLS_DIR), canonicalPath)) {
    throw new Error('Invalid skill name: potential path traversal detected')
  }

  return canonicalPath
}

export const removeSkill = async (
  skillName: string,
  agents: AgentType[],
  options: { global?: boolean } = {},
): Promise<{ agent: string; success: boolean; error?: string }[]> => {
  const safeSkillName = sanitizeName(skillName)
  const projectRoot = findProjectRoot()

  await rm(getCanonicalPath(skillName, options), { recursive: true, force: true }).catch(() => {})

  const results = await Promise.all(
    agents.map(async (agent) => {
      const config = getAgentConfig(agent)
      const targetDir = options.global ? config.globalSkillsDir : join(projectRoot, config.skillsDir)
      const skillPath = join(targetDir, safeSkillName)

      try {
        await rm(skillPath, { recursive: true, force: true })
        return { agent: config.displayName, success: true }
      } catch (error) {
        return {
          agent: config.displayName,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        }
      }
    }),
  )

  await removeSkillFromLock(skillName)
  return results
}

export { isGloballyInstalled }
