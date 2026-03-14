import { join } from 'node:path'

import { AGENTS_DIR, CANONICAL_SKILLS_DIR } from '../constants'
import type { AgentType, InstallOptions } from '../types'
import { isPathSafe, sanitizeName } from '../utils'

const CANONICAL_SKILLS_PATH = join(AGENTS_DIR, CANONICAL_SKILLS_DIR)

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
