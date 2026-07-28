import type { Skill } from '../../types'
import { filterAndSortSkills, paginateSkills } from '../skills-filter'

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
  skill({ id: 'zebra', name: 'Zebra', category: 'writing', metadata: { hasScripts: false, hasReferences: false, referenceFiles: [], lastModified: '2026-01-01' } }),
  skill({ id: 'tlc-spec-driven', name: 'TLC Spec Driven', category: 'process', metadata: { hasScripts: false, hasReferences: false, referenceFiles: [], lastModified: '2026-06-01' } }),
  skill({ id: 'accessibility', name: 'Accessibility (a11y)', category: 'frontend', metadata: { hasScripts: false, hasReferences: false, referenceFiles: [], lastModified: '2026-03-01' } }),
]

describe('filterAndSortSkills', () => {
  it('returns all skills sorted with featured first by default', () => {
    const result = filterAndSortSkills({
      skills,
      searchQuery: '',
      selectedCategory: null,
      sortBy: 'featured',
    })
    expect(result.map((s) => s.id)).toEqual(['tlc-spec-driven', 'accessibility', 'zebra'])
  })

  it('filters by search query against display name', () => {
    const result = filterAndSortSkills({
      skills,
      searchQuery: 'access',
      selectedCategory: null,
      sortBy: 'name',
    })
    expect(result.map((s) => s.id)).toEqual(['accessibility'])
  })

  it('filters by category', () => {
    const result = filterAndSortSkills({
      skills,
      searchQuery: '',
      selectedCategory: 'writing',
      sortBy: 'name',
    })
    expect(result.map((s) => s.id)).toEqual(['zebra'])
  })

  it('sorts by recent lastModified descending', () => {
    const result = filterAndSortSkills({
      skills,
      searchQuery: '',
      selectedCategory: null,
      sortBy: 'recent',
    })
    expect(result.map((s) => s.id)).toEqual(['tlc-spec-driven', 'accessibility', 'zebra'])
  })
})

describe('paginateSkills', () => {
  it('returns the page slice so the visible grid updates with pagination', () => {
    const items = [1, 2, 3, 4, 5]
    expect(paginateSkills(items, 1, 2)).toEqual([1, 2])
    expect(paginateSkills(items, 2, 2)).toEqual([3, 4])
  })
})
