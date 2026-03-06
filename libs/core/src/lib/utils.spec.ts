import {
  categoryIdToFolderName,
  extractCategoryId,
  formatCategoryName,
  getCacheDir,
  isCategoryFolder,
  isPathSafe,
  parseInline,
  parseMarkdown,
  sanitizeName,
  stripFrontmatter,
} from './utils'

describe('sanitizeName', () => {
  it('removes unsafe filesystem characters and traversal prefixes', () => {
    expect(sanitizeName('../bad:/\\\\name')).toBe('badname')
  })

  it('falls back to a stable default when the input becomes empty', () => {
    expect(sanitizeName('...')).toBe('unnamed-skill')
  })

  it('limits the final value to 255 characters', () => {
    expect(sanitizeName('a'.repeat(300))).toHaveLength(255)
  })
})

describe('isPathSafe', () => {
  it('accepts paths inside the base directory', () => {
    expect(isPathSafe('/repo/.agents', '/repo/.agents/cursor/accessibility')).toBe(true)
  })

  it('accepts the base directory itself', () => {
    expect(isPathSafe('/repo/.agents', '/repo/.agents')).toBe(true)
  })

  it('rejects paths outside the base directory', () => {
    expect(isPathSafe('/repo/.agents', '/repo/other/accessibility')).toBe(false)
  })
})

describe('category helpers', () => {
  it('formats category names for display', () => {
    expect(formatCategoryName('core-migration')).toBe('Core Migration')
  })

  it('extracts ids from category folders', () => {
    expect(extractCategoryId('(frontend)')).toBe('frontend')
    expect(extractCategoryId('frontend')).toBeNull()
  })

  it('validates and creates category folder names', () => {
    expect(isCategoryFolder('(quality-tools)')).toBe(true)
    expect(isCategoryFolder('quality-tools')).toBe(false)
    expect(categoryIdToFolderName('quality-tools')).toBe('(quality-tools)')
  })
})

describe('getCacheDir', () => {
  it('builds the relative cache directory path', () => {
    expect(getCacheDir()).toBe('.cache/agent-skills')
  })
})

describe('stripFrontmatter', () => {
  it('removes yaml frontmatter when present', () => {
    expect(stripFrontmatter('---\ntitle: Demo\n---\n# Heading')).toBe('# Heading')
  })

  it('returns the original content when frontmatter is incomplete', () => {
    expect(stripFrontmatter('---\ntitle: Demo')).toBe('---\ntitle: Demo')
  })
})

describe('parseMarkdown', () => {
  it('parses headings, lists, code blocks, separators, and blanks', () => {
    expect(parseMarkdown('# Title\n\n- item\n```ts\nconst a = 1\n```\n---')).toEqual([
      { type: 'heading', level: 1, text: 'Title' },
      { type: 'blank' },
      { type: 'list-item', text: 'item', indent: 0 },
      { type: 'code-block', language: 'ts', lines: ['const a = 1'] },
      { type: 'hr' },
    ])
  })

  it('strips frontmatter before parsing', () => {
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

  it('returns a plain text segment when no markdown is present', () => {
    expect(parseInline('plain text')).toEqual([{ text: 'plain text' }])
  })
})
