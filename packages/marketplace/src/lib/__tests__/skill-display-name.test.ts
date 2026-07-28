import { extractDisplayName, humanizeSkillId, stripInlineMarkdown } from '../skill-display-name'

describe('stripInlineMarkdown', () => {
  it('removes code spans, emphasis, and links', () => {
    expect(stripInlineMarkdown('`docs-writer` skill instructions')).toBe('docs-writer skill instructions')
    expect(stripInlineMarkdown('**Bold** and *italic*')).toBe('Bold and italic')
    expect(stripInlineMarkdown('see [the docs](https://x.dev)')).toBe('see the docs')
  })
})

describe('humanizeSkillId', () => {
  it('title-cases kebab-case ids', () => {
    expect(humanizeSkillId('tlc-spec-driven')).toBe('Tlc Spec Driven')
    expect(humanizeSkillId('accessibility')).toBe('Accessibility')
  })
})

describe('extractDisplayName', () => {
  it('uses the first ATX H1 from the markdown body', () => {
    const body = '# Accessibility (a11y)\n\nComprehensive guidelines.\n'
    expect(extractDisplayName(body, 'accessibility')).toBe('Accessibility (a11y)')
  })

  it('falls back to humanized id when no H1 exists', () => {
    const body = 'No heading here.\n\nJust paragraphs.\n'
    expect(extractDisplayName(body, 'ai-cold-outreach')).toBe('Ai Cold Outreach')
  })

  it('uses only the first H1 when multiple level-1 headings exist', () => {
    const body = '# First Title\n\nIntro\n\n# Second Title\n\nMore\n'
    expect(extractDisplayName(body, 'some-skill')).toBe('First Title')
  })

  it('ignores ## headings when choosing display name', () => {
    const body = '## Not An H1\n\n# Real Title\n'
    expect(extractDisplayName(body, 'x')).toBe('Real Title')
  })

  it('strips backticks so code spans do not leak into the title', () => {
    const body = '# `docs-writer` skill instructions\n\nBody.\n'
    expect(extractDisplayName(body, 'docs-writer')).toBe('docs-writer skill instructions')
  })

  it('skips `#` lines inside code fences when picking the display name', () => {
    const body = '```sh\n# install deps\n```\n\n# Real Title\n'
    expect(extractDisplayName(body, 'x')).toBe('Real Title')
  })

  it('falls back to humanized id when the only `#` line is inside a fence', () => {
    const body = '```markdown\n# ADR-{NNN}: {Title}\n```\n'
    expect(extractDisplayName(body, 'create-adr')).toBe('Create Adr')
  })
})
