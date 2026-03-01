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

export const AGENT_TYPES = [
  'cursor',
  'claude-code',
  'github-copilot',
  'windsurf',
  'cline',
  'aider',
  'codex',
  'gemini',
  'antigravity',
  'roo',
  'kilocode',
  'amazon-q',
  'augment',
  'tabnine',
  'opencode',
  'sourcegraph',
  'droid',
  'trae',
  'kiro',
] as const

export type AgentType = (typeof AGENT_TYPES)[number]

export interface AgentMetadata {
  name: AgentType
  displayName: string
  description: string
  company: string
  skillsDir: string
  globalSkillsDir: string
}

export interface AgentConfig extends AgentMetadata {
  detectInstalled: () => boolean
}

export interface SkillInfo {
  name: string
  description: string
  path: string
  category?: string
}

export interface DeprecatedEntry {
  name: string
  message: string
  alternatives?: string[]
}
