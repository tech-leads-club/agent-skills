/** @jest-environment jsdom */
import { render } from '@testing-library/react'
import * as fc from 'fast-check'
import { CategoryHeader } from '../CategoryHeader'

jest.mock('picocolors', () => ({
  dim: jest.fn((str) => `dim(${str})`),
}))

jest.mock('../../services/badge-format', () => ({
  formatCategoryBadge: (installed: number, total: number) => (installed > 0 ? `(${installed}/${total})` : `(${total})`),
}))

jest.mock('../../services/category-colors', () => ({
  getColorForCategory: () => '#64748b',
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

describe('CategoryHeader property tests', () => {
  it('should display correct badge format for any valid skill counts', () => {
    fc.assert(
      fc.property(fc.nat({ max: 100 }), fc.nat({ max: 100 }), (installed, total) => {
        const validInstalled = Math.min(installed, total)
        const { container, unmount } = render(
          <CategoryHeader name="Test" totalCount={total} installedCount={validInstalled} />,
        )
        const text = container.textContent ?? ''

        if (validInstalled > 0) {
          expect(text).toContain(`(${validInstalled}/${total})`)
        } else {
          expect(text).toContain(`(${total})`)
        }
        unmount()
      }),
      { numRuns: 200 },
    )
  })

  it('should update badge immediately when installed count changes', () => {
    fc.assert(
      fc.property(fc.nat({ max: 50 }), fc.nat({ max: 50 }), (countA, countB) => {
        const total = 50
        const installedA = Math.min(countA, total)
        const installedB = Math.min(countB, total)

        const { container, rerender, unmount } = render(
          <CategoryHeader name="Test" totalCount={total} installedCount={installedA} />,
        )

        const textBefore = container.textContent ?? ''
        if (installedA > 0) {
          expect(textBefore).toContain(`(${installedA}/${total})`)
        } else {
          expect(textBefore).toContain(`(${total})`)
        }

        rerender(<CategoryHeader name="Test" totalCount={total} installedCount={installedB} />)

        const textAfter = container.textContent ?? ''
        if (installedB > 0) {
          expect(textAfter).toContain(`(${installedB}/${total})`)
        } else {
          expect(textAfter).toContain(`(${total})`)
        }
        unmount()
      }),
      { numRuns: 200 },
    )
  })
})
