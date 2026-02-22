import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import jestAxe from 'jest-axe'
import type { InstalledSkillsMap, SkillRegistry } from '../../shared/types'
import { SelectSkillsPage } from '../../webview/views/SelectSkillsPage'

const { axe, toHaveNoViolations } = jestAxe
expect.extend(toHaveNoViolations)

const registry: SkillRegistry = {
  version: '1',
  categories: { quality: { name: 'Quality', description: 'Quality tools' } },
  skills: [
    {
      name: 'accessibility',
      description: 'Audit and improve web accessibility',
      category: 'quality',
      path: 'skills/accessibility',
      files: ['SKILL.md'],
      contentHash: 'a',
    },
    {
      name: 'seo',
      description: 'SEO optimization techniques',
      category: 'quality',
      path: 'skills/seo',
      files: ['SKILL.md'],
      contentHash: 'b',
    },
  ],
}

const installedSkills: InstalledSkillsMap = {
  accessibility: { local: true, global: false, agents: [] },
  seo: null,
}

describe('SelectSkillsPage', () => {
  it('filters install flow to only uninstalled skills', () => {
    render(
      <SelectSkillsPage
        action="install"
        registry={registry}
        installedSkills={installedSkills}
        scope="local"
        selectedSkills={[]}
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

  it('filters by search term across skill fields', async () => {
    const user = userEvent.setup()
    render(
      <SelectSkillsPage
        action="install"
        registry={registry}
        installedSkills={{ accessibility: null, seo: null }}
        scope="local"
        selectedSkills={[]}
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

  it('disables select agents button when nothing is selected', () => {
    render(
      <SelectSkillsPage
        action="install"
        registry={registry}
        installedSkills={installedSkills}
        scope="local"
        selectedSkills={[]}
        onToggleSkill={jest.fn()}
        onSelectAll={jest.fn()}
        onClear={jest.fn()}
        onBack={jest.fn()}
        onNext={jest.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /select agents/i })).toBeDisabled()
  })

  it('supports Ctrl+A bulk selection shortcut', async () => {
    const onSelectAll = jest.fn()
    const user = userEvent.setup()

    render(
      <SelectSkillsPage
        action="install"
        registry={registry}
        installedSkills={{ accessibility: null, seo: null }}
        scope="local"
        selectedSkills={[]}
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
        scope="local"
        selectedSkills={[]}
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
