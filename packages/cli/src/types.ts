import type { AgentConfig, AgentType, CategoriesConfig, CategoryInfo, SkillInfo } from '@tech-leads-club/core'

export interface InstallOptions {
  global: boolean
  method: 'symlink' | 'copy'
  agents: AgentType[]
  skills: string[]
}

export interface InstallResult {
  agent: string
  skill: string
  path: string
  method: 'symlink' | 'copy'
  success: boolean
  error?: string
  usedGlobalSymlink?: boolean
  symlinkFailed?: boolean
}

export type { AgentConfig, AgentType, CategoriesConfig, CategoryInfo, SkillInfo }
