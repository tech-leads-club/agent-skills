import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import jestAxe from 'jest-axe'
import { AgentSelectCard } from '../../webview/components/AgentSelectCard'

const { axe, toHaveNoViolations } = jestAxe
expect.extend(toHaveNoViolations)

const agent = { agent: 'cursor', displayName: 'Cursor' }

describe('AgentSelectCard', () => {
  it('renders name and company only', () => {
    render(<AgentSelectCard agent={agent} company="Anysphere" isSelected={false} onToggle={jest.fn()} />)
    expect(screen.getByText('Cursor')).toBeInTheDocument()
    expect(screen.getByText('Anysphere')).toBeInTheDocument()
  })

  it('toggles checkbox selection', async () => {
    const onToggle = jest.fn()
    const user = userEvent.setup()
    render(<AgentSelectCard agent={agent} company="Anysphere" isSelected={false} onToggle={onToggle} />)

    await user.click(screen.getByRole('checkbox', { name: /select cursor/i }))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <AgentSelectCard agent={agent} company="Anysphere" isSelected={true} onToggle={jest.fn()} />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
