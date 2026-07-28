import { isPathLikeHref, isSafeMarkdownHref } from '../safe-markdown-href'

describe('isSafeMarkdownHref', () => {
  it('allows absolute http(s) links', () => {
    expect(isSafeMarkdownHref('https://github.com/tech-leads-club/agent-skills')).toBe(true)
    expect(isSafeMarkdownHref('http://example.com')).toBe(true)
  })

  it('allows same-document hash links', () => {
    expect(isSafeMarkdownHref('#section')).toBe(true)
  })

  it('allows mailto links', () => {
    expect(isSafeMarkdownHref('mailto:a@b.c')).toBe(true)
  })

  it('rejects relative package / markdown paths', () => {
    expect(isSafeMarkdownHref('references/implement.md')).toBe(false)
    expect(isSafeMarkdownHref('../performance/SKILL.md')).toBe(false)
    expect(isSafeMarkdownHref('CONTRIBUTING.md')).toBe(false)
    expect(isSafeMarkdownHref('./foo.md')).toBe(false)
  })

  it('rejects protocol-relative URLs', () => {
    expect(isSafeMarkdownHref('//evil.example')).toBe(false)
  })

  it('rejects empty or missing href', () => {
    expect(isSafeMarkdownHref(undefined)).toBe(false)
    expect(isSafeMarkdownHref('')).toBe(false)
    expect(isSafeMarkdownHref('   ')).toBe(false)
  })
})

describe('isPathLikeHref', () => {
  it('treats slash paths and file-like names as path-like', () => {
    expect(isPathLikeHref('references/implement.md')).toBe(true)
    expect(isPathLikeHref('CONTRIBUTING.md')).toBe(true)
  })
})
