export interface CategoryInfo {
  id: string
  name: string
  description?: string
  priority?: number
}

export interface CategoryMetadata {
  [categoryFolder: string]: {
    name?: string
    description?: string
    priority?: number
  }
}

export type AgentType =
  | 'cursor'
  | 'claude-code'
  | 'github-copilot'
  | 'windsurf'
  | 'cline'
  | 'aider'
  | 'codex'
  | 'gemini'
  | 'antigravity'
  | 'roo'
  | 'kilocode'
  | 'amazon-q'
  | 'augment'
  | 'tabnine'
  | 'opencode'
  | 'sourcegraph'
  | 'trae'

export interface AgentConfig {
  name: string
  displayName: string
  description: string
  skillsDir: string
  globalSkillsDir: string
  detectInstalled: () => boolean
}

export interface SkillInfo {
  name: string
  description: string
  path: string
  category?: string
}
