import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import jestAxe from 'jest-axe'
import { AgentSelectCard } from '../../webview/components/AgentSelectCard'

const { axe } = jestAxe

const agent = { agent: 'cursor', displayName: 'Cursor', company: 'Anysphere' }

describe('AgentSelectCard', () => {
  it('renders agent name only', () => {
    render(<AgentSelectCard agent={agent} isSelected={false} onToggle={jest.fn()} />)
    expect(screen.getByText('Cursor')).toBeInTheDocument()
  })

  it('toggles checkbox selection', async () => {
    const onToggle = jest.fn()
    const user = userEvent.setup()
    render(<AgentSelectCard agent={agent} isSelected={false} onToggle={onToggle} />)

    await user.click(screen.getByRole('checkbox', { name: /select cursor/i }))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<AgentSelectCard agent={agent} isSelected={true} onToggle={jest.fn()} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
