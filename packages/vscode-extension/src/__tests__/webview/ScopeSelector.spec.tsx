import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import jestAxe from 'jest-axe'
import { ScopeSelector } from '../../webview/components/ScopeSelector'

const { axe, toHaveNoViolations } = jestAxe
expect.extend(toHaveNoViolations)

describe('ScopeSelector', () => {
  it('renders local and global options by default', () => {
    render(<ScopeSelector value="local" onChange={jest.fn()} />)

    expect(screen.getByRole('option', { name: 'Local' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Global' })).toBeInTheDocument()
    expect(screen.getByText('Installation scope')).toHaveClass('sr-only')
  })

  it('shows only the global option when policy is global', () => {
    render(<ScopeSelector value="local" onChange={jest.fn()} allowedScopes="global" />)

    expect(screen.getByRole('option', { name: 'Global' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Local' })).not.toBeInTheDocument()
  })

  it('shows only the local option when policy is local', () => {
    render(<ScopeSelector value="global" onChange={jest.fn()} allowedScopes="local" />)

    expect(screen.getByRole('option', { name: 'Local' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Global' })).not.toBeInTheDocument()
  })

  it('does not render the selector when policy is none', () => {
    render(<ScopeSelector value="local" onChange={jest.fn()} allowedScopes="none" />)

    expect(screen.queryByRole('combobox', { name: /installation scope/i })).not.toBeInTheDocument()
  })

  it('calls onChange when selection updates', async () => {
    const onChange = jest.fn()
    const user = userEvent.setup()
    render(<ScopeSelector value="local" onChange={onChange} />)

    await user.selectOptions(screen.getByRole('combobox', { name: /installation scope/i }), 'global')
    expect(onChange).toHaveBeenCalledWith('global')
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

    const select = screen.getByRole('combobox', { name: /installation scope/i })
    expect(select).toBeDisabled()
    expect(select).toHaveAttribute('title', 'Local scope is unavailable in Restricted Mode')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<ScopeSelector value="local" onChange={jest.fn()} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
