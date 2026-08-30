export interface SkillMetadata {
  hasScripts: boolean
  hasReferences: boolean
  referenceFiles: string[]
  lastModified: string
}

export interface Skill {
  id: string
  name: string
  description: string
  category: string
  path: string
  content: string
  metadata: SkillMetadata
}

export interface Category {
  id: string
  name: string
  description?: string
  priority?: number
}

export interface AgentTarget {
  id: string
  name: string
  description: string
  /** Project-local install directory, relative to the repository root. */
  skillsDir: string
  /** Home-directory install path, with `~` standing in for the user's home. */
  globalSkillsDir: string
}

export interface MarketplaceData {
  skills: Skill[]
  categories: Category[]
  agents: AgentTarget[]
  stats: {
    totalSkills: number
    totalCategories: number
    totalAgents: number
  }
}
