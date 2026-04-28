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
    const tokens = parseMarkdown(
      '# H1\n## H2\n### H3\n\n- bullet\n  - nested\n---\n```ts\nconsole.log(true)\n```\n\nparagraph',
    )
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

  it('parses unordered list items with *', () => {
    expect(parseMarkdown('- first\n* second')).toEqual([
      { type: 'list-item', text: 'first', indent: 0 },
      { type: 'list-item', text: 'second', indent: 0 },
    ])
  })

  it('detects deeper nested list item indentation', () => {
    expect(parseMarkdown('- top\n  - nested\n    - deep')).toEqual([
      { type: 'list-item', text: 'top', indent: 0 },
      { type: 'list-item', text: 'nested', indent: 1 },
      { type: 'list-item', text: 'deep', indent: 2 },
    ])
  })

  it('parses numbered list items', () => {
    expect(parseMarkdown('1. first\n2. second')).toEqual([
      { type: 'list-item', text: 'first', indent: 0 },
      { type: 'list-item', text: 'second', indent: 0 },
    ])
  })

  it('parses code blocks without language', () => {
    expect(parseMarkdown('```\nhello\n```')).toEqual([{ type: 'code-block', language: '', lines: ['hello'] }])
  })

  it('handles a realistic SKILL.md structure', () => {
    const input = `---
name: test
---

# My Skill

A description paragraph.

## Usage

- Step one
- Step two

\`\`\`bash
npm install
\`\`\`
`

    const tokens = parseMarkdown(input)
    const types = tokens.map((token) => token.type)

    expect(types).toContain('heading')
    expect(types).toContain('paragraph')
    expect(types).toContain('list-item')
    expect(types).toContain('code-block')
  })

  it('produces at least one token for any non-empty input', () => {
    const inputs = ['hello', '# heading', '- item', '```\ncode\n```', '---']

    for (const input of inputs) {
      expect(parseMarkdown(input).length).toBeGreaterThan(0)
    }
  })

  it('never produces tokens containing frontmatter delimiters', () => {
    const tokens = parseMarkdown('---\nkey: value\n---\n# Title')

    for (const token of tokens) {
      if ('text' in token) {
        expect(token.text).not.toMatch(/^---$/)
        expect(token.text).not.toMatch(/^key: value$/)
      }
    }
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

  it('parses bold text', () => {
    expect(parseInline('this is **bold** text')).toEqual([
      { text: 'this is ' },
      { text: 'bold', bold: true },
      { text: ' text' },
    ])
  })

  it('parses italic text', () => {
    expect(parseInline('this is *italic* text')).toEqual([
      { text: 'this is ' },
      { text: 'italic', italic: true },
      { text: ' text' },
    ])
  })

  it('parses inline code', () => {
    expect(parseInline('use `npm install` here')).toEqual([
      { text: 'use ' },
      { text: 'npm install', code: true },
      { text: ' here' },
    ])
  })

  it('reconstructs original text when concatenating segments', () => {
    const input = '**bold** and `code` text'
    const segments = parseInline(input)
    const concatenated = segments.map((segment) => segment.text).join('')
    expect(concatenated).toBe('bold and code text')
  })
})
