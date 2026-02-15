import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { CategoryFilter } from '../../webview/components/CategoryFilter'

expect.extend(toHaveNoViolations)

describe('CategoryFilter Accessibility', () => {
  const mockCategories = [
    { key: 'security', category: { name: 'Security', description: 'Security tools' } },
    { key: 'testing', category: { name: 'Testing', description: 'Testing tools' } },
  ]

  const defaultProps = {
    categories: mockCategories,
    activeCategory: null,
    onSelect: jest.fn(),
    skillCounts: { security: 5, testing: 3 },
  }

  it('should have group role for accessibility', () => {
    render(<CategoryFilter {...defaultProps} />)
    const group = screen.getByRole('group', { name: /filter by category/i })
    expect(group).toBeInTheDocument()
  })

  it('should have accessible labels for all chips', () => {
    render(<CategoryFilter {...defaultProps} />)

    expect(screen.getByRole('button', { name: /all.*8/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /security.*5/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /testing.*3/i })).toBeInTheDocument()
  })

  it('should indicate active state with aria-pressed', () => {
    render(<CategoryFilter {...defaultProps} activeCategory="security" />)

    const allChip = screen.getByRole('button', { name: /all/i })
    const securityChip = screen.getByRole('button', { name: /security/i })

    expect(allChip).toHaveAttribute('aria-pressed', 'false')
    expect(securityChip).toHaveAttribute('aria-pressed', 'true')
  })

  it('should be keyboard navigable with Tab', async () => {
    const user = userEvent.setup()
    render(<CategoryFilter {...defaultProps} />)

    const allChip = screen.getByRole('button', { name: /all/i })
    const securityChip = screen.getByRole('button', { name: /security/i })

    await user.tab()
    expect(allChip).toHaveFocus()

    await user.tab()
    expect(securityChip).toHaveFocus()
  })

  it('should activate chip with Enter key', async () => {
    const onSelect = jest.fn()
    const user = userEvent.setup()
    render(<CategoryFilter {...defaultProps} onSelect={onSelect} />)

    const securityChip = screen.getByRole('button', { name: /security/i })
    securityChip.focus()
    await user.keyboard('{Enter}')

    expect(onSelect).toHaveBeenCalledWith('security')
  })

  it('should activate chip with Space key', async () => {
    const onSelect = jest.fn()
    const user = userEvent.setup()
    render(<CategoryFilter {...defaultProps} onSelect={onSelect} />)

    const securityChip = screen.getByRole('button', { name: /security/i })
    securityChip.focus()
    await user.keyboard(' ')

    expect(onSelect).toHaveBeenCalledWith('security')
  })

  it('should deselect active category when clicked again', async () => {
    const onSelect = jest.fn()
    const user = userEvent.setup()
    render(<CategoryFilter {...defaultProps} activeCategory="security" onSelect={onSelect} />)

    const securityChip = screen.getByRole('button', { name: /security/i })
    await user.click(securityChip)

    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it('should calculate total count correctly', () => {
    render(<CategoryFilter {...defaultProps} />)
    const allChip = screen.getByRole('button', { name: /all/i })
    expect(allChip).toHaveTextContent('All (8)')
  })

  it('should apply active class to active chip', () => {
    render(<CategoryFilter {...defaultProps} activeCategory="security" />)
    const securityChip = screen.getByRole('button', { name: /security/i })
    expect(securityChip).toHaveClass('active')
  })

  it('should handle mouse clicks on chips', async () => {
    const onSelect = jest.fn()
    const user = userEvent.setup()
    render(<CategoryFilter {...defaultProps} onSelect={onSelect} />)

    const testingChip = screen.getByRole('button', { name: /testing/i })
    await user.click(testingChip)

    expect(onSelect).toHaveBeenCalledWith('testing')
  })

  it('should have visible labels not just aria-labels', () => {
    render(<CategoryFilter {...defaultProps} />)

    expect(screen.getByText(/all/i)).toBeVisible()
    expect(screen.getByText(/security/i)).toBeVisible()
    expect(screen.getByText(/testing/i)).toBeVisible()
  })

  describe('Automated WCAG Checks', () => {
    it('should have no accessibility violations (no selection)', async () => {
      const { container } = render(<CategoryFilter {...defaultProps} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations (active category)', async () => {
      const { container } = render(<CategoryFilter {...defaultProps} activeCategory="security" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
