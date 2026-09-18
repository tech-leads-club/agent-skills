import type { Category, Skill } from '../types'
import { buildSearchIndex, searchSkills, type SkillSearchDoc } from './skills-search'

export type SkillSortOption = 'featured' | 'name' | 'recent'

export interface SkillsFilterInput {
  skills: Skill[]
  searchQuery: string
  selectedCategory: string | null
  sortBy: SkillSortOption
  featuredSkillId?: string
  /** Prebuilt index; pass one from a `useMemo` so typing does not re-normalize the catalog. */
  searchIndex?: SkillSearchDoc[]
  /** Category names, so a search for "Go-to-Market" matches skills in the `gtm` category. */
  categories?: Category[]
}

export interface SkillsFilterResult {
  skills: Skill[]
  /** How many leading results matched every query term; the rest are looser matches. */
  fullMatchCount: number
}

/**
 * Pure filter/sort used by the skills hub client — unit-tested so filter UX
 * regressions are caught without a browser harness.
 *
 * why: with a query present, `featured` means "best match first" — pinning one skill above a
 * direct hit for its own name is what made search feel broken. Explicit `name` / `recent`
 * choices always win, since the user asked for that order.
 */
export function filterAndSortSkillsWithMeta({
  skills,
  searchQuery,
  selectedCategory,
  sortBy,
  featuredSkillId = 'tlc-spec-driven',
  searchIndex,
  categories,
}: SkillsFilterInput): SkillsFilterResult {
  const inCategory = selectedCategory === null ? skills : skills.filter((skill) => skill.category === selectedCategory)

  const hasQuery = searchQuery.trim() !== ''
  let result: Skill[]
  let fullMatchCount: number

  if (hasQuery) {
    const allowed = new Set(inCategory.map((skill) => skill.id))
    const docs = (searchIndex ?? buildSearchIndex(skills, categories)).filter((doc) => allowed.has(doc.skill.id))
    const matches = searchSkills(docs, searchQuery)
    fullMatchCount = matches.filter((match) => !match.partial).length
    result = matches.map((match) => match.skill)
    if (sortBy === 'featured') return { skills: result, fullMatchCount }
  } else {
    result = [...inCategory]
    fullMatchCount = result.length
  }

  if (sortBy === 'recent') {
    return {
      skills: [...result].sort((a, b) => b.metadata.lastModified.localeCompare(a.metadata.lastModified)),
      fullMatchCount,
    }
  }
  if (sortBy === 'name') {
    return { skills: [...result].sort((a, b) => a.name.localeCompare(b.name)), fullMatchCount }
  }

  return {
    skills: [...result].sort((a, b) => {
      if (a.id === featuredSkillId) return -1
      if (b.id === featuredSkillId) return 1
      return a.name.localeCompare(b.name)
    }),
    fullMatchCount,
  }
}

/** Skills-only view of {@link filterAndSortSkillsWithMeta}. */
export function filterAndSortSkills(input: SkillsFilterInput): Skill[] {
  return filterAndSortSkillsWithMeta(input).skills
}

export function paginateSkills<T>(items: T[], currentPage: number, pageSize: number): T[] {
  const startIndex = (currentPage - 1) * pageSize
  return items.slice(startIndex, startIndex + pageSize)
}
