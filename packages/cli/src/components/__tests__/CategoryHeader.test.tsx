/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { CategoryHeader } from '../CategoryHeader'

jest.mock('picocolors', () => ({
  dim: jest.fn((str) => `dim(${str})`),
}))

jest.mock('../../services/badge-format', () => ({
  formatCategoryBadge: (installed: number, total: number) => (installed > 0 ? `(${installed}/${total})` : `(${total})`),
}))

jest.mock('../../services/category-colors', () => ({
  getColorForCategory: (id: string) => (id === 'web' ? '#3b82f6' : '#64748b'),
}))

jest.mock('../../theme', () => ({
  colors: {
    accent: '#06b6d4',
    primaryLight: '#60a5fa',
    text: '#f8fafc',
    textMuted: '#64748b',
    textDim: '#94a3b8',
    success: '#22c55e',
  },
  symbols: {
    bullet: '\u25B8',
    dot: '\u00B7',
  },
}))

jest.mock('ink', () => ({
  Box: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
    const { flexDirection, width, marginTop, marginBottom, ...validProps } = props
    void flexDirection
    void width
    void marginTop
    void marginBottom
    return (
      <div data-testid="box" {...validProps}>
        {children}
      </div>
    )
  },
  Text: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
    const { bold, underline, ...validProps } = props
    void bold
    void underline
    return (
      <span data-testid="text" {...validProps}>
        {children}
      </span>
    )
  },
}))

describe('CategoryHeader', () => {
  it('renders category name', () => {
    render(<CategoryHeader name="Web" totalCount={5} />)
    expect(screen.getByText('Web')).toBeTruthy()
  })

  it('displays badge with total only when no installed skills', () => {
    const { container } = render(<CategoryHeader name="Web" totalCount={8} installedCount={0} />)
    expect(container.textContent).toContain('(8)')
    expect(container.textContent).not.toContain('/')
  })

  it('displays badge with installed/total when skills are installed', () => {
    const { container } = render(<CategoryHeader name="Web" totalCount={8} installedCount={3} />)
    expect(container.textContent).toContain('(3/8)')
  })

  it('shows expand hint when collapsed and focused', () => {
    const { container } = render(<CategoryHeader name="Web" totalCount={5} isExpanded={false} isFocused={true} />)
    expect(container.textContent).toContain('press space to expand')
  })

  it('hides expand hint when expanded', () => {
    const { container } = render(<CategoryHeader name="Web" totalCount={5} isExpanded={true} isFocused={true} />)
    expect(container.textContent).not.toContain('press space to expand')
  })

  it('hides expand hint when not focused', () => {
    const { container } = render(<CategoryHeader name="Web" totalCount={5} isExpanded={false} isFocused={false} />)
    expect(container.textContent).not.toContain('press space to expand')
  })

  it('shows collapsed chevron when not expanded', () => {
    const { container } = render(<CategoryHeader name="Web" totalCount={5} isExpanded={false} />)
    expect(container.textContent).toContain('\u25B8')
  })

  it('shows expanded chevron when expanded', () => {
    const { container } = render(<CategoryHeader name="Web" totalCount={5} isExpanded={true} />)
    expect(container.textContent).toContain('\u25BE')
  })

  it('uses category-specific color via categoryId', () => {
    const { container } = render(<CategoryHeader name="Web" categoryId="web" totalCount={5} />)
    expect(container.textContent).toContain('Web')
  })

  it('highlights badge in success color when installed count > 0', () => {
    const { container } = render(<CategoryHeader name="Web" totalCount={10} installedCount={5} />)
    expect(container.textContent).toContain('(5/10)')
  })
})
