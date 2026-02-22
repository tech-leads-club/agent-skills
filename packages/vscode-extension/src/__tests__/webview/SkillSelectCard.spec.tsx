import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import jestAxe from 'jest-axe'
import type { Skill } from '../../shared/types'
import { SkillSelectCard } from '../../webview/components/SkillSelectCard'

const { axe, toHaveNoViolations } = jestAxe
expect.extend(toHaveNoViolations)

const skill: Skill = {
  name: 'accessibility',
  description: 'Audit and improve accessibility',
  category: 'quality',
  path: 'skills/accessibility',
  files: ['SKILL.md'],
  contentHash: 'abc',
}

describe('SkillSelectCard', () => {
  it('renders title, description, and category', () => {
    render(<SkillSelectCard skill={skill} categoryName="Quality" isSelected={false} onToggle={jest.fn()} />)
    expect(screen.getByText('accessibility')).toBeInTheDocument()
    expect(screen.getByText('Quality')).toBeInTheDocument()
    expect(screen.getByText(/Audit and improve/i)).toBeInTheDocument()
  })

  it('keeps the full description available for hover and screen readers', () => {
    render(<SkillSelectCard skill={skill} categoryName="Quality" isSelected={false} onToggle={jest.fn()} />)

    const description = screen.getByText(skill.description)
    expect(description).toHaveAttribute('title', skill.description)

    const checkbox = screen.getByRole('checkbox', { name: /select accessibility/i })
    expect(checkbox).toHaveAccessibleDescription(skill.description)
  })

  it('toggles checkbox selection', async () => {
    const onToggle = jest.fn()
    const user = userEvent.setup()
    render(<SkillSelectCard skill={skill} categoryName="Quality" isSelected={false} onToggle={onToggle} />)

    await user.click(screen.getByRole('checkbox', { name: /select accessibility/i }))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <SkillSelectCard skill={skill} categoryName="Quality" isSelected={true} onToggle={jest.fn()} />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
