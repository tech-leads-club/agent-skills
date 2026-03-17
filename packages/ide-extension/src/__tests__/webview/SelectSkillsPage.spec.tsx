import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import jestAxe from 'jest-axe'
import type { AvailableAgent, InstalledSkillsMap, SkillRegistry } from '../../shared/types'
import { SelectSkillsPage } from '../../webview/views/SelectSkillsPage'

function getCategoryOptions(registry: SkillRegistry): { id: string; label: string }[] {
  const categories = Object.entries(registry.categories)
    .map(([id, c]) => ({ id, label: c.name }))
    .sort((a, b) => a.label.localeCompare(b.label))
  return [{ id: 'all', label: 'All categories' }, ...categories]
}

function getSelectableSkills({
  action,
  registry,
  installedSkills,
  allAgents = [],
  selectedAgents = [],
  scope,
}: {
  action: 'install' | 'uninstall'
  registry: SkillRegistry
  installedSkills: InstalledSkillsMap
  allAgents?: AvailableAgent[]
  selectedAgents?: string[]
  scope: 'local' | 'global'
}): typeof registry.skills {
  const targetAgents =
    selectedAgents.length > 0 ? allAgents.filter((a) => selectedAgents.includes(a.agent)) : allAgents
  const inScope = (inst: { local: boolean; global: boolean }, s: string) => (s === 'local' ? inst.local : inst.global)
  const agentInScope = (agent: { local: boolean; global: boolean }, s: string) => (s === 'local' ? agent.local : agent.global)
  return registry.skills.filter((skill) => {
    const installed = installedSkills[skill.name]
    if (action === 'install') {
      const installedForAll =
        installed &&
        (targetAgents.length === 0
          ? inScope(installed, scope)
          : targetAgents.every((a) => {
              const info = installed.agents.find((e) => e.agent === a.agent)
              return info && agentInScope(info, scope)
            })
        )
      return !installedForAll
    }
    if (!installed || !inScope(installed, scope)) return false
    if (selectedAgents.length === 0) return true
    return installed.agents.some((a) => selectedAgents.includes(a.agent) && agentInScope(a, scope))
  })
}

function isSkillInstalledForScope(
  installed: InstalledSkillsMap[string],
  scope: 'local' | 'global',
): boolean {
  if (!installed) return false
  return scope === 'local' ? installed.local : installed.global
}

const { axe } = jestAxe

const registry: SkillRegistry = {
  version: '1',
  categories: {
    quality: { name: 'Quality Assurance', description: 'Quality tools' },
    search: { name: 'Search and Metadata', description: 'Discovery and indexing' },
  },
  skills: [
    {
      name: 'accessibility',
      description: 'Audit and improve web accessibility',
      category: 'quality',
      path: 'skills/accessibility',
      files: ['SKILL.md'],
      author: 'A11y Guild',
      contentHash: 'a',
    },
    {
      name: 'seo',
      description: 'SEO optimization techniques',
      category: 'search',
      path: 'skills/seo',
      files: ['SKILL.md'],
      author: 'SEO Team',
      contentHash: 'b',
    },
  ],
}

const installedSkills: InstalledSkillsMap = {
  accessibility: {
    local: true,
    global: false,
    agents: [
      { agent: 'cursor', displayName: 'Cursor', local: true, global: false, corrupted: false },
      { agent: 'claude-code', displayName: 'Claude Code', local: true, global: false, corrupted: false },
    ],
  },
  seo: null,
}

const allAgents: AvailableAgent[] = [
  { agent: 'cursor', displayName: 'Cursor', company: 'Anysphere' },
  { agent: 'claude-code', displayName: 'Claude Code', company: 'Anthropic' },
]

describe('SelectSkillsPage', () => {
  it('filters install flow to only uninstalled skills', () => {
    render(
      <SelectSkillsPage
        action="install"
        registry={registry}
        installedSkills={installedSkills}
        allAgents={allAgents}
        scope="local"
        selectedSkills={[]}
        getCategoryOptions={getCategoryOptions}
        getSelectableSkills={getSelectableSkills}
        isSkillInstalledForScope={isSkillInstalledForScope}
        onToggleSkill={jest.fn()}
        onSelectAll={jest.fn()}
        onClear={jest.fn()}
        onBack={jest.fn()}
        onNext={jest.fn()}
      />,
    )

    expect(screen.queryByText('accessibility')).not.toBeInTheDocument()
    expect(screen.getByText('seo')).toBeInTheDocument()
  })

  it('filters uninstall flow to only installed skills', () => {
    render(
      <SelectSkillsPage
        action="uninstall"
        registry={registry}
        installedSkills={installedSkills}
        scope="local"
        selectedSkills={[]}
        getCategoryOptions={getCategoryOptions}
        getSelectableSkills={getSelectableSkills}
        isSkillInstalledForScope={isSkillInstalledForScope}
        onToggleSkill={jest.fn()}
        onSelectAll={jest.fn()}
        onClear={jest.fn()}
        onBack={jest.fn()}
        onNext={jest.fn()}
      />,
    )

    expect(screen.getByText('accessibility')).toBeInTheDocument()
    expect(screen.queryByText('seo')).not.toBeInTheDocument()
  })

  it('keeps install candidates when skill is not installed on every agent', () => {
    render(
      <SelectSkillsPage
        action="install"
        registry={registry}
        installedSkills={{
          accessibility: {
            local: true,
            global: false,
            agents: [{ agent: 'cursor', displayName: 'Cursor', local: true, global: false, corrupted: false }],
          },
          seo: null,
        }}
        allAgents={allAgents}
        scope="local"
        selectedSkills={[]}
        getCategoryOptions={getCategoryOptions}
        getSelectableSkills={getSelectableSkills}
        isSkillInstalledForScope={isSkillInstalledForScope}
        onToggleSkill={jest.fn()}
        onSelectAll={jest.fn()}
        onClear={jest.fn()}
        onBack={jest.fn()}
        onNext={jest.fn()}
      />,
    )

    expect(screen.getByText('accessibility')).toBeInTheDocument()
    expect(screen.getByText('seo')).toBeInTheDocument()
  })

  it('filters by search term across skill fields', async () => {
    const user = userEvent.setup()
    render(
      <SelectSkillsPage
        action="install"
        registry={registry}
        installedSkills={{ accessibility: null, seo: null }}
        allAgents={allAgents}
        scope="local"
        selectedSkills={[]}
        getCategoryOptions={getCategoryOptions}
        getSelectableSkills={getSelectableSkills}
        isSkillInstalledForScope={isSkillInstalledForScope}
        onToggleSkill={jest.fn()}
        onSelectAll={jest.fn()}
        onClear={jest.fn()}
        onBack={jest.fn()}
        onNext={jest.fn()}
      />,
    )

    await user.type(screen.getByRole('searchbox', { name: /search skills/i }), 'access')
    expect(screen.getByText('accessibility')).toBeInTheDocument()
    expect(screen.queryByText('seo')).not.toBeInTheDocument()
  })

  it('matches words that appear later in long descriptions', async () => {
    const user = userEvent.setup()
    const registryWithLongDescription: SkillRegistry = {
      ...registry,
      skills: [
        ...registry.skills,
        {
          name: 'chrome-devtools',
          description:
            'Expert-level browser automation, debugging, and performance analysis using Chrome DevTools MCP. Use for interacting with web pages, capturing screenshots, analyzing network traffic, and profiling performance.',
          category: 'search',
          path: 'skills/chrome-devtools',
          files: ['SKILL.md'],
          author: 'Tooling Team',
          contentHash: 'c',
        },
      ],
    }

    render(
      <SelectSkillsPage
        action="install"
        registry={registryWithLongDescription}
        installedSkills={{ accessibility: null, seo: null, 'chrome-devtools': null }}
        allAgents={allAgents}
        scope="local"
        selectedSkills={[]}
        getCategoryOptions={getCategoryOptions}
        getSelectableSkills={getSelectableSkills}
        isSkillInstalledForScope={isSkillInstalledForScope}
        onToggleSkill={jest.fn()}
        onSelectAll={jest.fn()}
        onClear={jest.fn()}
        onBack={jest.fn()}
        onNext={jest.fn()}
      />,
    )

    await user.type(screen.getByRole('searchbox', { name: /search skills/i }), 'analyzing')
    expect(screen.getByText('chrome-devtools')).toBeInTheDocument()
    expect(screen.queryByText('accessibility')).not.toBeInTheDocument()
  })

  it('filters by author search term', async () => {
    const user = userEvent.setup()
    render(
      <SelectSkillsPage
        action="install"
        registry={registry}
        installedSkills={{ accessibility: null, seo: null }}
        allAgents={allAgents}
        scope="local"
        selectedSkills={[]}
        getCategoryOptions={getCategoryOptions}
        getSelectableSkills={getSelectableSkills}
        isSkillInstalledForScope={isSkillInstalledForScope}
        onToggleSkill={jest.fn()}
        onSelectAll={jest.fn()}
        onClear={jest.fn()}
        onBack={jest.fn()}
        onNext={jest.fn()}
      />,
    )

    await user.type(screen.getByRole('searchbox', { name: /search skills/i }), 'seo team')
    expect(screen.getByText('seo')).toBeInTheDocument()
    expect(screen.queryByText('accessibility')).not.toBeInTheDocument()
  })

  it('filters by category search term', async () => {
    const user = userEvent.setup()
    render(
      <SelectSkillsPage
        action="install"
        registry={registry}
        installedSkills={{ accessibility: null, seo: null }}
        allAgents={allAgents}
        scope="local"
        selectedSkills={[]}
        getCategoryOptions={getCategoryOptions}
        getSelectableSkills={getSelectableSkills}
        isSkillInstalledForScope={isSkillInstalledForScope}
        onToggleSkill={jest.fn()}
        onSelectAll={jest.fn()}
        onClear={jest.fn()}
        onBack={jest.fn()}
        onNext={jest.fn()}
      />,
    )

    await user.type(screen.getByRole('searchbox', { name: /search skills/i }), 'metadata')
    expect(screen.getByText('seo')).toBeInTheDocument()
    expect(screen.queryByText('accessibility')).not.toBeInTheDocument()
  })

  it('filters skills by category dropdown before search', async () => {
    const user = userEvent.setup()
    render(
      <SelectSkillsPage
        action="install"
        registry={registry}
        installedSkills={{ accessibility: null, seo: null }}
        allAgents={allAgents}
        scope="local"
        selectedSkills={[]}
        getCategoryOptions={getCategoryOptions}
        getSelectableSkills={getSelectableSkills}
        isSkillInstalledForScope={isSkillInstalledForScope}
        onToggleSkill={jest.fn()}
        onSelectAll={jest.fn()}
        onClear={jest.fn()}
        onBack={jest.fn()}
        onNext={jest.fn()}
      />,
    )

    await user.selectOptions(screen.getByRole('combobox', { name: /filter by category/i }), 'quality')

    expect(screen.getByText('accessibility')).toBeInTheDocument()
    expect(screen.queryByText('seo')).not.toBeInTheDocument()
  })

  it('keeps category and search filters composed together', async () => {
    const user = userEvent.setup()
    render(
      <SelectSkillsPage
        action="install"
        registry={registry}
        installedSkills={{ accessibility: null, seo: null }}
        allAgents={allAgents}
        scope="local"
        selectedSkills={[]}
        getCategoryOptions={getCategoryOptions}
        getSelectableSkills={getSelectableSkills}
        isSkillInstalledForScope={isSkillInstalledForScope}
        onToggleSkill={jest.fn()}
        onSelectAll={jest.fn()}
        onClear={jest.fn()}
        onBack={jest.fn()}
        onNext={jest.fn()}
      />,
    )

    await user.selectOptions(screen.getByRole('combobox', { name: /filter by category/i }), 'search')
    await user.type(screen.getByRole('searchbox', { name: /search skills/i }), 'seo')

    expect(screen.getByText('seo')).toBeInTheDocument()
    expect(screen.queryByText('accessibility')).not.toBeInTheDocument()
    expect(screen.getByText(/1 selected|0 selected/i)).toBeInTheDocument()
  })

  it('disables configure installation button when nothing is selected', () => {
    render(
      <SelectSkillsPage
        action="install"
        registry={registry}
        installedSkills={installedSkills}
        allAgents={allAgents}
        scope="local"
        selectedSkills={[]}
        getCategoryOptions={getCategoryOptions}
        getSelectableSkills={getSelectableSkills}
        isSkillInstalledForScope={isSkillInstalledForScope}
        onToggleSkill={jest.fn()}
        onSelectAll={jest.fn()}
        onClear={jest.fn()}
        onBack={jest.fn()}
        onNext={jest.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /configure installation/i })).toBeDisabled()
  })

  it('applies install accent class to configure installation button', () => {
    render(
      <SelectSkillsPage
        action="install"
        registry={registry}
        installedSkills={{ accessibility: null, seo: null }}
        allAgents={allAgents}
        scope="local"
        selectedSkills={['accessibility']}
        getCategoryOptions={getCategoryOptions}
        getSelectableSkills={getSelectableSkills}
        isSkillInstalledForScope={isSkillInstalledForScope}
        onToggleSkill={jest.fn()}
        onSelectAll={jest.fn()}
        onClear={jest.fn()}
        onBack={jest.fn()}
        onNext={jest.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /configure installation/i })).toHaveClass(
      'primary-footer-button--install',
    )
  })

  it('applies uninstall accent class to confirm removal button', () => {
    render(
      <SelectSkillsPage
        action="uninstall"
        registry={registry}
        installedSkills={installedSkills}
        scope="local"
        selectedSkills={['accessibility']}
        getCategoryOptions={getCategoryOptions}
        getSelectableSkills={getSelectableSkills}
        isSkillInstalledForScope={isSkillInstalledForScope}
        onToggleSkill={jest.fn()}
        onSelectAll={jest.fn()}
        onClear={jest.fn()}
        onBack={jest.fn()}
        onNext={jest.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /confirm removal/i })).toHaveClass('primary-footer-button--uninstall')
  })

  it('supports Ctrl+A bulk selection shortcut', async () => {
    const onSelectAll = jest.fn()
    const user = userEvent.setup()

    render(
      <SelectSkillsPage
        action="install"
        registry={registry}
        installedSkills={{ accessibility: null, seo: null }}
        allAgents={allAgents}
        scope="local"
        selectedSkills={[]}
        getCategoryOptions={getCategoryOptions}
        getSelectableSkills={getSelectableSkills}
        isSkillInstalledForScope={isSkillInstalledForScope}
        onToggleSkill={jest.fn()}
        onSelectAll={onSelectAll}
        onClear={jest.fn()}
        onBack={jest.fn()}
        onNext={jest.fn()}
      />,
    )

    await user.keyboard('{Control>}a{/Control}')
    expect(onSelectAll).toHaveBeenCalled()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <SelectSkillsPage
        action="install"
        registry={registry}
        installedSkills={{ accessibility: null, seo: null }}
        allAgents={allAgents}
        scope="local"
        selectedSkills={[]}
        getCategoryOptions={getCategoryOptions}
        getSelectableSkills={getSelectableSkills}
        isSkillInstalledForScope={isSkillInstalledForScope}
        onToggleSkill={jest.fn()}
        onSelectAll={jest.fn()}
        onClear={jest.fn()}
        onBack={jest.fn()}
        onNext={jest.fn()}
      />,
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
