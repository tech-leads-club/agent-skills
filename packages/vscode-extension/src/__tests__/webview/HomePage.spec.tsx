import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import jestAxe from 'jest-axe'
import type { SkillRegistry } from '../../shared/types'
import { HomePage } from '../../webview/views/HomePage'

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

describe('HomePage', () => {
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

    const install = screen.getByRole('button', { name: /install add new capabilities/i })
    expect(install).toBeDisabled()
    expect(install).toHaveAttribute('title', 'All skills are already installed')
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

    const scope = screen.getByRole('combobox', { name: /installation scope/i })
    expect(scope).toBeDisabled()
    expect(scope).toHaveValue('global')
  })

  it('shows only global scope when user setting is global', () => {
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

    const scope = screen.getByRole('combobox', { name: /installation scope/i })
    expect(scope).toHaveValue('global')
    expect(screen.queryByRole('option', { name: 'Local' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Global' })).toBeInTheDocument()
  })

  it('shows only local scope when user setting is local', () => {
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

    const scope = screen.getByRole('combobox', { name: /installation scope/i })
    expect(scope).toHaveValue('local')
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

    expect(screen.queryByRole('combobox', { name: /installation scope/i })).not.toBeInTheDocument()
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
