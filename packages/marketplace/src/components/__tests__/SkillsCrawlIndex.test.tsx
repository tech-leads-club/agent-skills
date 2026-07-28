import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    createElement('a', { href, className }, children),
}))

import { SkillsCrawlIndex } from '../SkillsCrawlIndex'

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
})
