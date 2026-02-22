import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import jestAxe from 'jest-axe'
import { ScopeSelector } from '../../webview/components/ScopeSelector'

const { axe, toHaveNoViolations } = jestAxe
expect.extend(toHaveNoViolations)

describe('ScopeSelector', () => {
  it('renders local and global options', () => {
    render(<ScopeSelector value="local" onChange={jest.fn()} />)

    expect(screen.getByRole('option', { name: 'Local' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Global' })).toBeInTheDocument()
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
