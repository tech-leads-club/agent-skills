import { cpSync, existsSync, mkdirSync, readdirSync, symlinkSync } from 'node:fs'
import { join, relative } from 'node:path'

import { getAgentConfig } from './agents'
import { getGlobalSkillPath, isGloballyInstalled } from './global-path'
import { findProjectRoot } from './project-root'
import type { AgentType, InstallOptions, SkillInfo } from './types'

const TLC_SKILLS_DIR = '.tlc-skills'

export interface InstallResult {
  agent: string
  skill: string
  path: string
  method: 'symlink' | 'copy'
  success: boolean
  error?: string
  usedGlobalSymlink?: boolean
}

export function installSkills(skills: SkillInfo[], options: InstallOptions): InstallResult[] {
  const results: InstallResult[] = []
  const projectRoot = findProjectRoot()

  for (const agent of options.agents) {
    const config = getAgentConfig(agent)
    const targetDir = options.global ? config.globalSkillsDir : join(projectRoot, config.skillsDir)
    if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true })
    for (const skill of skills) {
      const result = installSkillForAgent(skill, agent, targetDir, options.method, projectRoot)
      results.push(result)
    }
  }

  return results
}

function installSkillForAgent(
  skill: SkillInfo,
  agent: AgentType,
  targetDir: string,
  method: 'symlink' | 'copy',
  projectRoot: string,
): InstallResult {
  const config = getAgentConfig(agent)
  const skillTargetPath = join(targetDir, skill.name)

  try {
    if (existsSync(skillTargetPath)) {
      return {
        agent: config.displayName,
        skill: skill.name,
        path: skillTargetPath,
        method,
        success: true,
        error: 'Already exists',
      }
    }

    if (method === 'symlink') {
      const globalSkillPath = getGlobalSkillPath(skill.name)

      if (globalSkillPath) {
        symlinkSync(globalSkillPath, skillTargetPath)
        return {
          agent: config.displayName,
          skill: skill.name,
          path: skillTargetPath,
          method,
          success: true,
          usedGlobalSymlink: true,
        }
      }

      // Fallback
      const canonicalDir = join(projectRoot, TLC_SKILLS_DIR)
      const canonicalSkillPath = join(canonicalDir, skill.name)
      if (!existsSync(canonicalDir)) mkdirSync(canonicalDir, { recursive: true })
      if (!existsSync(canonicalSkillPath)) cpSync(skill.path, canonicalSkillPath, { recursive: true })
      const relativePath = relative(targetDir, canonicalSkillPath)
      symlinkSync(relativePath, skillTargetPath)
    } else {
      cpSync(skill.path, skillTargetPath, { recursive: true })
    }

    return {
      agent: config.displayName,
      skill: skill.name,
      path: skillTargetPath,
      method,
      success: true,
      usedGlobalSymlink: false,
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

export function listInstalledSkills(agent: AgentType, global: boolean): string[] {
  const config = getAgentConfig(agent)
  const targetDir = global ? config.globalSkillsDir : join(findProjectRoot(), config.skillsDir)
  if (!existsSync(targetDir)) return []
  return readdirSync(targetDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() || entry.isSymbolicLink())
    .map((entry) => entry.name)
}

export { isGloballyInstalled }
