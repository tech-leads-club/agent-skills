/** @jest-environment jsdom */
import { render } from '@testing-library/react'
import React from 'react'

jest.mock('../../services/category-colors', () => ({
  getColorForCategory: (id: string) => (id === 'web' ? '#3b82f6' : '#64748b'),
}))

jest.mock('../../services/markdown-parser', () => ({
  parseMarkdown: (raw: string) => {
    const lines = raw
      .replace(/^---[\s\S]*?---\n*/m, '')
      .split('\n')
      .filter(Boolean)
    return lines.map((line: string) => {
      const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
      if (headingMatch) return { type: 'heading', level: headingMatch[1].length, text: headingMatch[2] }
      const listMatch = line.match(/^[-*]\s+(.+)$/)
      if (listMatch) return { type: 'list-item', text: listMatch[1], indent: 0 }
      return { type: 'paragraph', text: line }
    })
  },
}))

jest.mock('chalk', () => {
  const passthrough = (text: string) => text
  const chainableFn = Object.assign(passthrough, {
    bold: passthrough,
    dim: passthrough,
    underline: passthrough,
    italic: passthrough,
  })

  return {
    __esModule: true,
    default: {
      hex: () => chainableFn,
      bold: passthrough,
      dim: passthrough,
      underline: passthrough,
      italic: passthrough,
    },
  }
})

jest.mock('../../theme', () => ({
  colors: {
    primary: '#3b82f6',
    primaryLight: '#60a5fa',
    accent: '#06b6d4',
    text: '#f8fafc',
    textDim: '#94a3b8',
    textMuted: '#64748b',
    border: '#334155',
    bg: '#0f172a',
    bgLight: '#1e293b',
    success: '#22c55e',
    error: '#ef4444',
  },
  symbols: {
    sparkle: '✦',
    diamond: '◆',
    arrow: '›',
    dot: '·',
    bullet: '▸',
    cross: '✗',
    info: 'ℹ',
    arrowDown: '↓',
    arrowUp: '↑',
    bar: '│',
  },
}))

jest.mock('ink', () => ({
  Box: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
    const {
      flexDirection,
      width,
      height,
      marginTop,
      marginBottom,
      paddingX,
      paddingY,
      paddingLeft,
      borderStyle,
      borderColor,
      flexGrow,
      flexShrink,
      justifyContent,
      alignItems,
      gap,
      overflow,
      overflowX,
      overflowY,
      minHeight,
      ...validProps
    } = props
    void flexDirection
    void width
    void height
    void marginTop
    void marginBottom
    void paddingX
    void paddingY
    void paddingLeft
    void borderStyle
    void borderColor
    void flexGrow
    void flexShrink
    void justifyContent
    void alignItems
    void gap
    void overflow
    void overflowX
    void overflowY
    void minHeight
    return (
      <div data-testid="box" {...validProps}>
        {children}
      </div>
    )
  },
  Text: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
    const { bold, underline, dimColor, wrap, backgroundColor, ...validProps } = props
    void bold
    void underline
    void dimColor
    void wrap
    void backgroundColor
    return (
      <span data-testid="text" {...validProps}>
        {children}
      </span>
    )
  },
  useStdout: () => ({ stdout: { rows: 40, columns: 140 } }),
  useInput: jest.fn(),
}))

jest.mock('ink-spinner', () => ({
  __esModule: true,
  default: () => <span data-testid="spinner">⠋</span>,
}))

const mockUseSkillContent = jest.fn()
jest.mock('../../hooks/useSkillContent', () => ({
  useSkillContent: (...args: unknown[]) => mockUseSkillContent(...args),
}))

import type { SkillInfo } from '../../types'
import { SkillDetailPanel } from '../SkillDetailPanel'

const mockSkill: SkillInfo = {
  name: 'api-designer',
  description: 'Design RESTful APIs with best practices',
  category: 'web',
  path: '/path/to/skill',
}

describe('SkillDetailPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders nothing when skill is null', () => {
    mockUseSkillContent.mockReturnValue({ metadata: null, content: null, loading: false, error: null })
    const { container } = render(<SkillDetailPanel skill={null} onClose={jest.fn()} />)
    expect(container.innerHTML).toBe('')
  })

  it('shows loading state', () => {
    mockUseSkillContent.mockReturnValue({ metadata: null, content: null, loading: true, error: null })
    const { container } = render(<SkillDetailPanel skill={mockSkill} onClose={jest.fn()} />)
    expect(container.textContent).toContain('Loading')
  })

  it('shows error state', () => {
    mockUseSkillContent.mockReturnValue({ metadata: null, content: null, loading: false, error: 'Network error' })
    const { container } = render(<SkillDetailPanel skill={mockSkill} onClose={jest.fn()} />)
    expect(container.textContent).toContain('Network error')
  })

  it('displays skill metadata header', () => {
    mockUseSkillContent.mockReturnValue({
      metadata: { name: 'api-designer', author: 'techleads', files: ['SKILL.md', 'README.md'] },
      content: '# API Designer\n\nDesign APIs.',
      loading: false,
      error: null,
    })
    const { container } = render(<SkillDetailPanel skill={mockSkill} onClose={jest.fn()} />)
    expect(container.textContent).toContain('api-designer')
    expect(container.textContent).toContain('web')
    expect(container.textContent).toContain('@techleads')
    expect(container.textContent).toContain('2 files')
  })

  it('displays singular file count for 1 file', () => {
    mockUseSkillContent.mockReturnValue({
      metadata: { name: 'api-designer', files: ['SKILL.md'] },
      content: '# Title',
      loading: false,
      error: null,
    })
    const { container } = render(<SkillDetailPanel skill={mockSkill} onClose={jest.fn()} />)
    expect(container.textContent).toContain('1 file')
    expect(container.textContent).not.toContain('1 files')
  })

  it('renders parsed markdown content as formatted text', () => {
    mockUseSkillContent.mockReturnValue({
      metadata: { name: 'api-designer', files: ['SKILL.md'] },
      content: '# My Skill\n\nA paragraph here.\n\n- Item one\n- Item two',
      loading: false,
      error: null,
    })
    const { container } = render(<SkillDetailPanel skill={mockSkill} onClose={jest.fn()} />)
    // Content is pre-formatted with chalk into a single string
    expect(container.textContent).toContain('My Skill')
    expect(container.textContent).toContain('A paragraph here.')
    expect(container.textContent).toContain('Item one')
  })

  it('shows panel title bar with expand and close hints', () => {
    mockUseSkillContent.mockReturnValue({ metadata: null, content: null, loading: true, error: null })
    const { container } = render(<SkillDetailPanel skill={mockSkill} onClose={jest.fn()} />)
    expect(container.textContent).toContain('Skill Details')
    expect(container.textContent).toContain('f')
    expect(container.textContent).toContain('Esc')
  })

  it('hides author when not available', () => {
    mockUseSkillContent.mockReturnValue({
      metadata: { name: 'api-designer', files: ['SKILL.md'] },
      content: '# Title',
      loading: false,
      error: null,
    })
    const { container } = render(<SkillDetailPanel skill={mockSkill} onClose={jest.fn()} />)
    expect(container.textContent).not.toContain('@')
  })

  it('displays skill description from props', () => {
    mockUseSkillContent.mockReturnValue({
      metadata: { name: 'api-designer', files: [] },
      content: '# Title',
      loading: false,
      error: null,
    })
    const { container } = render(<SkillDetailPanel skill={mockSkill} onClose={jest.fn()} />)
    expect(container.textContent).toContain('Design RESTful APIs with best practices')
  })

  it('always shows name, category, and description when metadata loads', () => {
    const skills: SkillInfo[] = [
      { name: 'skill-a', description: 'Desc A', category: 'web', path: '' },
      { name: 'skill-b', description: 'Desc B', category: 'devops', path: '' },
      { name: 'skill-c', description: 'Desc C', category: 'ai', path: '' },
    ]
    for (const skill of skills) {
      mockUseSkillContent.mockReturnValue({
        metadata: { name: skill.name, files: ['SKILL.md'], author: 'author' },
        content: '# Content',
        loading: false,
        error: null,
      })
      const { container, unmount } = render(<SkillDetailPanel skill={skill} onClose={jest.fn()} />)
      expect(container.textContent).toContain(skill.name)
      expect(container.textContent).toContain(skill.category)
      expect(container.textContent).toContain(skill.description)
      unmount()
    }
  })
})
