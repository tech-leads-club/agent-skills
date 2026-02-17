import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import jestAxe from 'jest-axe'
import type { AgentInstallInfo, Skill } from '../../shared/types'
import { SkillCard } from '../../webview/components/SkillCard'

const { axe, toHaveNoViolations } = jestAxe
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

  const mockAgents: AgentInstallInfo[] = [
    { agent: 'cursor', displayName: 'Cursor', local: false, global: false, corrupted: false },
  ]

  const defaultProps = {
    skill: mockSkill,
    categoryName: 'Testing',
    installedInfo: null,
    isOperating: false,
    hasUpdate: false,
    isCorrupted: false,
    agents: mockAgents,
    onUpdate: jest.fn(),
    onRepair: jest.fn(),
    onRequestAgentPick: jest.fn(),
  }

  it('should have article role for the card element', () => {
    render(<SkillCard {...defaultProps} />)
    const card = screen.getByRole('article')
    expect(card).toBeInTheDocument()
  })

  it('should have comprehensive aria-label with all skill info', () => {
    render(<SkillCard {...defaultProps} />)
    const card = screen.getByRole('article')

    const ariaLabel = card.getAttribute('aria-label')
    expect(ariaLabel).toContain('test-skill')
    expect(ariaLabel).toContain('A comprehensive testing skill')
    expect(ariaLabel).toContain('Category: Testing')
    expect(ariaLabel).toContain('By John Doe')
    expect(ariaLabel).toContain('Version 1.0.0')
  })

  it('should omit author from aria-label if not provided', () => {
    const skillWithoutAuthor = { ...mockSkill, author: undefined }
    render(<SkillCard {...defaultProps} skill={skillWithoutAuthor} />)

    const card = screen.getByRole('article')
    const ariaLabel = card.getAttribute('aria-label')
    expect(ariaLabel).not.toContain('By')
  })

  it('should omit version from aria-label if not provided', () => {
    const skillWithoutVersion = { ...mockSkill, version: undefined }
    render(<SkillCard {...defaultProps} skill={skillWithoutVersion} />)

    const card = screen.getByRole('article')
    const ariaLabel = card.getAttribute('aria-label')
    expect(ariaLabel).not.toContain('Version')
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

  it('should have skill-card class', () => {
    render(<SkillCard {...defaultProps} />)
    const card = screen.getByRole('article')
    expect(card).toHaveClass('skill-card')
  })

  it('should show Add button when skill is not fully installed', () => {
    render(<SkillCard {...defaultProps} />)
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument()
  })

  it('should show Update button when hasUpdate is true', () => {
    render(<SkillCard {...defaultProps} hasUpdate={true} />)
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument()
  })

  it('should show Remove button when skill is installed', () => {
    const installedInfo = {
      local: true,
      global: false,
      agents: [{ agent: 'cursor', displayName: 'Cursor', local: true, global: false, corrupted: false }],
    }
    render(<SkillCard {...defaultProps} installedInfo={installedInfo} />)
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument()
  })

  it('should disable buttons when isOperating is true', () => {
    render(<SkillCard {...defaultProps} isOperating={true} />)
    const addButton = screen.getByRole('button', { name: /add/i })
    expect(addButton).toBeDisabled()
  })

  it('should show operating class when isOperating is true', () => {
    render(<SkillCard {...defaultProps} isOperating={true} />)
    const card = screen.getByRole('article')
    expect(card).toHaveClass('skill-card--operating')
  })

  it('should show operation message when operating', () => {
    render(<SkillCard {...defaultProps} isOperating={true} operationMessage="Installing..." />)
    expect(screen.getByText('Installing...')).toBeInTheDocument()
  })

  it('should set aria-busy when operating', () => {
    render(<SkillCard {...defaultProps} isOperating={true} />)
    const card = screen.getByRole('article')
    expect(card).toHaveAttribute('aria-busy', 'true')
  })

  it('should call onUpdate when Update button is clicked', async () => {
    const onUpdate = jest.fn()
    const user = userEvent.setup()
    render(<SkillCard {...defaultProps} hasUpdate={true} onUpdate={onUpdate} />)

    await user.click(screen.getByRole('button', { name: /update/i }))
    expect(onUpdate).toHaveBeenCalled()
  })

  it('should call onRequestAgentPick with "add" when Add button is clicked', async () => {
    const onRequestAgentPick = jest.fn()
    const user = userEvent.setup()
    render(<SkillCard {...defaultProps} onRequestAgentPick={onRequestAgentPick} />)

    await user.click(screen.getByRole('button', { name: /add/i }))
    expect(onRequestAgentPick).toHaveBeenCalledWith('add')
  })

  it('should call onRequestAgentPick with "remove" when Remove button is clicked', async () => {
    const onRequestAgentPick = jest.fn()
    const user = userEvent.setup()
    const installedInfo = {
      local: true,
      global: false,
      agents: [{ agent: 'cursor', displayName: 'Cursor', local: true, global: false, corrupted: false }],
    }
    render(<SkillCard {...defaultProps} installedInfo={installedInfo} onRequestAgentPick={onRequestAgentPick} />)

    await user.click(screen.getByRole('button', { name: /remove/i }))
    expect(onRequestAgentPick).toHaveBeenCalledWith('remove')
  })

  it('should show Repair button when isCorrupted is true', () => {
    render(<SkillCard {...defaultProps} isCorrupted={true} />)
    const repairButton = screen.getByRole('button', { name: /repair/i })
    expect(repairButton).toBeInTheDocument()
    expect(repairButton).toHaveClass('btn-repair')
    expect(repairButton.closest('.skill-card-actions')).toHaveClass('skill-card-actions')
    expect(screen.queryByRole('button', { name: /add/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /update/i })).not.toBeInTheDocument()
  })

  it('should show corrupted badge when isCorrupted is true', () => {
    render(<SkillCard {...defaultProps} isCorrupted={true} />)
    expect(screen.getByText(/⚠ Corrupted/i)).toBeInTheDocument()
  })

  it('should call onRepair when Repair button is clicked', async () => {
    const onRepair = jest.fn()
    const user = userEvent.setup()
    render(<SkillCard {...defaultProps} isCorrupted={true} onRepair={onRepair} />)

    await user.click(screen.getByRole('button', { name: /repair/i }))
    expect(onRepair).toHaveBeenCalled()
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
      const { container } = render(<SkillCard {...defaultProps} skill={minimalSkill} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
