import { join, relative, resolve } from 'node:path'

import { AGENTS_DIR, CANONICAL_SKILLS_DIR } from '../constants'
import type { CorePorts } from '../ports'
import type { AgentType, InstallOptions, InstallResult, RemoveOptions, RemoveResult, SkillInfo } from '../types'
import { isPathSafe, sanitizeName } from '../utils'

import { getAgentConfig } from './agents.service'
import { logAudit } from './audit-log.service'
import { addSkillToLock, getSkillFromLock, removeSkillFromLock } from './lockfile.service'
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

const AGENT_SKILLS_DIRS: Record<AgentType, string> = {
  cursor: '.cursor/skills',
  'claude-code': '.claude/skills',
  'github-copilot': '.github/skills',
  windsurf: '.windsurf/skills',
  cline: '.cline/skills',
  aider: '.aider/skills',
  codex: '.codex/skills',
  gemini: '.gemini/skills',
  antigravity: '.agent/skills',
  roo: '.roo/skills',
  kilocode: '.kilocode/skills',
  trae: '.trae/skills',
  kiro: '.kiro/skills',
  'amazon-q': '.amazonq/skills',
  augment: '.augment/skills',
  tabnine: '.tabnine/skills',
  opencode: '.opencode/skills',
  sourcegraph: '.sourcegraph/skills',
  droid: '.factory/skills',
}

function getGlobalSkillsDir(agent: AgentType, homeDir: string): string {
  switch (agent) {
    case 'cursor':
      return join(homeDir, '.cursor/skills')
    case 'claude-code':
      return join(homeDir, '.claude/skills')
    case 'github-copilot':
      return join(homeDir, '.copilot/skills')
    case 'windsurf':
      return join(homeDir, '.codeium/windsurf/skills')
    case 'cline':
      return join(homeDir, '.cline/skills')
    case 'aider':
      return join(homeDir, '.aider/skills')
    case 'codex':
      return join(homeDir, '.codex/skills')
    case 'gemini':
      return join(homeDir, '.gemini/skills')
    case 'antigravity':
      return join(homeDir, '.gemini/antigravity/skills')
    case 'roo':
      return join(homeDir, '.roo/skills')
    case 'kilocode':
      return join(homeDir, '.kilocode/skills')
    case 'trae':
      return join(homeDir, '.trae/skills')
    case 'kiro':
      return join(homeDir, '.kiro/skills')
    case 'amazon-q':
      return join(homeDir, '.amazonq/skills')
    case 'augment':
      return join(homeDir, '.augment/skills')
    case 'tabnine':
      return join(homeDir, '.tabnine/skills')
    case 'opencode':
      return join(homeDir, '.config/opencode/skills')
    case 'sourcegraph':
      return join(homeDir, '.sourcegraph/skills')
    case 'droid':
      return join(homeDir, '.factory/skills')
  }
}

function getInstallBase(agent: AgentType, options: InstallOptions): string {
  if (options.global) {
    if (!options.homeDir) {
      throw new Error('homeDir is required to resolve global install paths')
    }

    return getGlobalSkillsDir(agent, options.homeDir)
  }

  if (!options.projectRoot) {
    throw new Error('projectRoot is required to resolve local install paths')
  }

  return join(options.projectRoot, AGENT_SKILLS_DIRS[agent])
}

function getCanonicalBase(options: InstallOptions): string {
  if (options.global) {
    if (!options.homeDir) {
      throw new Error('homeDir is required to resolve global canonical paths')
    }

    return options.homeDir
  }

  if (!options.projectRoot) {
    throw new Error('projectRoot is required to resolve local canonical paths')
  }

  return options.projectRoot
}

/**
 * Resolves the expected installation path for a skill and agent.
 *
 * This helper stays pure by requiring the path context to be provided in
 * `options`, instead of reading environment state directly.
 *
 * @param skillName - Canonical skill name to resolve.
 * @param agent - Agent that will receive the installed skill.
 * @param options - Install options containing the path context required for resolution.
 * @returns The absolute install path for the sanitized skill name.
 * @throws {Error} Throws when the resolved path escapes the allowed install base.
 *
 * @example
 * ```ts
 * const path = getInstallPath('accessibility', 'cursor', {
 *   global: false,
 *   method: 'copy',
 *   agents: ['cursor'],
 *   skills: ['accessibility'],
 *   projectRoot: '/workspace/project',
 * })
 * ```
 */
export function getInstallPath(skillName: string, agent: AgentType, options: InstallOptions): string {
  const safeSkillName = sanitizeName(skillName)
  const targetBase = getInstallBase(agent, options)
  const installPath = join(targetBase, safeSkillName)

  if (!isPathSafe(targetBase, installPath)) {
    throw new Error('Invalid skill name: potential path traversal detected')
  }

  return installPath
}

/**
 * Resolves the canonical source path for a skill.
 *
 * This helper stays pure by requiring the path context to be provided in
 * `options`, instead of reading environment state directly.
 *
 * @param skillName - Canonical skill name to resolve.
 * @param options - Install options containing the path context required for resolution.
 * @returns The absolute canonical path for the sanitized skill name.
 * @throws {Error} Throws when the resolved path escapes the allowed canonical base.
 *
 * @example
 * ```ts
 * const path = getCanonicalPath('accessibility', {
 *   global: false,
 *   method: 'copy',
 *   agents: ['cursor'],
 *   skills: ['accessibility'],
 *   projectRoot: '/workspace/project',
 * })
 * ```
 */
export function getCanonicalPath(skillName: string, options: InstallOptions): string {
  const safeSkillName = sanitizeName(skillName)
  const baseDir = getCanonicalBase(options)
  const canonicalBase = join(baseDir, CANONICAL_SKILLS_PATH)
  const canonicalPath = join(canonicalBase, safeSkillName)

  if (!isPathSafe(canonicalBase, canonicalPath)) {
    throw new Error('Invalid skill name: potential path traversal detected')
  }

  return canonicalPath
}

async function createSymlink(ports: CorePorts, target: string, linkPath: string): Promise<boolean> {
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

async function cleanExistingPath(ports: CorePorts, linkPath: string, target: string): Promise<void> {
  try {
    const stats = await ports.fs.lstat(linkPath)
    if (stats.isSymbolicLink()) {
      const existingTarget = await ports.fs.readlink(linkPath)
      if (resolve(existingTarget) === resolve(target)) return
      await ports.fs.rm(linkPath)
    } else {
      await ports.fs.rm(linkPath, { recursive: true })
    }
  } catch (error) {
    if ((error as { code?: string })?.code === 'ELOOP') {
      await ports.fs.rm(linkPath, { force: true }).catch(() => {})
    }
  }
}

async function copySkillDirectory(ports: CorePorts, src: string, dest: string): Promise<void> {
  await ports.fs.rm(dest, { recursive: true, force: true })
  await ports.fs.mkdir(join(dest, '..'), { recursive: true })
  await ports.fs.cp(src, dest, { recursive: true })
}

async function validateSymlinkTarget(ports: CorePorts, linkPath: string, baseDir: string): Promise<boolean> {
  try {
    const stats = await ports.fs.lstat(linkPath)
    if (stats.isSymbolicLink()) {
      const target = await ports.fs.readlink(linkPath)
      const resolvedTarget = resolve(join(linkPath, '..'), target)
      return isPathSafe(baseDir, resolvedTarget)
    }

    return true
  } catch {
    return true
  }
}

function getInstallMode(method: 'symlink' | 'copy', global: boolean): InstallMode {
  return `${method}-${global ? 'global' : 'local'}` as InstallMode
}

function createSuccessResult(
  ctx: InstallContext,
  method: 'symlink' | 'copy',
  extras: Partial<InstallResult> = {},
): InstallResult {
  return {
    agent: ctx.config.displayName,
    skill: ctx.skill.name,
    path: ctx.skillTargetPath,
    method,
    success: true,
    ...extras,
  }
}

function createErrorResult(ctx: InstallContext, method: 'symlink' | 'copy', error: unknown): InstallResult {
  return {
    agent: ctx.config.displayName,
    skill: ctx.skill.name,
    path: ctx.skillTargetPath,
    method,
    success: false,
    error: error instanceof Error ? error.message : String(error),
  }
}

const installHandlers: Record<InstallMode, (ports: CorePorts, ctx: InstallContext) => Promise<InstallResult>> = {
  'symlink-global': async (ports, ctx) => {
    if (await createSymlink(ports, ctx.skill.path, ctx.skillTargetPath)) {
      return createSuccessResult(ctx, 'symlink')
    }

    await copySkillDirectory(ports, ctx.skill.path, ctx.skillTargetPath)
    return createSuccessResult(ctx, 'copy', { symlinkFailed: true })
  },
  'symlink-local': async (ports, ctx) => {
    const canonicalDir = join(ctx.projectRoot, CANONICAL_SKILLS_DIR, ctx.safeSkillName)
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

function validatePath(targetDir: string, skillTargetPath: string, projectRoot: string, global: boolean): string | null {
  if (global) return null
  if (isPathSafe(targetDir, skillTargetPath)) return null
  if (isPathSafe(projectRoot, skillTargetPath)) return null
  return 'Security: Invalid skill destination path'
}

async function installSkillForAgent(
  ports: CorePorts,
  skill: SkillInfo,
  agent: AgentType,
  targetDir: string,
  method: 'symlink' | 'copy',
  projectRoot: string,
  global: boolean,
): Promise<InstallResult> {
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
 * Installs one or more skills into the requested agent directories.
 *
 * The orchestration remains faithful to the CLI installer: it resolves the
 * project root, installs per agent, updates the lockfile for successful
 * installs, and appends a best-effort audit entry when the batch finishes.
 *
 * @param ports - Core ports used for filesystem, environment, and dependent service access.
 * @param skills - Skills to install.
 * @param options - Installation options that control scope, method, and target agents.
 * @returns One install result per processed skill and agent pair.
 * @throws {Error} Propagates unexpected downstream errors that escape per-skill handling.
 *
 * @example
 * ```ts
 * const results = await installSkills(ports, [skill], {
 *   global: false,
 *   method: 'copy',
 *   agents: ['cursor'],
 *   skills: ['accessibility'],
 * })
 * ```
 */
export async function installSkills(
  ports: CorePorts,
  skills: SkillInfo[],
  options: InstallOptions,
): Promise<InstallResult[]> {
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
    skillName: skills.map((skill) => skill.name).join(', '),
    agents: options.agents.map((agent) => getAgentConfig(ports, agent).displayName),
    success: results.filter((result) => result.success).length,
    failed: results.filter((result) => !result.success).length,
    details: results.map((result) => ({
      skill: result.skill,
      agent: result.agent,
      success: result.success,
      error: result.error,
      path: result.path,
    })),
  })

  return results
}

/**
 * Removes a skill from the requested agent directories.
 *
 * The orchestration mirrors the CLI installer by checking the lockfile first,
 * removing the canonical path, cleaning local/global agent paths, updating the
 * lockfile when any removal succeeds, and appending a best-effort audit entry.
 *
 * @param ports - Core ports used for filesystem, environment, and dependent service access.
 * @param skillName - Canonical skill name to remove.
 * @param agents - Agents to remove the skill from.
 * @param options - Removal options controlling scope and force behavior.
 * @returns One removal result per requested agent.
 *
 * @example
 * ```ts
 * const results = await removeSkill(ports, 'accessibility', ['cursor'])
 * ```
 */
export async function removeSkill(
  ports: CorePorts,
  skillName: string,
  agents: AgentType[],
  options: RemoveOptions = {},
): Promise<RemoveResult[]> {
  const safeSkillName = sanitizeName(skillName)
  const projectRoot = findProjectRoot(ports)
  let lockEntry = await getSkillFromLock(ports, skillName, true)

  if (!lockEntry) {
    lockEntry = await getSkillFromLock(ports, skillName, false)
  }

  if (!lockEntry && !options.force) {
    return agents.map((agent) => ({
      skill: skillName,
      agent: getAgentConfig(ports, agent).displayName,
      success: false,
      error: 'Skill not found in lockfile',
    }))
  }

  const canonicalPath = getCanonicalPath(skillName, {
    global: options.global ?? false,
    method: 'copy',
    agents: [],
    skills: [],
    projectRoot,
    homeDir: ports.env.homedir(),
  })
  await ports.fs.rm(canonicalPath, { recursive: true, force: true }).catch(() => {})

  const results = await Promise.all(
    agents.map(async (agent) => {
      const config = getAgentConfig(ports, agent)
      const localPath = join(projectRoot, config.skillsDir, safeSkillName)
      const globalPath = join(config.globalSkillsDir, safeSkillName)

      const pathsToTry =
        options.global === undefined ? [localPath, globalPath] : options.global ? [globalPath] : [localPath]

      let removed = false
      let lastError: string | undefined

      for (const path of pathsToTry) {
        const baseDir = path.startsWith(config.globalSkillsDir)
          ? config.globalSkillsDir
          : join(projectRoot, config.skillsDir)

        if (!isPathSafe(baseDir, path)) {
          lastError = 'Security: Invalid removal path'
          continue
        }

        if (!(await validateSymlinkTarget(ports, path, baseDir))) {
          lastError = 'Security: Symlink points outside allowed directory'
          continue
        }

        try {
          await ports.fs.lstat(path)
          await ports.fs.rm(path, { recursive: true, force: true })
          removed = true
        } catch (error) {
          const typedError = error as { code?: string; message?: string }
          if (typedError.code !== 'ENOENT' && !lastError) {
            lastError = error instanceof Error ? error.message : String(error)
          }
        }
      }

      return {
        skill: skillName,
        agent: config.displayName,
        success: removed,
        error: removed ? undefined : lastError || 'Skill not found',
      }
    }),
  )

  if (results.some((result) => result.success)) {
    await removeSkillFromLock(ports, skillName, true).catch(() => {})
    await removeSkillFromLock(ports, skillName, false).catch(() => {})
  }

  await logAudit(ports, {
    action: 'remove',
    skillName,
    agents: agents.map((agent) => getAgentConfig(ports, agent).displayName),
    success: results.filter((result) => result.success).length,
    failed: results.filter((result) => !result.success).length,
    forced: options.force,
    details: results.map((result) => ({
      skill: result.skill,
      agent: result.agent,
      success: result.success,
      error: result.error,
    })),
  })

  return results
}
