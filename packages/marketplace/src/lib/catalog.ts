import marketplaceData from '../data/skills.json'
import type { AgentTarget, Category, MarketplaceData, Skill } from '../types'

const data = marketplaceData as MarketplaceData

export const catalog = data

export function allSkills(): Skill[] {
  return data.skills
}

export function findSkill(id: string): Skill | undefined {
  return data.skills.find((skill) => skill.id === id)
}

export function findCategory(id: string): Category | undefined {
  return data.categories.find((category) => category.id === id)
}

export function findAgent(id: string): AgentTarget | undefined {
  return data.agents.find((agent) => agent.id === id)
}

// why: the catalog is sorted by display name and carries no tier, so the sidebar needs an explicit
// pick of the CLI's Tier 1 agents to lead with instead of whichever five sort first alphabetically.
const FEATURED_AGENT_IDS = ['claude-code', 'cursor', 'github-copilot', 'windsurf', 'cline']

export function featuredAgents(): AgentTarget[] {
  return FEATURED_AGENT_IDS.map(findAgent).filter((agent): agent is AgentTarget => agent !== undefined)
}

export function skillsInCategory(categoryId: string): Skill[] {
  return data.skills.filter((skill) => skill.category === categoryId)
}

/**
 * why: `uncategorized` exists as a registry fallback bucket, and empty categories appear
 * whenever the catalog metadata outruns the skills. Publishing either as an indexable hub
 * would ship a thin page with no unique value, so category routing is derived from
 * categories that actually hold skills.
 */
export function populatedCategories(): (Category & { skillCount: number })[] {
  return data.categories
    .map((category) => ({ ...category, skillCount: skillsInCategory(category.id).length }))
    .filter((category) => category.skillCount > 0 && category.id !== 'uncategorized')
}

/**
 * Same-category siblings, which is the only skill-to-skill relationship the catalog data
 * actually asserts — inferring "complementary" or "prerequisite" links would be invention.
 */
export function relatedSkills(skill: Skill, limit = 6): Skill[] {
  return skillsInCategory(skill.category)
    .filter((candidate) => candidate.id !== skill.id)
    .slice(0, limit)
}

export function installCommand(skillId: string, agentId?: string): string {
  const agentFlag = agentId ? ` --agent ${agentId}` : ''
  return `npx @tech-leads-club/agent-skills install --skill ${skillId}${agentFlag}`
}
