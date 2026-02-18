import { parseMarkdown, parseInline } from '../markdown-parser'

describe('parseMarkdown', () => {
  it('strips YAML frontmatter', () => {
    const input = `---
name: test-skill
description: A test
---

# Title`

    const tokens = parseMarkdown(input)
    expect(tokens[0]).toEqual({ type: 'heading', level: 1, text: 'Title' })
  })

  it('parses headings at levels 1-3', () => {
    const tokens = parseMarkdown('# H1\n## H2\n### H3')
    expect(tokens).toEqual([
      { type: 'heading', level: 1, text: 'H1' },
      { type: 'heading', level: 2, text: 'H2' },
      { type: 'heading', level: 3, text: 'H3' },
    ])
  })

  it('parses unordered list items with - and *', () => {
    const tokens = parseMarkdown('- first\n* second')
    expect(tokens).toEqual([
      { type: 'list-item', text: 'first', indent: 0 },
      { type: 'list-item', text: 'second', indent: 0 },
    ])
  })

  it('detects nested list item indentation', () => {
    const tokens = parseMarkdown('- top\n  - nested\n    - deep')
    expect(tokens).toEqual([
      { type: 'list-item', text: 'top', indent: 0 },
      { type: 'list-item', text: 'nested', indent: 1 },
      { type: 'list-item', text: 'deep', indent: 2 },
    ])
  })

  it('parses numbered list items', () => {
    const tokens = parseMarkdown('1. first\n2. second')
    expect(tokens).toEqual([
      { type: 'list-item', text: 'first', indent: 0 },
      { type: 'list-item', text: 'second', indent: 0 },
    ])
  })

  it('parses fenced code blocks with language', () => {
    const input = '```typescript\nconst x = 1\nconsole.log(x)\n```'
    const tokens = parseMarkdown(input)
    expect(tokens).toEqual([
      { type: 'code-block', language: 'typescript', lines: ['const x = 1', 'console.log(x)'] },
    ])
  })

  it('parses code blocks without language', () => {
    const tokens = parseMarkdown('```\nhello\n```')
    expect(tokens).toEqual([
      { type: 'code-block', language: '', lines: ['hello'] },
    ])
  })

  it('parses horizontal rules', () => {
    const tokens = parseMarkdown('---')
    expect(tokens).toEqual([{ type: 'hr' }])
  })

  it('treats blank lines as blank tokens', () => {
    const tokens = parseMarkdown('text\n\nmore')
    expect(tokens).toEqual([
      { type: 'paragraph', text: 'text' },
      { type: 'blank' },
      { type: 'paragraph', text: 'more' },
    ])
  })

  it('treats plain text as paragraphs', () => {
    const tokens = parseMarkdown('Hello world')
    expect(tokens).toEqual([{ type: 'paragraph', text: 'Hello world' }])
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
    const types = tokens.map((t) => t.type)
    expect(types).toContain('heading')
    expect(types).toContain('paragraph')
    expect(types).toContain('list-item')
    expect(types).toContain('code-block')
  })

  // Property: every non-empty line produces a token
  it('produces at least one token for any non-empty input', () => {
    const inputs = ['hello', '# heading', '- item', '```\ncode\n```', '---']
    for (const input of inputs) {
      const tokens = parseMarkdown(input)
      expect(tokens.length).toBeGreaterThan(0)
    }
  })

  // Property: no frontmatter tokens leak through
  it('never produces tokens containing frontmatter delimiters', () => {
    const input = '---\nkey: value\n---\n# Title'
    const tokens = parseMarkdown(input)
    for (const token of tokens) {
      if ('text' in token) {
        expect(token.text).not.toMatch(/^---$/)
        expect(token.text).not.toMatch(/^key: value$/)
      }
    }
  })
})

describe('parseInline', () => {
  it('returns plain text as single segment', () => {
    expect(parseInline('hello')).toEqual([{ text: 'hello' }])
  })

  it('parses bold text', () => {
    const segments = parseInline('this is **bold** text')
    expect(segments).toEqual([
      { text: 'this is ' },
      { text: 'bold', bold: true },
      { text: ' text' },
    ])
  })

  it('parses italic text', () => {
    const segments = parseInline('this is *italic* text')
    expect(segments).toEqual([
      { text: 'this is ' },
      { text: 'italic', italic: true },
      { text: ' text' },
    ])
  })

  it('parses inline code', () => {
    const segments = parseInline('use `npm install` here')
    expect(segments).toEqual([
      { text: 'use ' },
      { text: 'npm install', code: true },
      { text: ' here' },
    ])
  })

  it('handles mixed inline formatting', () => {
    const segments = parseInline('**bold** and `code` and *italic*')
    expect(segments).toHaveLength(5)
    expect(segments[0]).toEqual({ text: 'bold', bold: true })
    expect(segments[2]).toEqual({ text: 'code', code: true })
    expect(segments[4]).toEqual({ text: 'italic', italic: true })
  })

  it('handles text with no formatting', () => {
    const segments = parseInline('just plain text here')
    expect(segments).toHaveLength(1)
    expect(segments[0].text).toBe('just plain text here')
  })

  // Property: concatenated segment text equals original stripped of formatting
  it('preserves all text content', () => {
    const input = '**bold** and `code` text'
    const segments = parseInline(input)
    const reconstructed = segments.map((s) => s.text).join('')
    expect(reconstructed).toBe('bold and code text')
  })
})
