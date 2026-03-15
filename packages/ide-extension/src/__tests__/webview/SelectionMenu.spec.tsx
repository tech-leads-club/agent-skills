import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import jestAxe from 'jest-axe'
import { SelectionMenu } from '../../webview/components/SelectionMenu'

const { axe, toHaveNoViolations } = jestAxe
expect.extend(toHaveNoViolations)

describe('SelectionMenu', () => {
  it('shows selected count and clear button state', () => {
    render(<SelectionMenu selectedCount={0} allSelected={false} onToggleAll={jest.fn()} onClear={jest.fn()} />)
    expect(screen.getByText('0 selected')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /clear selection/i })).toBeDisabled()
  })

  it('toggles check-all label based on allSelected', () => {
    const { rerender } = render(
      <SelectionMenu selectedCount={1} allSelected={false} onToggleAll={jest.fn()} onClear={jest.fn()} />,
    )
    expect(screen.getByRole('button', { name: /check all/i })).toBeInTheDocument()

    rerender(<SelectionMenu selectedCount={1} allSelected={true} onToggleAll={jest.fn()} onClear={jest.fn()} />)
    expect(screen.getByRole('button', { name: /uncheck all/i })).toBeInTheDocument()
  })

  it('fires callbacks', async () => {
    const user = userEvent.setup()
    const onToggleAll = jest.fn()
    const onClear = jest.fn()

    render(<SelectionMenu selectedCount={2} allSelected={false} onToggleAll={onToggleAll} onClear={onClear} />)

    await user.click(screen.getByRole('button', { name: /check all/i }))
    await user.click(screen.getByRole('button', { name: /clear selection/i }))
    expect(onToggleAll).toHaveBeenCalledTimes(1)
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <SelectionMenu selectedCount={2} allSelected={false} onToggleAll={jest.fn()} onClear={jest.fn()} />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
