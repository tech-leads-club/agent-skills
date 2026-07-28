import type { Skill } from '../types'

export type SkillSortOption = 'featured' | 'name' | 'recent'

export interface SkillsFilterInput {
  skills: Skill[]
  searchQuery: string
  selectedCategory: string | null
  sortBy: SkillSortOption
  featuredSkillId?: string
}

/**
 * Pure filter/sort used by the skills hub client — unit-tested so filter UX
 * regressions are caught without a browser harness.
 */
export function filterAndSortSkills({
  skills,
  searchQuery,
  selectedCategory,
  sortBy,
  featuredSkillId = 'tlc-spec-driven',
}: SkillsFilterInput): Skill[] {
  const normalizedQuery = searchQuery.trim().toLowerCase()
  let result = skills.filter((skill) => {
    const matchesSearch =
      normalizedQuery === '' ||
      skill.name.toLowerCase().includes(normalizedQuery) ||
      skill.description.toLowerCase().includes(normalizedQuery)

    const matchesCategory = selectedCategory === null || skill.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  if (sortBy === 'featured') {
    result = [...result].sort((a, b) => {
      if (a.id === featuredSkillId) return -1
      if (b.id === featuredSkillId) return 1
      return a.name.localeCompare(b.name)
    })
  } else if (sortBy === 'recent') {
    result = [...result].sort((a, b) => b.metadata.lastModified.localeCompare(a.metadata.lastModified))
  } else {
    result = [...result].sort((a, b) => a.name.localeCompare(b.name))
  }

  return result
}

export function paginateSkills<T>(items: T[], currentPage: number, pageSize: number): T[] {
  const startIndex = (currentPage - 1) * pageSize
  return items.slice(startIndex, startIndex + pageSize)
}
