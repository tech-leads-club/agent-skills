import type {
  AgentConfig,
  AgentType,
  CategoryInfo,
  CategoryMetadata,
  DeprecatedEntry,
  SkillInfo,
} from '@tech-leads-club/core'

export interface InstallOptions {
  global: boolean
  method: 'symlink' | 'copy'
  agents: AgentType[]
  skills: string[]
  forceUpdate?: boolean
  isUpdate?: boolean
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

export type { AgentConfig, AgentType, CategoryInfo, CategoryMetadata, DeprecatedEntry, SkillInfo }

export type GroupedSkills = Map<CategoryInfo, SkillInfo[]>

export interface GitHubContributor {
  login: string
  avatarUrl: string
  contributions: number
}
