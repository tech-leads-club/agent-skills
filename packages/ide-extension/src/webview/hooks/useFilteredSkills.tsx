import Fuse from 'fuse.js'
import { useMemo } from 'react'
import type { SkillRegistry } from '../../shared/types'

interface UseFilteredSkillsInput {
  skills: SkillRegistry['skills']
  registry: SkillRegistry
  searchQuery: string
  selectedCategoryId: string
}

interface SearchableSkillEntry {
  skill: SkillRegistry['skills'][number]
  categoryName: string
  authorName: string
}

export function useFilteredSkills({ skills, registry, searchQuery, selectedCategoryId }: UseFilteredSkillsInput) {
  const categoryFilteredSkills = useMemo(
    () => (selectedCategoryId === 'all' ? skills : skills.filter((skill) => skill.category === selectedCategoryId)),
    [selectedCategoryId, skills],
  )

  const searchableSkills = useMemo<SearchableSkillEntry[]>(
    () =>
      categoryFilteredSkills.map((skill) => ({
        skill,
        categoryName: registry.categories[skill.category]?.name ?? skill.category,
        authorName: skill.author ?? '',
      })),
    [categoryFilteredSkills, registry.categories],
  )

  const fuse = useMemo(
    () =>
      new Fuse(searchableSkills, {
        keys: ['skill.name', 'skill.description', 'skill.category', 'categoryName', 'authorName'],
        threshold: 0.3,
        ignoreLocation: true,
      }),
    [searchableSkills],
  )

  return useMemo(() => {
    const normalizedQuery = searchQuery.trim()
    if (!normalizedQuery) {
      return categoryFilteredSkills
    }

    return fuse.search(normalizedQuery).map((result) => result.item.skill)
  }, [categoryFilteredSkills, fuse, searchQuery])
}
