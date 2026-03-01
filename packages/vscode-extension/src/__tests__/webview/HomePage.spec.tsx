import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import jestAxe from 'jest-axe'
import type { AvailableAgent, SkillRegistry } from '../../shared/types'
import { getState, setState } from '../../webview/lib/vscode-api'
import { HomePage } from '../../webview/views/HomePage'

jest.mock('../../webview/lib/vscode-api', () => ({
  getState: jest.fn(),
  setState: jest.fn(),
}))

const { axe, toHaveNoViolations } = jestAxe
expect.extend(toHaveNoViolations)

const registry: SkillRegistry = {
  version: '1',
  categories: { quality: { name: 'Quality', description: 'Quality tools' } },
  skills: [
    {
      name: 'accessibility',
      description: 'Accessibility checks',
      category: 'quality',
      path: 'skills/accessibility',
      files: ['SKILL.md'],
      contentHash: 'abc',
    },
  ],
}

const allAgents: AvailableAgent[] = [
  { agent: 'cursor', displayName: 'Cursor', company: 'Anysphere' },
  { agent: 'claude-code', displayName: 'Claude Code', company: 'Anthropic' },
]

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getState as jest.Mock).mockReturnValue(undefined)
    ;(setState as jest.Mock).mockImplementation(() => {})
  })

  it('renders 4 action buttons', () => {
    render(
      <HomePage
        registry={registry}
        installedSkills={{ accessibility: { local: true, global: true, agents: [] } }}
        policy={{ allowedScopes: 'all', effectiveScopes: ['local', 'global'] }}
        isTrusted={true}
        hasWorkspace={true}
        scope="local"
        isProcessing={false}
        onNavigate={jest.fn()}
        onScopeChange={jest.fn()}
        onUpdate={jest.fn()}
        onRepair={jest.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /install add new capabilities/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /uninstall remove installed skills/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^update/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^repair/i })).toBeInTheDocument()
  })

  it('navigates to skills flow on install/uninstall clicks', async () => {
    const onNavigate = jest.fn()
    const user = userEvent.setup()

    const { rerender } = render(
      <HomePage
        registry={registry}
        installedSkills={{}}
        policy={{ allowedScopes: 'all', effectiveScopes: ['local', 'global'] }}
        isTrusted={true}
        hasWorkspace={true}
        scope="local"
        isProcessing={false}
        onNavigate={onNavigate}
        onScopeChange={jest.fn()}
        onUpdate={jest.fn()}
        onRepair={jest.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /install add new capabilities/i }))

    rerender(
      <HomePage
        registry={registry}
        installedSkills={{ accessibility: { local: true, global: true, agents: [] } }}
        policy={{ allowedScopes: 'all', effectiveScopes: ['local', 'global'] }}
        isTrusted={true}
        hasWorkspace={true}
        scope="local"
        isProcessing={false}
        onNavigate={onNavigate}
        onScopeChange={jest.fn()}
        onUpdate={jest.fn()}
        onRepair={jest.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /uninstall remove installed skills/i }))

    expect(onNavigate).toHaveBeenNthCalledWith(1, 'install')
    expect(onNavigate).toHaveBeenNthCalledWith(2, 'uninstall')
  })

  it('disables install button with tooltip when all are installed', () => {
    render(
      <HomePage
        registry={registry}
        installedSkills={{
          accessibility: {
            local: true,
            global: true,
            agents: [
              { agent: 'cursor', displayName: 'Cursor', local: true, global: true, corrupted: false },
              { agent: 'claude-code', displayName: 'Claude Code', local: true, global: true, corrupted: false },
            ],
          },
        }}
        allAgents={allAgents}
        policy={{ allowedScopes: 'all', effectiveScopes: ['local', 'global'] }}
        isTrusted={true}
        hasWorkspace={true}
        scope="local"
        isProcessing={false}
        onNavigate={jest.fn()}
        onScopeChange={jest.fn()}
        onUpdate={jest.fn()}
        onRepair={jest.fn()}
      />,
    )

    const install = screen.getByRole('button', { name: /install add new capabilities/i })
    expect(install).toBeDisabled()
    expect(install).toHaveAttribute('title', 'All skills are already installed')
  })

  it('keeps install enabled when skills are not installed for every agent', () => {
    render(
      <HomePage
        registry={registry}
        installedSkills={{
          accessibility: {
            local: true,
            global: false,
            agents: [{ agent: 'cursor', displayName: 'Cursor', local: true, global: false, corrupted: false }],
          },
        }}
        allAgents={allAgents}
        policy={{ allowedScopes: 'all', effectiveScopes: ['local', 'global'] }}
        isTrusted={true}
        hasWorkspace={true}
        scope="local"
        isProcessing={false}
        onNavigate={jest.fn()}
        onScopeChange={jest.fn()}
        onUpdate={jest.fn()}
        onRepair={jest.fn()}
      />,
    )

    const install = screen.getByRole('button', { name: /install add new capabilities/i })
    expect(install).toBeEnabled()
  })

  it('disables all action buttons during processing', () => {
    render(
      <HomePage
        registry={registry}
        installedSkills={{}}
        policy={{ allowedScopes: 'all', effectiveScopes: ['local', 'global'] }}
        isTrusted={true}
        hasWorkspace={true}
        scope="local"
        isProcessing={true}
        onNavigate={jest.fn()}
        onScopeChange={jest.fn()}
        onUpdate={jest.fn()}
        onRepair={jest.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /install add new capabilities/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /uninstall remove installed skills/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^update/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^repair/i })).toBeDisabled()
  })

  it('disables update when no updates are available', () => {
    render(
      <HomePage
        registry={registry}
        installedSkills={{
          accessibility: {
            local: true,
            global: true,
            agents: [{ agent: 'cursor', displayName: 'Cursor', local: true, global: true, corrupted: false }],
            contentHash: 'abc',
          },
        }}
        policy={{ allowedScopes: 'all', effectiveScopes: ['local', 'global'] }}
        isTrusted={true}
        hasWorkspace={true}
        scope="local"
        isProcessing={false}
        onNavigate={jest.fn()}
        onScopeChange={jest.fn()}
        onUpdate={jest.fn()}
        onRepair={jest.fn()}
      />,
    )

    const update = screen.getByRole('button', { name: /^update/i })
    expect(update).toBeDisabled()
    expect(update).toHaveAttribute('title', 'No updates are available')
  })

  it('disables update when installed hash is unavailable', () => {
    render(
      <HomePage
        registry={registry}
        installedSkills={{
          accessibility: {
            local: true,
            global: true,
            agents: [{ agent: 'cursor', displayName: 'Cursor', local: true, global: true, corrupted: false }],
          },
        }}
        policy={{ allowedScopes: 'all', effectiveScopes: ['local', 'global'] }}
        isTrusted={true}
        hasWorkspace={true}
        scope="local"
        isProcessing={false}
        onNavigate={jest.fn()}
        onScopeChange={jest.fn()}
        onUpdate={jest.fn()}
        onRepair={jest.fn()}
      />,
    )

    const update = screen.getByRole('button', { name: /^update/i })
    expect(update).toBeDisabled()
    expect(update).toHaveAttribute('title', 'No updates are available')
  })

  it('enables update when an installed skill hash differs', () => {
    render(
      <HomePage
        registry={registry}
        installedSkills={{
          accessibility: {
            local: true,
            global: false,
            agents: [{ agent: 'cursor', displayName: 'Cursor', local: true, global: false, corrupted: false }],
            contentHash: 'outdated-hash',
          },
        }}
        policy={{ allowedScopes: 'all', effectiveScopes: ['local', 'global'] }}
        isTrusted={true}
        hasWorkspace={true}
        scope="local"
        isProcessing={false}
        onNavigate={jest.fn()}
        onScopeChange={jest.fn()}
        onUpdate={jest.fn()}
        onRepair={jest.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /^update/i })).toBeEnabled()
  })

  it('disables repair when no corrupted installation exists', () => {
    render(
      <HomePage
        registry={registry}
        installedSkills={{
          accessibility: {
            local: true,
            global: false,
            agents: [{ agent: 'cursor', displayName: 'Cursor', local: true, global: false, corrupted: false }],
          },
        }}
        policy={{ allowedScopes: 'all', effectiveScopes: ['local', 'global'] }}
        isTrusted={true}
        hasWorkspace={true}
        scope="local"
        isProcessing={false}
        onNavigate={jest.fn()}
        onScopeChange={jest.fn()}
        onUpdate={jest.fn()}
        onRepair={jest.fn()}
      />,
    )

    const repair = screen.getByRole('button', { name: /^repair/i })
    expect(repair).toBeDisabled()
    expect(repair).toHaveAttribute('title', 'No corrupted skills are available to repair')
  })

  it('enables repair when the selected scope has corruption', () => {
    render(
      <HomePage
        registry={registry}
        installedSkills={{
          accessibility: {
            local: true,
            global: false,
            agents: [{ agent: 'cursor', displayName: 'Cursor', local: true, global: false, corrupted: true }],
          },
        }}
        policy={{ allowedScopes: 'all', effectiveScopes: ['local', 'global'] }}
        isTrusted={true}
        hasWorkspace={true}
        scope="local"
        isProcessing={false}
        onNavigate={jest.fn()}
        onScopeChange={jest.fn()}
        onUpdate={jest.fn()}
        onRepair={jest.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /^repair/i })).toBeEnabled()
  })

  it('locks scope selector to global when workspace is untrusted', () => {
    render(
      <HomePage
        registry={registry}
        installedSkills={{}}
        policy={{ allowedScopes: 'all', effectiveScopes: ['global'] }}
        isTrusted={false}
        hasWorkspace={true}
        scope="local"
        isProcessing={false}
        onNavigate={jest.fn()}
        onScopeChange={jest.fn()}
        onUpdate={jest.fn()}
        onRepair={jest.fn()}
      />,
    )

    const scopeTrigger = screen.getByRole('button', { name: /installation scope/i })
    expect(scopeTrigger).toBeDisabled()
    expect(scopeTrigger).toHaveTextContent('Global')
  })

  it('shows only global scope when user setting is global', async () => {
    const user = userEvent.setup()
    render(
      <HomePage
        registry={registry}
        installedSkills={{}}
        policy={{ allowedScopes: 'global', effectiveScopes: ['global'] }}
        isTrusted={true}
        hasWorkspace={true}
        scope="local"
        isProcessing={false}
        onNavigate={jest.fn()}
        onScopeChange={jest.fn()}
        onUpdate={jest.fn()}
        onRepair={jest.fn()}
      />,
    )

    const scopeTrigger = screen.getByRole('button', { name: /installation scope/i })
    expect(scopeTrigger).toHaveTextContent('Global')

    await user.click(scopeTrigger)
    expect(screen.queryByRole('option', { name: 'Local' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Global' })).toBeInTheDocument()
  })

  it('shows only local scope when user setting is local', async () => {
    const user = userEvent.setup()
    render(
      <HomePage
        registry={registry}
        installedSkills={{}}
        policy={{ allowedScopes: 'local', effectiveScopes: ['local'] }}
        isTrusted={true}
        hasWorkspace={true}
        scope="global"
        isProcessing={false}
        onNavigate={jest.fn()}
        onScopeChange={jest.fn()}
        onUpdate={jest.fn()}
        onRepair={jest.fn()}
      />,
    )

    const scopeTrigger = screen.getByRole('button', { name: /installation scope/i })
    expect(scopeTrigger).toHaveTextContent('Local')

    await user.click(scopeTrigger)
    expect(screen.getByRole('option', { name: 'Local' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Global' })).not.toBeInTheDocument()
  })

  it('does not render scope selector when user setting is none', () => {
    render(
      <HomePage
        registry={registry}
        installedSkills={{}}
        policy={{ allowedScopes: 'none', effectiveScopes: [], blockedReason: 'policy-none' }}
        isTrusted={true}
        hasWorkspace={true}
        scope="local"
        isProcessing={false}
        onNavigate={jest.fn()}
        onScopeChange={jest.fn()}
        onUpdate={jest.fn()}
        onRepair={jest.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: /installation scope/i })).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <HomePage
        registry={registry}
        installedSkills={{}}
        policy={{ allowedScopes: 'all', effectiveScopes: ['local', 'global'] }}
        isTrusted={true}
        hasWorkspace={true}
        scope="local"
        isProcessing={false}
        onNavigate={jest.fn()}
        onScopeChange={jest.fn()}
        onUpdate={jest.fn()}
        onRepair={jest.fn()}
      />,
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
