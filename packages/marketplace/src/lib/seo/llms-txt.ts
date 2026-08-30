import type { MarketplaceData } from '../../types'
import { NPM_PACKAGE_NAME, REPOSITORY_URL, SITE_NAME } from './site'
import { parseSkillDescription } from './skill-description'
import { absoluteUrl, routes } from './urls'

// invariant: past this many skills a full link list stops being a summary and becomes a file
// no agent wants to load, so the skill section degrades to categories only.
const MAX_INLINE_SKILLS = 250

function line(name: string, path: string, description: string): string {
  return `- [${name}](${absoluteUrl(path)}): ${description}`
}

// why: published for Cursor and Claude Code, which fetch llms.txt when a user names a domain,
// not as a ranking signal — no major search or AI crawler consumes it.
export function buildLlmsTxt(data: MarketplaceData): string {
  const categories = data.categories
    .map((category) => ({
      ...category,
      skills: data.skills.filter((skill) => skill.category === category.id),
    }))
    .filter((category) => category.skills.length > 0 && category.id !== 'uncategorized')

  const sections = [
    `# ${SITE_NAME}`,
    '',
    `> ${data.stats.totalSkills} packaged instruction sets that extend AI coding agents with reviewed workflows and domain expertise. Each skill is a Markdown file plus optional scripts, templates and reference docs, installable into ${data.stats.totalAgents} agents including Cursor, Claude Code, GitHub Copilot, Windsurf and Cline.`,
    '',
    `Install any skill with \`npx ${NPM_PACKAGE_NAME} install --skill <id>\`. Add \`--agent <id>\` to target one agent, or \`--global\` to install for every project. Source: ${REPOSITORY_URL}`,
    '',
    '## Categories',
    '',
    ...categories.map((category) =>
      line(
        category.name,
        routes.category(category.id),
        `${category.skills.length} ${category.skills.length === 1 ? 'skill' : 'skills'}. ${
          category.description ?? ''
        }`.trim(),
      ),
    ),
    '',
    '## Agents',
    '',
    ...data.agents.map((agent) =>
      line(agent.name, routes.agent(agent.id), `${agent.description}. Installs to ${agent.skillsDir}`),
    ),
    '',
  ]

  if (data.skills.length <= MAX_INLINE_SKILLS) {
    sections.push(
      '## Skills',
      '',
      ...data.skills.map((skill) =>
        line(skill.name, routes.skill(skill.id), parseSkillDescription(skill.description).summary),
      ),
      '',
    )
  }

  sections.push(
    '## Optional',
    '',
    line('About', routes.about(), 'How the registry is built, reviewed and security-scanned'),
    line('All skills', routes.skills(), 'Searchable index of every skill'),
    '',
  )

  return sections.join('\n')
}
