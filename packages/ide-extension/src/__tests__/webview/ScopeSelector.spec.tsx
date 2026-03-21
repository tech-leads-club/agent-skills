import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import jestAxe from 'jest-axe'
import { useState } from 'react'
import type { ActionRequest } from '../../shared/types'
import { ScopeSelector } from '../../webview/components/ScopeSelector'
import { getState, setState } from '../../webview/lib/vscode-api'

jest.mock('../../webview/lib/vscode-api', () => ({
  getState: jest.fn(),
  setState: jest.fn(),
}))

const { axe } = jestAxe

describe('ScopeSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getState as jest.Mock).mockReturnValue(undefined)
  })

  it('renders local and global options by default', async () => {
    const user = userEvent.setup()
    render(<ScopeSelector value="local" onChange={jest.fn()} />)

    const trigger = screen.getByRole('button', { name: /installation scope/i })
    expect(trigger).toHaveTextContent('Local')

    await user.click(trigger)
    expect(screen.getByRole('option', { name: 'Local' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Global' })).toBeInTheDocument()
    expect(screen.getByText('Installation scope')).toHaveClass('sr-only')
  })

  it('shows only the global option when policy is global', async () => {
    const user = userEvent.setup()
    render(<ScopeSelector value="local" onChange={jest.fn()} allowedScopes="global" />)

    const trigger = screen.getByRole('button', { name: /installation scope/i })
    expect(trigger).toHaveTextContent('Global')

    await user.click(trigger)
    expect(screen.getByRole('option', { name: 'Global' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Local' })).not.toBeInTheDocument()
  })

  it('shows only the local option when policy is local', async () => {
    const user = userEvent.setup()
    render(<ScopeSelector value="global" onChange={jest.fn()} allowedScopes="local" />)

    const trigger = screen.getByRole('button', { name: /installation scope/i })
    expect(trigger).toHaveTextContent('Local')

    await user.click(trigger)
    expect(screen.getByRole('option', { name: 'Local' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Global' })).not.toBeInTheDocument()
  })

  it('does not render the selector when policy is none', () => {
    render(<ScopeSelector value="local" onChange={jest.fn()} allowedScopes="none" />)

    expect(screen.queryByRole('button', { name: /installation scope/i })).not.toBeInTheDocument()
  })

  it('calls onChange when selection updates', async () => {
    const onChange = jest.fn()
    const user = userEvent.setup()
    render(<ScopeSelector value="local" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /installation scope/i }))
    await user.click(screen.getByRole('option', { name: 'Global' }))
    expect(onChange).toHaveBeenCalledWith('global')
  })

  it('restores persisted scope when user setting allows all scopes', () => {
    const onChange = jest.fn()
    ;(getState as jest.Mock).mockReturnValue({
      scopeSelectorState: { selectedScope: 'global' },
    })

    render(<ScopeSelector value="local" onChange={onChange} allowedScopes="all" />)

    expect(onChange).toHaveBeenCalledWith('global')
  })

  it('updates persisted scope when policy restricts available scopes', () => {
    ;(getState as jest.Mock).mockReturnValue({
      existingState: 'keep-me',
      scopeSelectorState: { selectedScope: 'local' },
    })

    render(<ScopeSelector value="local" onChange={jest.fn()} allowedScopes="global" />)

    expect(setState).toHaveBeenCalledWith({
      existingState: 'keep-me',
      scopeSelectorState: { selectedScope: 'global' },
    })
  })

  it('keeps user-selected scope in all mode after initial restore', async () => {
    const user = userEvent.setup()
    ;(getState as jest.Mock).mockReturnValue({
      scopeSelectorState: { selectedScope: 'local' },
    })

    function StatefulWrapper() {
      const [scope, setScope] = useState<ActionRequest['scope']>('local')
      return <ScopeSelector value={scope} onChange={setScope} allowedScopes="all" />
    }

    render(<StatefulWrapper />)

    await user.click(screen.getByRole('button', { name: /installation scope/i }))
    await user.click(screen.getByRole('option', { name: 'Global' }))

    expect(screen.getByRole('button', { name: /installation scope/i })).toHaveTextContent('Global')
  })

  it('supports disabled mode with tooltip', () => {
    render(
      <ScopeSelector
        value="global"
        onChange={jest.fn()}
        allowedScopes="all"
        disabled={true}
        disabledReason="Local scope is unavailable in Restricted Mode"
      />,
    )

    const trigger = screen.getByRole('button', { name: /installation scope/i })
    expect(trigger).toBeDisabled()
    expect(trigger).toHaveAttribute('title', 'Local scope is unavailable in Restricted Mode')
  })

  it('supports Arrow/Home/End/Escape keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<ScopeSelector value="local" onChange={jest.fn()} action="uninstall" />)

    const trigger = screen.getByRole('button', { name: /installation scope/i })
    trigger.focus()
    await user.keyboard('{ArrowDown}')

    expect(screen.getByRole('listbox', { name: /installation scope/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Local' })).toHaveFocus()

    await user.keyboard('{End}')
    expect(screen.getByRole('option', { name: 'Both' })).toHaveFocus()

    await user.keyboard('{Home}')
    expect(screen.getByRole('option', { name: 'Local' })).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox', { name: /installation scope/i })).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('selects option with Enter and Space and closes menu', async () => {
    const user = userEvent.setup()

    function StatefulWrapper() {
      const [scope, setScope] = useState<ActionRequest['scope']>('local')
      return <ScopeSelector value={scope} onChange={setScope} action="uninstall" />
    }

    render(<StatefulWrapper />)
    const trigger = screen.getByRole('button', { name: /installation scope/i })

    trigger.focus()
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')

    expect(trigger).toHaveTextContent('Global')
    expect(screen.queryByRole('listbox', { name: /installation scope/i })).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()

    trigger.focus()
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown} ')

    expect(trigger).toHaveTextContent('Both')
    expect(screen.queryByRole('listbox', { name: /installation scope/i })).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<ScopeSelector value="local" onChange={jest.fn()} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no accessibility violations when menu is open', async () => {
    const user = userEvent.setup()
    const { container } = render(<ScopeSelector value="local" onChange={jest.fn()} action="uninstall" />)

    const trigger = screen.getByRole('button', { name: /installation scope/i })
    await user.click(trigger)

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
