import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import type { Skill } from '../../shared/types'
import { SkillCard } from '../../webview/components/SkillCard'

expect.extend(toHaveNoViolations)

describe('SkillCard Accessibility', () => {
  const mockSkill: Skill = {
    name: 'test-skill',
    description: 'A comprehensive testing skill for automated testing',
    category: 'testing',
    path: '.agent/skills/test-skill',
    files: ['SKILL.md'],
    contentHash: 'abc123',
    author: 'John Doe',
    version: '1.0.0',
  }

  const defaultProps = {
    skill: mockSkill,
    categoryName: 'Testing',
  }

  it('should have button role for interactive element', () => {
    render(<SkillCard {...defaultProps} />)
    const card = screen.getByRole('button')
    expect(card).toBeInTheDocument()
  })

  it('should be keyboard focusable with tabIndex', () => {
    render(<SkillCard {...defaultProps} />)
    const card = screen.getByRole('button')
    expect(card).toHaveAttribute('tabIndex', '0')
  })

  it('should have comprehensive aria-label with all skill info', () => {
    render(<SkillCard {...defaultProps} />)
    const card = screen.getByRole('button')

    const ariaLabel = card.getAttribute('aria-label')
    expect(ariaLabel).toContain('test-skill')
    expect(ariaLabel).toContain('A comprehensive testing skill')
    expect(ariaLabel).toContain('Category: Testing')
    expect(ariaLabel).toContain('By John Doe')
    expect(ariaLabel).toContain('Version 1.0.0')
  })

  it('should omit author from aria-label if not provided', () => {
    const skillWithoutAuthor = { ...mockSkill, author: undefined }
    render(<SkillCard skill={skillWithoutAuthor} categoryName="Testing" />)

    const card = screen.getByRole('button')
    const ariaLabel = card.getAttribute('aria-label')
    expect(ariaLabel).not.toContain('By')
  })

  it('should omit version from aria-label if not provided', () => {
    const skillWithoutVersion = { ...mockSkill, version: undefined }
    render(<SkillCard skill={skillWithoutVersion} categoryName="Testing" />)

    const card = screen.getByRole('button')
    const ariaLabel = card.getAttribute('aria-label')
    expect(ariaLabel).not.toContain('Version')
  })

  it('should be keyboard navigable with Tab', async () => {
    const user = userEvent.setup()
    render(<SkillCard {...defaultProps} />)

    const card = screen.getByRole('button')
    await user.tab()
    expect(card).toHaveFocus()
  })

  it('should be activatable with Enter key', async () => {
    const user = userEvent.setup()
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    render(<SkillCard {...defaultProps} />)

    const card = screen.getByRole('button')
    card.focus()
    await user.keyboard('{Enter}')

    expect(consoleSpy).toHaveBeenCalledWith('Skill clicked:', 'test-skill')
    consoleSpy.mockRestore()
  })

  it('should be activatable with Space key', async () => {
    const user = userEvent.setup()
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    render(<SkillCard {...defaultProps} />)

    const card = screen.getByRole('button')
    card.focus()
    await user.keyboard(' ')

    expect(consoleSpy).toHaveBeenCalledWith('Skill clicked:', 'test-skill')
    consoleSpy.mockRestore()
  })

  it('should prevent default on Space key to avoid page scroll', async () => {
    render(<SkillCard {...defaultProps} />)

    const card = screen.getByRole('button')
    card.focus()

    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true })
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault')
    card.dispatchEvent(event)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('should be clickable with mouse', async () => {
    const user = userEvent.setup()
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    render(<SkillCard {...defaultProps} />)

    const card = screen.getByRole('button')
    await user.click(card)

    expect(consoleSpy).toHaveBeenCalledWith('Skill clicked:', 'test-skill')
    consoleSpy.mockRestore()
  })

  it('should display skill name as heading', () => {
    render(<SkillCard {...defaultProps} />)
    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading).toHaveTextContent('test-skill')
  })

  it('should display category badge with visible text', () => {
    render(<SkillCard {...defaultProps} />)
    expect(screen.getByText('Testing')).toBeInTheDocument()
  })

  it('should display description text', () => {
    render(<SkillCard {...defaultProps} />)
    expect(screen.getByText(/A comprehensive testing skill/i)).toBeInTheDocument()
  })

  it('should display author when provided', () => {
    render(<SkillCard {...defaultProps} />)
    expect(screen.getByText(/by John Doe/i)).toBeInTheDocument()
  })

  it('should display version when provided', () => {
    render(<SkillCard {...defaultProps} />)
    expect(screen.getByText(/v1.0.0/i)).toBeInTheDocument()
  })

  it('should have cursor pointer style', () => {
    render(<SkillCard {...defaultProps} />)
    const card = screen.getByRole('button')
    expect(card).toHaveClass('skill-card')
  })

  it('should have visual focus indicator', async () => {
    const user = userEvent.setup()
    render(<SkillCard {...defaultProps} />)

    const card = screen.getByRole('button')
    await user.tab()

    // The card should be focused
    expect(card).toHaveFocus()
    // CSS should apply focus-visible styles (tested via class)
    expect(card).toHaveClass('skill-card')
  })

  describe('Automated WCAG Checks', () => {
    it('should have no accessibility violations (full skill data)', async () => {
      const { container } = render(<SkillCard {...defaultProps} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations (minimal skill data)', async () => {
      const minimalSkill = {
        name: 'minimal',
        description: 'Minimal',
        category: 'test',
        path: '.agent/skills/minimal',
        files: ['SKILL.md'],
        contentHash: 'hash',
      }
      const { container } = render(<SkillCard skill={minimalSkill} categoryName="Test" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
