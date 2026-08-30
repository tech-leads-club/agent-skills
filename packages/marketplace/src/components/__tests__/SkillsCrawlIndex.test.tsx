import { jest } from '@jest/globals'
import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// why: ESM test modules get no injected `jest` global and no hoisted `jest.mock`, so the
// stub must be registered with unstable_mockModule before the component is imported.
jest.unstable_mockModule('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: ReactNode; className?: string }) =>
    createElement('a', { href, className }, children),
}))

const { SkillsCrawlIndex } = await import('../SkillsCrawlIndex')

describe('SkillsCrawlIndex', () => {
  it('renders an empty string when there are no skills (no crash)', () => {
    const html = renderToStaticMarkup(<SkillsCrawlIndex skills={[]} />)
    expect(html).toBe('')
  })

  it('renders trailing-slash detail links with display names', () => {
    const html = renderToStaticMarkup(
      <SkillsCrawlIndex skills={[{ id: 'accessibility', name: 'Accessibility (a11y)' }]} />,
    )
    expect(html).toContain('href="/skills/accessibility/"')
    expect(html).toContain('Accessibility (a11y)')
  })

  it('renders trailing-slash category links when categories are supplied', () => {
    const html = renderToStaticMarkup(
      <SkillsCrawlIndex
        skills={[{ id: 'accessibility', name: 'Accessibility (a11y)' }]}
        categories={[{ id: 'quality', name: 'Quality' }]}
      />,
    )
    expect(html).toContain('href="/categories/quality/"')
    expect(html).toContain('Browse by category')
  })
})
