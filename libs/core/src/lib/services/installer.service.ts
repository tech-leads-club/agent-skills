import { join, relative, resolve } from 'node:path'

import { AGENTS_DIR, CANONICAL_SKILLS_DIR } from '../constants'
import type { CorePorts } from '../ports'
import type { AgentType, InstallOptions, InstallResult, RemoveOptions, RemoveResult, SkillInfo } from '../types'
import { isPathSafe, sanitizeName } from '../utils'

import { getAgentConfig } from './agents.service'
import { logAudit } from './audit-log.service'
import { isGloballyInstalled } from './global-path.service'
import { addSkillToLock, getSkillFromLock, removeAgentFromLock } from './lockfile.service'
import { findProjectRoot } from './project-root.service'
import { getCachedContentHash } from './registry.service'

const CANONICAL_SKILLS_PATH = join(AGENTS_DIR, CANONICAL_SKILLS_DIR)

type InstallMode = 'symlink-global' | 'symlink-local' | 'copy-global' | 'copy-local'

interface InstallContext {
  skill: SkillInfo
  config: ReturnType<typeof getAgentConfig>
  safeSkillName: string
  skillTargetPath: string
  projectRoot: string
}

const createSymlink = async (ports: CorePorts, target: string, linkPath: string): Promise<boolean> => {
  try {
    await cleanExistingPath(ports, linkPath, target)
    await ports.fs.mkdir(join(linkPath, '..'), { recursive: true })
    const relativePath = relative(join(linkPath, '..'), target)
    const type = ports.env.platform() === 'win32' ? 'junction' : undefined
    await ports.fs.symlink(relativePath, linkPath, type)
    return true
  } catch {
    return false
  }
}

const cleanExistingPath = async (ports: CorePorts, linkPath: string, target: string): Promise<void> => {
  try {
    const stats = await ports.fs.lstat(linkPath)
    if (stats.isSymbolicLink()) {
      const existingTarget = await ports.fs.readlink(linkPath)
      if (resolve(existingTarget) === resolve(target)) return
      await ports.fs.rm(linkPath)
    } else {
      await ports.fs.rm(linkPath, { recursive: true })
    }
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === 'ELOOP') await ports.fs.rm(linkPath, { force: true }).catch(() => {})
  }
}

const copySkillDirectory = async (ports: CorePorts, src: string, dest: string): Promise<void> => {
  await ports.fs.rm(dest, { recursive: true, force: true })
  await ports.fs.mkdir(join(dest, '..'), { recursive: true })
  await ports.fs.cp(src, dest, { recursive: true })
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

const installHandlers: Record<InstallMode, (ports: CorePorts, ctx: InstallContext) => Promise<InstallResult>> = {
  'symlink-global': async (ports, ctx) => {
    if (await createSymlink(ports, ctx.skill.path, ctx.skillTargetPath)) return createSuccessResult(ctx, 'symlink')
    await copySkillDirectory(ports, ctx.skill.path, ctx.skillTargetPath)
    return createSuccessResult(ctx, 'copy', { symlinkFailed: true })
  },

  'symlink-local': async (ports, ctx) => {
    const canonicalDir = join(ctx.projectRoot, CANONICAL_SKILLS_PATH, ctx.safeSkillName)
    await copySkillDirectory(ports, ctx.skill.path, canonicalDir)

    if (await createSymlink(ports, canonicalDir, ctx.skillTargetPath)) {
      return createSuccessResult(ctx, 'symlink', { usedGlobalSymlink: false })
    }

    await copySkillDirectory(ports, ctx.skill.path, ctx.skillTargetPath)
    return createSuccessResult(ctx, 'copy', { symlinkFailed: true })
  },

  'copy-global': async (ports, ctx) => {
    await copySkillDirectory(ports, ctx.skill.path, ctx.skillTargetPath)
    return createSuccessResult(ctx, 'copy')
  },

  'copy-local': async (ports, ctx) => {
    await copySkillDirectory(ports, ctx.skill.path, ctx.skillTargetPath)
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
  ports: CorePorts,
  skill: SkillInfo,
  agent: AgentType,
  targetDir: string,
  method: 'symlink' | 'copy',
  projectRoot: string,
  global: boolean,
): Promise<InstallResult> => {
  const config = getAgentConfig(ports, agent)
  const safeSkillName = sanitizeName(skill.name)
  const skillTargetPath = join(targetDir, safeSkillName)
  const ctx: InstallContext = { skill, config, safeSkillName, skillTargetPath, projectRoot }
  const validationError = validatePath(targetDir, skillTargetPath, projectRoot, global)

  if (validationError) return createErrorResult(ctx, method, validationError)

  try {
    const mode = getInstallMode(method, global)
    return await installHandlers[mode](ports, ctx)
  } catch (error) {
    return createErrorResult(ctx, method, error)
  }
}

/**
 * Installs one or more skills for the requested agents.
 *
 * @param ports - Core ports used for filesystem access, environment checks, and audit logging.
 * @param skills - Skills that should be installed.
 * @param options - Installation options including target agents, mode, and scope.
 * @returns Installation results for every agent and skill combination.
 *
 * @example
 * ```ts
 * const results = await installSkills(ports, [skill], {
 *   agents: ['claude-code'],
 *   method: 'copy',
 *   global: false,
 * })
 * ```
 */
export const installSkills = async (
  ports: CorePorts,
  skills: SkillInfo[],
  options: InstallOptions,
): Promise<InstallResult[]> => {
  const projectRoot = findProjectRoot(ports)
  const results: InstallResult[] = []

  for (const agent of options.agents) {
    const config = getAgentConfig(ports, agent)
    const targetDir = options.global ? config.globalSkillsDir : join(projectRoot, config.skillsDir)

    for (const skill of skills) {
      const result = await installSkillForAgent(
        ports,
        skill,
        agent,
        targetDir,
        options.method,
        projectRoot,
        options.global,
      )
      results.push(result)
      if (result.success) {
        await addSkillToLock(ports, skill.name, [agent], {
          source: 'local',
          contentHash: getCachedContentHash(ports, skill.name),
          method: options.method,
          global: options.global,
        })
      }
    }
  }

  await logAudit(ports, {
    action: 'install',
    skillName: skills.map((s) => s.name).join(', '),
    agents: options.agents.map((a) => getAgentConfig(ports, a).displayName),
    success: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    details: results.map((r) => ({
      skill: r.skill,
      agent: r.agent,
      success: r.success,
      error: r.error,
      path: r.path,
    })),
  })

  return results
}

/**
 * Lists installed skills for a single agent and scope.
 *
 * @param ports - Core ports used to resolve paths and read directory contents.
 * @param agent - Agent whose skills directory should be inspected.
 * @param global - Whether to inspect the global skills directory instead of the project-local one.
 * @returns Installed skill directory names, or an empty list when the directory does not exist.
 *
 * @example
 * ```ts
 * const installed = await listInstalledSkills(ports, 'claude-code', false)
 * ```
 */
export const listInstalledSkills = async (ports: CorePorts, agent: AgentType, global: boolean): Promise<string[]> => {
  const config = getAgentConfig(ports, agent)
  const targetDir = global ? config.globalSkillsDir : join(findProjectRoot(ports), config.skillsDir)

  try {
    const entries = await ports.fs.readdir(targetDir, { withFileTypes: true })
    return entries.filter((e) => e.isDirectory() || e.isSymbolicLink?.()).map((e) => e.name)
  } catch {
    return []
  }
}

/**
 * Checks whether a skill exists for a given agent.
 *
 * @param ports - Core ports used to resolve install paths and inspect the filesystem.
 * @param skillName - Canonical skill name to check.
 * @param agent - Agent whose install directory should be inspected.
 * @param options - Optional scope selector for global or local installs.
 * @returns `true` when the skill directory exists for the selected agent and scope.
 *
 * @example
 * ```ts
 * const installed = await isSkillInstalled(ports, 'accessibility', 'claude-code')
 * ```
 */
export const isSkillInstalled = async (
  ports: CorePorts,
  skillName: string,
  agent: AgentType,
  options: { global?: boolean } = {},
): Promise<boolean> => {
  const config = getAgentConfig(ports, agent)
  const safeSkillName = sanitizeName(skillName)
  const targetBase = options.global ? config.globalSkillsDir : join(findProjectRoot(ports), config.skillsDir)
  const skillDir = join(targetBase, safeSkillName)
  if (!isPathSafe(targetBase, skillDir)) return false

  try {
    await ports.fs.lstat(skillDir)
    return true
  } catch {
    return false
  }
}

/**
 * Resolves the expected install path for a skill and agent.
 *
 * @param ports - Core ports used to resolve project paths.
 * @param skillName - Canonical skill name.
 * @param agent - Agent that owns the destination directory.
 * @param options - Optional scope selector for global or local installs.
 * @returns The absolute install path for the skill.
 * @throws {Error} Throws when the sanitized skill name would resolve outside the allowed install directory.
 *
 * @example
 * ```ts
 * const path = getInstallPath(ports, 'accessibility', 'claude-code')
 * ```
 */
export const getInstallPath = (
  ports: CorePorts,
  skillName: string,
  agent: AgentType,
  options: { global?: boolean } = {},
): string => {
  const config = getAgentConfig(ports, agent)
  const safeSkillName = sanitizeName(skillName)
  const targetBase = options.global ? config.globalSkillsDir : join(findProjectRoot(ports), config.skillsDir)
  const installPath = join(targetBase, safeSkillName)

  if (!isPathSafe(targetBase, installPath)) {
    throw new Error('Invalid skill name: potential path traversal detected')
  }

  return installPath
}

/**
 * Resolves the canonical storage path used for copied local skill content.
 *
 * @param ports - Core ports used to resolve home and project directories.
 * @param skillName - Canonical skill name.
 * @param options - Optional scope selector for global or local canonical storage.
 * @returns The absolute canonical path for the skill.
 * @throws {Error} Throws when the sanitized skill name would resolve outside the canonical skills directory.
 *
 * @example
 * ```ts
 * const path = getCanonicalPath(ports, 'accessibility')
 * ```
 */
export const getCanonicalPath = (ports: CorePorts, skillName: string, options: { global?: boolean } = {}): string => {
  const safeSkillName = sanitizeName(skillName)
  const baseDir = options.global ? ports.env.homedir() : findProjectRoot(ports)
  const canonicalPath = join(baseDir, CANONICAL_SKILLS_PATH, safeSkillName)

  if (!isPathSafe(join(baseDir, CANONICAL_SKILLS_PATH), canonicalPath)) {
    throw new Error('Invalid skill name: potential path traversal detected')
  }

  return canonicalPath
}

/**
 * Removes an installed skill from one or more agents and updates the lockfile.
 *
 * @param ports - Core ports used for filesystem access, path resolution, and audit logging.
 * @param skillName - Canonical skill name to remove.
 * @param agents - Agents from which the skill should be removed.
 * @param options - Removal options controlling scope and forced cleanup behavior.
 * @returns Removal results for each requested agent.
 *
 * @example
 * ```ts
 * const results = await removeSkill(ports, 'accessibility', ['claude-code'])
 * ```
 */
export const removeSkill = async (
  ports: CorePorts,
  skillName: string,
  agents: AgentType[],
  options: RemoveOptions = {},
): Promise<RemoveResult[]> => {
  const safeSkillName = sanitizeName(skillName)
  const projectRoot = findProjectRoot(ports)
  let lockEntry = await getSkillFromLock(ports, skillName, true)
  if (!lockEntry) lockEntry = await getSkillFromLock(ports, skillName, false)

  if (!lockEntry && !options.force) {
    return agents.map((agent) => ({
      skill: skillName,
      agent: getAgentConfig(ports, agent).displayName,
      success: false,
      error: 'Skill not found in lockfile',
    }))
  }

  const internalResults = await Promise.all(
    agents.map(async (agent) => {
      const config = getAgentConfig(ports, agent)
      const localPath = join(projectRoot, config.skillsDir, safeSkillName)
      const globalPath = join(config.globalSkillsDir, safeSkillName)

      const pathsToTry =
        options.global === undefined ? [localPath, globalPath] : options.global ? [globalPath] : [localPath]

      let removed = false
      let removedLocal = false
      let removedGlobal = false
      let lastError: string | undefined

      for (const path of pathsToTry) {
        const isGlobalPath = path.startsWith(config.globalSkillsDir)
        const baseDir = isGlobalPath ? config.globalSkillsDir : join(projectRoot, config.skillsDir)

        if (!isPathSafe(baseDir, path)) {
          lastError = 'Security: Invalid removal path'
          continue
        }

        try {
          await ports.fs.lstat(path)
          await ports.fs.rm(path, { recursive: true, force: true })
          removed = true
          if (isGlobalPath) {
            removedGlobal = true
          } else {
            removedLocal = true
          }
        } catch (error) {
          const err = error as { code?: string; message?: string }
          if (err.code !== 'ENOENT' && !lastError) lastError = error instanceof Error ? error.message : String(error)
        }
      }

      return {
        skill: skillName,
        agent: config.displayName,
        success: removed,
        error: removed ? undefined : lastError || 'Skill not found',
        removedLocal,
        removedGlobal,
      }
    }),
  )

  for (const result of internalResults) {
    if (result.success) {
      const agentType = agents.find((a) => getAgentConfig(ports, a).displayName === result.agent)
      if (agentType) {
        if (result.removedLocal) {
          await removeAgentFromLock(ports, skillName, agentType, false).catch(() => {})
        }
        if (result.removedGlobal) {
          await removeAgentFromLock(ports, skillName, agentType, true).catch(() => {})
        }
      }
    }
  }

  const localLockEntryAfter = await getSkillFromLock(ports, skillName, false)
  const localHasRemainingAgents = (localLockEntryAfter?.agents?.length ?? 0) > 0
  const hadLocalRemoval = internalResults.some((r) => r.removedLocal)

  if (!localHasRemainingAgents && hadLocalRemoval && lockEntry?.method === 'symlink') {
    const canonicalPath = getCanonicalPath(ports, skillName, { global: false })
    await ports.fs.rm(canonicalPath, { recursive: true, force: true }).catch(() => {})
  }

  const results: RemoveResult[] = internalResults.map(({ skill, agent, success, error }) => ({
    skill,
    agent,
    success,
    ...(error && { error }),
  }))

  await logAudit(ports, {
    action: 'remove',
    skillName,
    agents: agents.map((a) => getAgentConfig(ports, a).displayName),
    success: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    forced: options.force,
    details: results.map((r) => ({
      skill: r.skill,
      agent: r.agent,
      success: r.success,
      error: r.error,
    })),
  })

  return results
}

/**
 * Re-exports the global installation check used by installer workflows.
 */
export { isGloballyInstalled }
