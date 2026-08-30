import type { MarketplaceData, Skill } from '../../../types'
import { buildLlmsTxt } from '../llms-txt'

function skill(id: string, category: string, description: string): Skill {
  return {
    id,
    name: id,
    description,
    category,
    path: `skills/(${category})/${id}/SKILL.md`,
    content: '# body',
    metadata: { hasScripts: false, hasReferences: false, referenceFiles: [], lastModified: '2026-01-01' },
  }
}

const data: MarketplaceData = {
  skills: [
    skill('alpha', 'quality', 'Does alpha things. Use when testing. Do NOT use for beta.'),
    skill('beta', 'security', 'Does beta things. Use when auditing. Do NOT use for alpha.'),
  ],
  categories: [
    { id: 'quality', name: 'Quality', description: 'Quality skills' },
    { id: 'security', name: 'Security', description: 'Security skills' },
    { id: 'empty', name: 'Empty', description: 'No members' },
    { id: 'uncategorized', name: 'Uncategorized', description: 'Fallback bucket' },
  ],
  agents: [
    {
      id: 'cursor',
      name: 'Cursor',
      description: 'AI-first editor',
      skillsDir: '.cursor/skills',
      globalSkillsDir: '~/.cursor/skills',
    },
  ],
  stats: { totalSkills: 2, totalCategories: 4, totalAgents: 1 },
}

describe('buildLlmsTxt', () => {
  const output = buildLlmsTxt(data)

  it('opens with the H1 and blockquote the spec requires', () => {
    const [heading, blank, summary] = output.split('\n')

    expect(heading).toBe('# Agent Skills')
    expect(blank).toBe('')
    expect(summary.startsWith('> ')).toBe(true)
  })

  it('links every skill with its parsed summary and an absolute trailing-slash URL', () => {
    expect(output).toContain('- [alpha](https://agent-skills.techleads.club/skills/alpha/): Does alpha things')
    expect(output).not.toContain('Do NOT use for')
  })

  it('omits categories that have no skills and the uncategorized fallback', () => {
    expect(output).toContain('/categories/quality/')
    expect(output).not.toContain('/categories/empty/')
    expect(output).not.toContain('/categories/uncategorized/')
  })

  it('counts a single-member category in the singular', () => {
    expect(output).toContain('): 1 skill. Quality skills')
  })

  it('lists agents with the directory skills install into', () => {
    expect(output).toContain('- [Cursor](https://agent-skills.techleads.club/agents/cursor/)')
    expect(output).toContain('.cursor/skills')
  })
})
