import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import type { Category, Skill } from '../../shared/types'
import { SkillGrid } from '../../webview/components/SkillGrid'

expect.extend(toHaveNoViolations)

describe('SkillGrid Accessibility', () => {
  const mockSkills: Skill[] = [
    {
      name: 'skill-one',
      description: 'First skill description',
      category: 'security',
      path: '.agent/skills/skill-one',
      files: ['SKILL.md'],
      contentHash: 'hash1',
      author: 'Alice',
      version: '1.0.0',
    },
    {
      name: 'skill-two',
      description: 'Second skill description',
      category: 'testing',
      path: '.agent/skills/skill-two',
      files: ['SKILL.md'],
      contentHash: 'hash2',
    },
  ]

  const mockCategories: Record<string, Category> = {
    security: { name: 'Security', description: 'Security tools' },
    testing: { name: 'Testing', description: 'Testing tools' },
  }

  const defaultProps = {
    skills: mockSkills,
    categories: mockCategories,
  }

  it('should render all skill cards', () => {
    render(<SkillGrid {...defaultProps} />)

    const cards = screen.getAllByRole('button')
    expect(cards).toHaveLength(2)
  })

  it('should show empty state with role="status"', () => {
    render(<SkillGrid skills={[]} categories={mockCategories} />)

    const emptyState = screen.getByRole('status')
    expect(emptyState).toHaveTextContent(/no skills found/i)
  })

  it('should announce empty state to screen readers', () => {
    render(<SkillGrid skills={[]} categories={mockCategories} />)

    const status = screen.getByRole('status')
    expect(status).toBeInTheDocument()
  })

  it('should render cards in correct order', () => {
    render(<SkillGrid {...defaultProps} />)

    const cards = screen.getAllByRole('button')
    expect(cards[0]).toHaveAccessibleName(/skill-one/i)
    expect(cards[1]).toHaveAccessibleName(/skill-two/i)
  })

  it('should pass correct category names to skill cards', () => {
    render(<SkillGrid {...defaultProps} />)

    // Check that category display names are resolved correctly
    expect(screen.getByText('Security')).toBeInTheDocument()
    expect(screen.getByText('Testing')).toBeInTheDocument()
  })

  it('should use skill name as React key (indirectly tested via no duplicate key warnings)', () => {
    // If keys are duplicated, React will warn. This test ensures no warnings.
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    render(<SkillGrid {...defaultProps} />)

    expect(consoleSpy).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('should handle skills with missing category gracefully', () => {
    const skillWithMissingCategory: Skill = {
      name: 'orphan-skill',
      description: 'Skill with missing category',
      category: 'nonexistent',
      path: '.agent/skills/orphan',
      files: ['SKILL.md'],
      contentHash: 'hash3',
    }

    render(<SkillGrid skills={[skillWithMissingCategory]} categories={mockCategories} />)

    // Should still render the card
    expect(screen.getByRole('button')).toBeInTheDocument()
    // Category name should fallback to category key
    expect(screen.getByText('nonexistent')).toBeInTheDocument()
  })

  it('should maintain focus order for keyboard navigation', () => {
    render(<SkillGrid {...defaultProps} />)

    const cards = screen.getAllByRole('button')

    // All cards should be focusable in order
    cards.forEach((card) => {
      expect(card).toHaveAttribute('tabIndex', '0')
    })
  })

  it('should have container with appropriate structure', () => {
    const { container } = render(<SkillGrid {...defaultProps} />)

    const grid = container.querySelector('.skill-grid')
    expect(grid).toBeInTheDocument()
  })

  it('should render different skills with unique attributes', () => {
    render(<SkillGrid {...defaultProps} />)

    const skillOne = screen.getByRole('button', { name: /skill-one/i })
    const skillTwo = screen.getByRole('button', { name: /skill-two/i })

    expect(skillOne).not.toBe(skillTwo)
  })

  it('should handle single skill correctly', () => {
    render(<SkillGrid skills={[mockSkills[0]]} categories={mockCategories} />)

    const cards = screen.getAllByRole('button')
    expect(cards).toHaveLength(1)
  })

  it('should handle large number of skills', () => {
    const manySkills = Array.from({ length: 50 }, (_, i) => ({
      name: `skill-${i}`,
      description: `Description ${i}`,
      category: 'testing',
      path: `.agent/skills/skill-${i}`,
      files: ['SKILL.md'],
      contentHash: `hash${i}`,
    }))

    render(<SkillGrid skills={manySkills} categories={mockCategories} />)

    const cards = screen.getAllByRole('button')
    expect(cards).toHaveLength(50)
  })

  it('should maintain accessibility with mixed skill data', () => {
    const mixedSkills: Skill[] = [
      {
        name: 'minimal-skill',
        description: 'Minimal',
        category: 'security',
        path: '.agent/skills/minimal',
        files: ['SKILL.md'],
        contentHash: 'hash',
      },
      {
        name: 'full-skill',
        description: 'Full',
        category: 'testing',
        path: '.agent/skills/full',
        files: ['SKILL.md'],
        contentHash: 'hash',
        author: 'Bob',
        version: '2.0.0',
      },
    ]

    render(<SkillGrid skills={mixedSkills} categories={mockCategories} />)

    const cards = screen.getAllByRole('button')
    expect(cards).toHaveLength(2)

    // Both should have proper labels
    expect(cards[0]).toHaveAccessibleName(/minimal-skill/i)
    expect(cards[1]).toHaveAccessibleName(/full-skill/i)
  })

  describe('Automated WCAG Checks', () => {
    it('should have no accessibility violations (with skills)', async () => {
      const { container } = render(<SkillGrid {...defaultProps} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations (empty state)', async () => {
      const { container } = render(<SkillGrid skills={[]} categories={mockCategories} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
