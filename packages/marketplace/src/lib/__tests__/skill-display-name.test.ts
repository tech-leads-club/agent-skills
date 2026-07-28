import { extractDisplayName, humanizeSkillId } from '../skill-display-name'

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
})
