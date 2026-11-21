import { findBrokenSkillLinks, isInternalHref, splitSkillReferences } from '../editorial-links'

const ids = new Set(['seo', 'core-web-vitals', 'tlc-spec-lean', 'tlc-spec-driven'])

describe('findBrokenSkillLinks', () => {
  it('returns ids that are not in the catalog', () => {
    const md = 'See [SEO](/skills/seo/), [Lean](/skills/tlc-spec-lean) and [Gone](/skills/missing-skill/).'
    expect(findBrokenSkillLinks(md, ids)).toEqual(['missing-skill'])
  })

  it('ignores anchors and query strings after the id', () => {
    expect(findBrokenSkillLinks('[x](/skills/seo/#usage) [y](/skills/seo?a=1)', ids)).toEqual([])
  })

  it('ignores links to other sections', () => {
    expect(findBrokenSkillLinks('[flow](/tlc-ai-dev-flow/) [agents](/agents/)', ids)).toEqual([])
  })

  it('checks links that carry a title', () => {
    expect(findBrokenSkillLinks('[Gone](/skills/missing/ "Details")', ids)).toEqual(['missing'])
  })

  it('checks angle-bracket destinations', () => {
    expect(findBrokenSkillLinks('[Gone](</skills/missing/>)', ids)).toEqual(['missing'])
  })

  it('checks reference-style link definitions', () => {
    const md = 'See [the old skill][old] and [SEO][seo].\n\n[old]: /skills/missing/\n[seo]: /skills/seo/'
    expect(findBrokenSkillLinks(md, ids)).toEqual(['missing'])
  })

  it('checks absolute links to this site', () => {
    expect(findBrokenSkillLinks('[Gone](https://agent-skills.techleads.club/skills/missing/)', ids)).toEqual([
      'missing',
    ])
  })

  it('ignores skill paths that are not links', () => {
    expect(findBrokenSkillLinks('Run it from `/skills/missing/` in code.', ids)).toEqual([])
  })
})

describe('isInternalHref', () => {
  it('accepts root-relative paths only', () => {
    expect(isInternalHref('/skills/seo/')).toBe(true)
    expect(isInternalHref('//evil.example/x')).toBe(false)
    expect(isInternalHref('https://example.com')).toBe(false)
    expect(isInternalHref('references/a.md')).toBe(false)
    expect(isInternalHref(undefined)).toBe(false)
  })
})

describe('splitSkillReferences', () => {
  it('links a single referenced skill', () => {
    expect(splitSkillReferences('SEO (use seo)', ids)).toEqual([
      { text: 'SEO (use ' },
      { skillId: 'seo' },
      { text: ')' },
    ])
  })

  it('links every known id inside one group', () => {
    expect(splitSkillReferences('clear features (use tlc-spec-lean or tlc-spec-driven)', ids)).toEqual([
      { text: 'clear features (use ' },
      { skillId: 'tlc-spec-lean' },
      { text: ' or ' },
      { skillId: 'tlc-spec-driven' },
      { text: ')' },
    ])
  })

  it('leaves unknown names and text outside use-groups untouched', () => {
    expect(splitSkillReferences('seo work (use gh-address-comments)', ids)).toEqual([
      { text: 'seo work (use gh-address-comments)' },
    ])
  })

  it('returns the whole text when there is no use-group', () => {
    expect(splitSkillReferences('reviewing prose', ids)).toEqual([{ text: 'reviewing prose' }])
  })
})
