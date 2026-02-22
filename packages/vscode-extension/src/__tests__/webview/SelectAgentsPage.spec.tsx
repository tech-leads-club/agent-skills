import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import jestAxe from 'jest-axe'
import type { InstalledSkillsMap } from '../../shared/types'
import { SelectAgentsPage } from '../../webview/views/SelectAgentsPage'

const { axe, toHaveNoViolations } = jestAxe
expect.extend(toHaveNoViolations)

const availableAgents = [
  { agent: 'cursor', displayName: 'Cursor' },
  { agent: 'claude-code', displayName: 'Claude Code' },
]

const installedSkills: InstalledSkillsMap = {
  accessibility: {
    local: true,
    global: false,
    agents: [{ agent: 'cursor', displayName: 'Cursor', local: true, global: false, corrupted: false }],
  },
}

describe('SelectAgentsPage', () => {
  it('shows install action footer text', () => {
    render(
      <SelectAgentsPage
        action="install"
        availableAgents={availableAgents}
        installedSkills={installedSkills}
        selectedSkills={['accessibility']}
        selectedAgents={[]}
        scope="local"
        isProcessing={false}
        onToggleAgent={jest.fn()}
        onSelectAll={jest.fn()}
        onClear={jest.fn()}
        onBack={jest.fn()}
        onProceed={jest.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /install skills/i })).toBeInTheDocument()
  })

  it('shows uninstall action footer text', () => {
    render(
      <SelectAgentsPage
        action="uninstall"
        availableAgents={availableAgents}
        installedSkills={installedSkills}
        selectedSkills={['accessibility']}
        selectedAgents={[]}
        scope="local"
        isProcessing={false}
        onToggleAgent={jest.fn()}
        onSelectAll={jest.fn()}
        onClear={jest.fn()}
        onBack={jest.fn()}
        onProceed={jest.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /uninstall skills/i })).toBeInTheDocument()
  })

  it('filters install flow to agents missing selected skill', () => {
    render(
      <SelectAgentsPage
        action="install"
        availableAgents={availableAgents}
        installedSkills={installedSkills}
        selectedSkills={['accessibility']}
        selectedAgents={[]}
        scope="local"
        isProcessing={false}
        onToggleAgent={jest.fn()}
        onSelectAll={jest.fn()}
        onClear={jest.fn()}
        onBack={jest.fn()}
        onProceed={jest.fn()}
      />,
    )

    expect(screen.queryByText('Cursor')).not.toBeInTheDocument()
    expect(screen.getByText('Claude Code')).toBeInTheDocument()
  })

  it('disables proceed button when nothing is selected', () => {
    render(
      <SelectAgentsPage
        action="install"
        availableAgents={availableAgents}
        installedSkills={installedSkills}
        selectedSkills={['accessibility']}
        selectedAgents={[]}
        scope="local"
        isProcessing={false}
        onToggleAgent={jest.fn()}
        onSelectAll={jest.fn()}
        onClear={jest.fn()}
        onBack={jest.fn()}
        onProceed={jest.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /install skills/i })).toBeDisabled()
  })

  it('calls onProceed when selected agents exist', async () => {
    const user = userEvent.setup()
    const onProceed = jest.fn()
    render(
      <SelectAgentsPage
        action="install"
        availableAgents={availableAgents}
        installedSkills={installedSkills}
        selectedSkills={['accessibility']}
        selectedAgents={['claude-code']}
        scope="local"
        isProcessing={false}
        onToggleAgent={jest.fn()}
        onSelectAll={jest.fn()}
        onClear={jest.fn()}
        onBack={jest.fn()}
        onProceed={onProceed}
      />,
    )

    await user.click(screen.getByRole('button', { name: /install skills/i }))
    expect(onProceed).toHaveBeenCalledTimes(1)
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <SelectAgentsPage
        action="install"
        availableAgents={availableAgents}
        installedSkills={installedSkills}
        selectedSkills={['accessibility']}
        selectedAgents={['claude-code']}
        scope="local"
        isProcessing={false}
        onToggleAgent={jest.fn()}
        onSelectAll={jest.fn()}
        onClear={jest.fn()}
        onBack={jest.fn()}
        onProceed={jest.fn()}
      />,
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
