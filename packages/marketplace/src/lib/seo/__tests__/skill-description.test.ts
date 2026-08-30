import { parseSkillDescription, truncateForMeta } from '../skill-description'

describe('parseSkillDescription', () => {
  it('splits the catalog convention into summary, triggers and negative triggers', () => {
    const parsed = parseSkillDescription(
      'Audit and improve web accessibility following WCAG 2.1 guidelines. Use when asked to "improve accessibility", "a11y audit". Do NOT use for SEO (use seo), performance (use core-web-vitals).',
    )

    expect(parsed.summary).toBe('Audit and improve web accessibility following WCAG 2.1 guidelines')
    expect(parsed.useWhen).toEqual(['asked to "improve accessibility"', '"a11y audit"'])
    expect(parsed.doNotUseFor).toEqual(['SEO (use seo)', 'performance (use core-web-vitals)'])
  })

  it('accepts the "Use this skill when" and "Do not use when" variants', () => {
    const parsed = parseSkillDescription(
      'Design review helper. Use this skill when reviewing a design system. Do not use when writing production CSS.',
    )

    expect(parsed.summary).toBe('Design review helper')
    expect(parsed.useWhen).toEqual(['reviewing a design system'])
    expect(parsed.doNotUseFor).toEqual(['writing production CSS'])
  })

  it('keeps the whole description as summary when no convention markers exist', () => {
    const parsed = parseSkillDescription('Plain description with no markers.')

    expect(parsed.summary).toBe('Plain description with no markers')
    expect(parsed.useWhen).toEqual([])
    expect(parsed.doNotUseFor).toEqual([])
  })

  it('does not split commas inside parenthesised references', () => {
    const parsed = parseSkillDescription('Thing. Do NOT use for pipelines (use a, b), roadmaps.')

    expect(parsed.doNotUseFor).toEqual(['pipelines (use a, b)', 'roadmaps'])
  })
})

describe('truncateForMeta', () => {
  it('leaves short text untouched', () => {
    expect(truncateForMeta('Short summary', 160)).toBe('Short summary')
  })

  it('truncates on a word boundary and appends an ellipsis', () => {
    const result = truncateForMeta('alpha bravo charlie delta echo foxtrot', 20)

    expect(result.length).toBeLessThanOrEqual(20)
    expect(result).toBe('alpha bravo charlie…')
  })

  it('collapses whitespace before measuring', () => {
    expect(truncateForMeta('  a\n\n  b  ', 160)).toBe('a b')
  })
})
