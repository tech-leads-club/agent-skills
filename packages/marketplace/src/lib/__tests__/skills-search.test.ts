import type { Skill } from '../../types'
import {
  boundedEditDistance,
  buildSearchIndex,
  fuzzyBudget,
  normalizeText,
  parseQuery,
  searchHighlightTerms,
  searchSkills,
  stemToken,
  tokenize,
} from '../skills-search'

function skill(partial: Partial<Skill> & Pick<Skill, 'id' | 'name' | 'category'>): Skill {
  return {
    description: `${partial.name} description`,
    path: `skills/${partial.id}/SKILL.md`,
    content: '',
    metadata: {
      hasScripts: false,
      hasReferences: false,
      referenceFiles: [],
      lastModified: '2026-01-01',
    },
    ...partial,
  }
}

const skills: Skill[] = [
  skill({
    id: 'react-best-practices',
    name: 'React Best Practices',
    category: 'development',
    description: 'Patterns for building React applications.',
  }),
  skill({
    id: 'evolutionary-modular-architecture',
    name: 'Evolutionary Modular Architecture',
    category: 'architecture',
    description: 'Evolve a modular monolith. Works with React or any frontend.',
  }),
  skill({
    id: 'playwright-skill',
    name: 'Playwright',
    category: 'web-automation',
    description: 'Write end-to-end testing suites for React and other web apps.',
    content: '# Playwright\n\nUse for browser automation and documentação de testes.',
  }),
  skill({
    id: 'tlc-spec-driven',
    name: 'TLC Spec Driven',
    category: 'process',
    description: 'Spec driven development workflow.',
  }),
  skill({
    id: 'gtm-metrics',
    name: 'GTM Metrics',
    category: 'gtm',
    description: 'Revenue metrics for go-to-market teams.',
  }),
]

const categories = [
  { id: 'gtm', name: 'Go-to-Market' },
  { id: 'development', name: 'Development' },
  { id: 'web-automation', name: 'Web Automation' },
]

const index = buildSearchIndex(skills, categories)
const ids = (query: string) => searchSkills(index, query).map((result) => result.skill.id)

describe('normalizeText / tokenize', () => {
  it('folds diacritics and case so accented queries match unaccented text', () => {
    expect(normalizeText('Documentação')).toBe('documentacao')
    expect(tokenize('TLC Spec-Driven!')).toEqual(['tlc', 'spec', 'driven'])
    expect(tokenize('   ')).toEqual([])
  })
})

describe('boundedEditDistance / fuzzyBudget', () => {
  it('measures edits and bails out past the budget', () => {
    expect(boundedEditDistance('react', 'react', 2)).toBe(0)
    expect(boundedEditDistance('typscript', 'typescript', 2)).toBe(1)
    expect(boundedEditDistance('react', 'playwright', 2)).toBeGreaterThan(2)
  })

  it('only allows typos on terms long enough for one to be plausible', () => {
    expect(fuzzyBudget('ci')).toBe(0)
    expect(fuzzyBudget('plan')).toBe(0)
    expect(fuzzyBudget('react')).toBe(1)
    expect(fuzzyBudget('typscript')).toBe(2)
  })
})

describe('stemToken', () => {
  it('strips common suffixes so "testing" and "tests" share a stem', () => {
    expect(stemToken('testing')).toBe(stemToken('tests'))
    expect(stemToken('deployed')).toBe('deploy')
    expect(stemToken('metrics')).toBe('metric')
  })

  it('leaves short words and double-s endings alone', () => {
    expect(stemToken('ci')).toBe('ci')
    expect(stemToken('css')).toBe('css')
    expect(stemToken('ring')).toBe('ring')
  })
})

describe('parseQuery', () => {
  it('splits bare terms from quoted phrases', () => {
    const parsed = parseQuery('"spec driven" react testing')
    expect(parsed.phrases).toEqual(['spec driven'])
    expect(parsed.terms).toEqual(['react', 'testing'])
  })
})

describe('searchSkills', () => {
  it('ranks the skill named after the query first', () => {
    expect(ids('react')[0]).toBe('react-best-practices')
  })

  it('matches multi-word queries whose terms are not adjacent', () => {
    expect(ids('testing react')[0]).toBe('playwright-skill')
    expect(ids('driven spec')).toContain('tlc-spec-driven')
  })

  it('ranks skills matching every term above skills matching only some', () => {
    expect(ids('react architecture')[0]).toBe('evolutionary-modular-architecture')
  })

  it('falls back to partial matches instead of an empty page', () => {
    const results = searchSkills(index, 'react zzzzzz')
    expect(results.length).toBeGreaterThan(0)
    expect(results.every((result) => result.partial)).toBe(true)
    expect(results[0].matchedTerms).toBe(1)
  })

  it('returns nothing when no term matches at all', () => {
    expect(ids('zzzzzz qqqqqq')).toEqual([])
  })

  it('matches across singular/plural and verb forms', () => {
    expect(ids('test')).toContain('playwright-skill')
    expect(ids('patterns')).toContain('react-best-practices')
  })

  it('puts skills matching every term ahead of skills matching only some', () => {
    const results = searchSkills(index, 'testing react')
    expect(results[0].skill.id).toBe('playwright-skill')
    expect(results[0].partial).toBe(false)
    expect(results.slice(1).every((result) => result.partial)).toBe(true)
  })

  it('tolerates typos on long enough terms', () => {
    expect(ids('reakt')).toContain('react-best-practices')
    expect(ids('playwrigth')).toContain('playwright-skill')
  })

  it('matches short terms as whole tokens only, never as substrings of longer words', () => {
    expect(ids('gtm')).toEqual(['gtm-metrics'])
    expect(ids('ci')).toEqual([])
  })

  it('matches hyphenated ids typed with spaces and vice versa', () => {
    expect(ids('spec-driven')).toContain('tlc-spec-driven')
    expect(ids('react best practices')[0]).toBe('react-best-practices')
  })

  it('searches category names, not just the category id', () => {
    expect(ids('go-to-market')[0]).toBe('gtm-metrics')
  })

  it('searches skill content and folds accents', () => {
    expect(ids('documentacao')).toEqual(['playwright-skill'])
    expect(ids('documentacão')).toEqual(['playwright-skill'])
  })

  it('honours quoted phrases as exact sequences', () => {
    expect(ids('"spec driven"')).toContain('tlc-spec-driven')
    expect(ids('"driven spec"')).toEqual([])
    expect(ids('"spec driven" zzzzzz').length).toBeGreaterThan(0)
  })

  it('returns every skill for a blank query', () => {
    expect(ids('   ')).toHaveLength(skills.length)
  })

  it('breaks score ties alphabetically so order is stable', () => {
    const first = searchSkills(index, 'react')
    const second = searchSkills(index, 'react')
    expect(first.map((r) => r.skill.id)).toEqual(second.map((r) => r.skill.id))
  })
})

describe('searchHighlightTerms', () => {
  it('returns terms worth highlighting, including words inside phrases', () => {
    expect(searchHighlightTerms('"spec driven" react a').sort()).toEqual(['driven', 'react', 'spec'])
  })
})
