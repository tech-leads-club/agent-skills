import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { InstalledSkillsMap, SkillRegistry } from '../../shared/types'
import { SelectOutdatedSkillsPage } from '../../webview/views/SelectOutdatedSkillsPage'

function getCategoryOptions(registry: SkillRegistry): { id: string; label: string }[] {
  const categories = Object.entries(registry.categories)
    .map(([id, c]) => ({ id, label: c.name }))
    .sort((a, b) => a.label.localeCompare(b.label))
  return [{ id: 'all', label: 'All categories' }, ...categories]
}

function getOutdatedSkills({
  registry,
  installedSkills,
  effectiveScopes,
}: {
  registry: SkillRegistry
  installedSkills: InstalledSkillsMap
  effectiveScopes: ('local' | 'global')[]
}): typeof registry.skills {
  const inScope = (inst: { local: boolean; global: boolean }, scope: string) =>
    scope === 'local' ? inst.local : inst.global
  return registry.skills.filter((skill) => {
    const inst = installedSkills[skill.name]
    if (!inst || !skill.contentHash || !effectiveScopes.some((s) => inScope(inst, s))) return false
    return inst.contentHash !== skill.contentHash
  })
}

const registry: SkillRegistry = {
  version: '1',
  categories: {
    quality: { name: 'Quality Assurance', description: 'Quality tools' },
    search: { name: 'Search and Metadata', description: 'Search tools' },
  },
  skills: [
    {
      name: 'accessibility',
      description: 'Accessibility checks',
      category: 'quality',
      path: 'skills/accessibility',
      files: ['SKILL.md'],
      contentHash: 'hash-accessibility',
    },
    {
      name: 'seo',
      description: 'SEO checks',
      category: 'search',
      path: 'skills/seo',
      files: ['SKILL.md'],
      contentHash: 'hash-seo',
    },
  ],
}

const installedSkills: InstalledSkillsMap = {
  accessibility: {
    local: true,
    global: false,
    contentHash: 'old-hash',
    agents: [{ agent: 'cursor', displayName: 'Cursor', local: true, global: false, corrupted: false }],
  },
  seo: {
    local: true,
    global: false,
    contentHash: 'hash-seo',
    agents: [{ agent: 'cursor', displayName: 'Cursor', local: true, global: false, corrupted: false }],
  },
}

describe('SelectOutdatedSkillsPage', () => {
  it('shows only outdated skills by default', () => {
    render(
      <SelectOutdatedSkillsPage
        registry={registry}
        installedSkills={installedSkills}
        effectiveScopes={['local']}
        selectedSkills={[]}
        getCategoryOptions={getCategoryOptions}
        getOutdatedSkills={getOutdatedSkills}
        onToggleSkill={jest.fn()}
        onSelectAll={jest.fn()}
        onClear={jest.fn()}
        onCancel={jest.fn()}
        onUpdate={jest.fn()}
      />,
    )

    expect(screen.getByText('accessibility')).toBeInTheDocument()
    expect(screen.queryByText('seo')).not.toBeInTheDocument()
  })

  it('filters outdated skills by category', async () => {
    const user = userEvent.setup()
    render(
      <SelectOutdatedSkillsPage
        registry={{
          ...registry,
          skills: [
            ...registry.skills,
            {
              name: 'metadata-audit',
              description: 'Metadata checks',
              category: 'search',
              path: 'skills/metadata-audit',
              files: ['SKILL.md'],
              contentHash: 'hash-metadata',
            },
          ],
        }}
        installedSkills={{
          ...installedSkills,
          'metadata-audit': {
            local: true,
            global: false,
            contentHash: 'old-metadata',
            agents: [{ agent: 'cursor', displayName: 'Cursor', local: true, global: false, corrupted: false }],
          },
        }}
        effectiveScopes={['local']}
        selectedSkills={[]}
        getCategoryOptions={getCategoryOptions}
        getOutdatedSkills={getOutdatedSkills}
        onToggleSkill={jest.fn()}
        onSelectAll={jest.fn()}
        onClear={jest.fn()}
        onCancel={jest.fn()}
        onUpdate={jest.fn()}
      />,
    )

    await user.selectOptions(screen.getByRole('combobox', { name: /filter by category/i }), 'search')

    expect(screen.getByText('metadata-audit')).toBeInTheDocument()
    expect(screen.queryByText('accessibility')).not.toBeInTheDocument()
  })

  it('keeps category and search filters composed together', async () => {
    const user = userEvent.setup()
    render(
      <SelectOutdatedSkillsPage
        registry={registry}
        installedSkills={installedSkills}
        effectiveScopes={['local']}
        selectedSkills={[]}
        getCategoryOptions={getCategoryOptions}
        getOutdatedSkills={getOutdatedSkills}
        onToggleSkill={jest.fn()}
        onSelectAll={jest.fn()}
        onClear={jest.fn()}
        onCancel={jest.fn()}
        onUpdate={jest.fn()}
      />,
    )

    await user.selectOptions(screen.getByRole('combobox', { name: /filter by category/i }), 'quality')
    await user.type(screen.getByRole('searchbox', { name: /search skills/i }), 'access')

    expect(screen.getByText('accessibility')).toBeInTheDocument()
    expect(screen.queryByText('seo')).not.toBeInTheDocument()
  })

  it('sends an empty selection to let the host decide update all', async () => {
    const user = userEvent.setup()
    const onUpdate = jest.fn()

    render(
      <SelectOutdatedSkillsPage
        registry={registry}
        installedSkills={installedSkills}
        effectiveScopes={['local']}
        selectedSkills={[]}
        getCategoryOptions={getCategoryOptions}
        getOutdatedSkills={getOutdatedSkills}
        onToggleSkill={jest.fn()}
        onSelectAll={jest.fn()}
        onClear={jest.fn()}
        onCancel={jest.fn()}
        onUpdate={onUpdate}
      />,
    )

    await user.click(screen.getByRole('button', { name: /^update$/i }))

    expect(onUpdate).toHaveBeenCalledWith([])
  })
})
