import { parseInline, parseMarkdown, stripFrontmatter } from '../markdown-parser.service'

describe('stripFrontmatter', () => {
  it('removes yaml frontmatter when present', () => {
    expect(stripFrontmatter('---\ntitle: Demo\n---\n# Heading')).toBe('# Heading')
  })

  it('returns the original content when frontmatter is incomplete', () => {
    expect(stripFrontmatter('---\ntitle: Demo')).toBe('---\ntitle: Demo')
  })

  it('ignores delimiter-like text inside frontmatter values', () => {
    expect(stripFrontmatter('---\ntitle: Demo --- Draft\n---\n# Heading')).toBe('# Heading')
  })
})

describe('parseMarkdown', () => {
  it('handles headings, paragraphs, lists, code blocks, hr, and blanks', () => {
    const tokens = parseMarkdown('# H1\n## H2\n### H3\n\n- bullet\n  - nested\n---\n```ts\nconsole.log(true)\n```\n\nparagraph')
    expect(tokens).toEqual([
      { type: 'heading', level: 1, text: 'H1' },
      { type: 'heading', level: 2, text: 'H2' },
      { type: 'heading', level: 3, text: 'H3' },
      { type: 'blank' },
      { type: 'list-item', text: 'bullet', indent: 0 },
      { type: 'list-item', text: 'nested', indent: 1 },
      { type: 'hr' },
      { type: 'code-block', language: 'ts', lines: ['console.log(true)'] },
      { type: 'blank' },
      { type: 'paragraph', text: 'paragraph' },
    ])
  })

  it('strips frontmatter before tokenizing', () => {
    expect(parseMarkdown('---\ntitle: Demo\n---\nParagraph')).toEqual([{ type: 'paragraph', text: 'Paragraph' }])
  })
})

describe('parseInline', () => {
  it('parses bold, italic, and code segments in order', () => {
    expect(parseInline('**bold** and `code` and *italic*')).toEqual([
      { text: 'bold', bold: true },
      { text: ' and ' },
      { text: 'code', code: true },
      { text: ' and ' },
      { text: 'italic', italic: true },
    ])
  })

  it('handles plain text without formatting', () => {
    expect(parseInline('just plain text')).toEqual([{ text: 'just plain text' }])
  })

  it('reconstructs original text when concatenating segments', () => {
    const input = '**bold** and `code` text'
    const segments = parseInline(input)
    const concatenated = segments.map((segment) => segment.text).join('')
    expect(concatenated).toBe('bold and code text')
  })
})
