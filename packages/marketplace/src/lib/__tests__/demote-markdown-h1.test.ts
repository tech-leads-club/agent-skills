import { demoteFirstMarkdownH1 } from '../demote-markdown-h1'

describe('demoteFirstMarkdownH1', () => {
  it('demotes the first ATX H1 to H2', () => {
    const body = '# Accessibility (a11y)\n\nBody text.\n'
    expect(demoteFirstMarkdownH1(body)).toBe('## Accessibility (a11y)\n\nBody text.\n')
  })

  it('leaves content without an H1 unchanged', () => {
    const body = 'No heading here.\n\n## Already H2\n'
    expect(demoteFirstMarkdownH1(body)).toBe(body)
  })

  it('demotes every ATX H1 so the page keeps a single document H1', () => {
    const body = '# First\n\nIntro\n\n# Second\n\nMore\n'
    expect(demoteFirstMarkdownH1(body)).toBe('## First\n\nIntro\n\n## Second\n\nMore\n')
  })

  it('does not demote ## or deeper headings', () => {
    const body = '## Keep\n\n### Also keep\n'
    expect(demoteFirstMarkdownH1(body)).toBe(body)
  })
})
