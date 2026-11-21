export interface SkillMetadata {
  hasScripts: boolean
  hasReferences: boolean
  referenceFiles: string[]
  lastModified: string
  version?: string
  /** Runtimes inferred from the extensions of bundled `scripts/` files. */
  scriptRuntimes?: string[]
  /** Frontmatter `allowed-tools`: agent tools the skill may use without a permission prompt. */
  allowedTools?: string[]
  /** Every file shipped with the skill, relative to its folder (from the registry). */
  files?: string[]
}

export interface Skill {
  id: string
  name: string
  description: string
  category: string
  path: string
  content: string
  /**
   * Site-only Markdown from `content/skills/<id>.md`. It is never installed with the skill:
   * it holds what the SKILL.md copies on other sites lack (walkthrough, comparisons, history).
   */
  editorial?: string
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
