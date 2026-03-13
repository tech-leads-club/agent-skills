import { join } from 'node:path'

import {
  CATEGORY_FOLDER_PATTERN,
  CATEGORY_METADATA_FILE,
  DEFAULT_CATEGORY,
  DEFAULT_CATEGORY_ID,
  SKILLS_CATALOG_DIR,
} from '../constants'
import type { CorePorts } from '../ports'
import type { CategoryInfo, CategoryMetadata } from '../types'
import { formatCategoryName } from '../utils'

import { findProjectRoot } from './project-root.service'

function getSkillsDir(ports: CorePorts): string {
  return join(findProjectRoot(ports), SKILLS_CATALOG_DIR)
}

/**
 * Extracts a category id from a folder name such as `(frontend)`.
 *
 * @param folderName - Folder name from the skills catalog.
 * @returns The extracted category id or `null` when the folder is not a category folder.
 *
 * @example
 * ```ts
 * extractCategoryId('(frontend)') // 'frontend'
 * ```
 */
export function extractCategoryId(folderName: string): string | null {
  const match = folderName.match(CATEGORY_FOLDER_PATTERN)
  return match ? match[1] : null
}

/**
 * Checks whether a folder name matches the category-folder convention.
 *
 * @param folderName - Folder name to validate.
 * @returns `true` when the folder name follows the `(category-id)` pattern.
 *
 * @example
 * ```ts
 * isCategoryFolder('(quality)') // true
 * ```
 */
export function isCategoryFolder(folderName: string): boolean {
  return CATEGORY_FOLDER_PATTERN.test(folderName)
}

/**
 * Converts a category id into its folder representation.
 *
 * @param categoryId - Category identifier.
 * @returns Category folder name used in the skills catalog.
 *
 * @example
 * ```ts
 * categoryIdToFolderName('quality') // '(quality)'
 * ```
 */
export function categoryIdToFolderName(categoryId: string): string {
  return `(${categoryId})`
}

/**
 * Loads category metadata overrides from the local skills catalog.
 *
 * @param ports - Core ports used to locate and read the catalog metadata file.
 * @returns Parsed category metadata or an empty object when the file is missing or invalid.
 *
 * @example
 * ```ts
 * const metadata = loadCategoryMetadata(ports)
 * ```
 */
export function loadCategoryMetadata(ports: CorePorts): CategoryMetadata {
  const metadataPath = join(getSkillsDir(ports), CATEGORY_METADATA_FILE)
  if (!ports.fs.existsSync(metadataPath)) return {}

  try {
    const content = ports.fs.readFileSync(metadataPath, 'utf-8')
    return JSON.parse(content) as CategoryMetadata
  } catch {
    return {}
  }
}

/**
 * Returns every category discovered in the local skills catalog.
 *
 * @param ports - Core ports used to resolve the catalog path and read directory entries.
 * @returns Categories sorted alphabetically by display name.
 *
 * @example
 * ```ts
 * const categories = getCategories(ports)
 * ```
 */
export function getCategories(ports: CorePorts): CategoryInfo[] {
  const skillsDir = getSkillsDir(ports)
  if (!ports.fs.existsSync(skillsDir)) return []

  const metadata = loadCategoryMetadata(ports)
  const entries = ports.fs.readdirSync(skillsDir, { withFileTypes: true })
  const categories: CategoryInfo[] = []

  let index = 0
  for (const entry of entries) {
    if (!entry.isDirectory() || !isCategoryFolder(entry.name)) continue

    const categoryId = extractCategoryId(entry.name)
    if (!categoryId) continue

    const meta = metadata[entry.name] ?? {}
    categories.push({
      id: categoryId,
      name: meta.name ?? formatCategoryName(categoryId),
      description: meta.description,
      priority: meta.priority ?? index,
    })
    index++
  }

  categories.sort((a, b) => a.name.localeCompare(b.name))
  return categories
}

/**
 * Looks up a category by its identifier.
 *
 * @param ports - Core ports used to read the available categories.
 * @param id - Category identifier to search for.
 * @returns The matching category or `undefined` when it does not exist.
 *
 * @example
 * ```ts
 * const category = getCategoryById(ports, 'quality')
 * ```
 */
export function getCategoryById(ports: CorePorts, id: string): CategoryInfo | undefined {
  return getCategories(ports).find((category) => category.id === id)
}

/**
 * Groups skills by their category information.
 *
 * @typeParam T - Skill-like object that exposes a `name` and optional `category`.
 * @param ports - Core ports used to read local categories when available.
 * @param skills - Skills to group.
 * @returns A map keyed by category info with alphabetically sorted skill lists.
 *
 * @example
 * ```ts
 * const grouped = groupSkillsByCategory(ports, [
 *   { name: 'a11y', category: 'quality' },
 *   { name: 'seo', category: 'quality' },
 * ])
 * ```
 */
export function groupSkillsByCategory<T extends { name: string; category?: string; description?: string }>(
  ports: CorePorts,
  skills: T[],
): Map<CategoryInfo, T[]> {
  let categories = getCategories(ports)

  if (categories.length === 0) {
    const categoryIds = new Set(skills.map((skill) => skill.category).filter(Boolean) as string[])
    categories = Array.from(categoryIds).map((id, index) => ({
      id,
      name: formatCategoryName(id),
      priority: index,
    }))
  }

  const grouped = new Map<CategoryInfo, T[]>()

  for (const category of categories) {
    grouped.set(category, [])
  }

  grouped.set(DEFAULT_CATEGORY, [])

  for (const skill of skills) {
    const categoryId = skill.category ?? DEFAULT_CATEGORY_ID
    let category = categories.find((candidate) => candidate.id === categoryId)

    if (!category && categoryId !== DEFAULT_CATEGORY_ID) {
      category = {
        id: categoryId,
        name: formatCategoryName(categoryId),
        priority: 999,
      }
      categories.push(category)
      grouped.set(category, [])
    }

    const targetCategory = category ?? DEFAULT_CATEGORY
    const group = grouped.get(targetCategory) ?? []
    group.push(skill)
    grouped.set(targetCategory, group)
  }

  for (const [category, skillList] of grouped) {
    if (skillList.length === 0) grouped.delete(category)
  }

  const sortedGrouped = new Map<CategoryInfo, T[]>()
  const sortedCategories = Array.from(grouped.keys()).sort((a, b) => a.name.localeCompare(b.name))

  for (const category of sortedCategories) {
    const categorySkills = grouped.get(category)

    if (categorySkills) {
      categorySkills.sort((a, b) => a.name.localeCompare(b.name))
      sortedGrouped.set(category, categorySkills)
    }
  }

  return sortedGrouped
}

/**
 * Resolves the category id for a skill folder in the local catalog.
 *
 * @param ports - Core ports used to inspect the local skills catalog.
 * @param skillName - Skill folder name to search for.
 * @returns The matching category id or the default uncategorized id.
 *
 * @example
 * ```ts
 * const categoryId = getSkillCategoryId(ports, 'accessibility')
 * ```
 */
export function getSkillCategoryId(ports: CorePorts, skillName: string): string {
  const skillsDir = getSkillsDir(ports)
  if (!ports.fs.existsSync(skillsDir)) return DEFAULT_CATEGORY_ID

  const entries = ports.fs.readdirSync(skillsDir, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory() || !isCategoryFolder(entry.name)) continue

    const categoryId = extractCategoryId(entry.name)
    if (!categoryId) continue

    const categoryPath = join(skillsDir, entry.name)
    const skillPath = join(categoryPath, skillName)
    if (ports.fs.existsSync(join(skillPath, 'SKILL.md'))) return categoryId
  }

  return DEFAULT_CATEGORY_ID
}

/**
 * Resolves the full category information for a skill.
 *
 * @param ports - Core ports used to inspect skills and categories.
 * @param skillName - Skill folder name to search for.
 * @returns The matching category or the default uncategorized category.
 *
 * @example
 * ```ts
 * const category = getSkillCategory(ports, 'accessibility')
 * ```
 */
export function getSkillCategory(ports: CorePorts, skillName: string): CategoryInfo {
  const categoryId = getSkillCategoryId(ports, skillName)
  return getCategoryById(ports, categoryId) ?? DEFAULT_CATEGORY
}

/**
 * Persists category metadata overrides to the local skills catalog.
 *
 * @param ports - Core ports used to locate and write the catalog metadata file.
 * @param metadata - Category metadata keyed by category folder name.
 * @returns Nothing.
 *
 * @example
 * ```ts
 * saveCategoryMetadata(ports, {
 *   '(quality)': { name: 'Quality' },
 * })
 * ```
 */
export function saveCategoryMetadata(ports: CorePorts, metadata: CategoryMetadata): void {
  const metadataPath = join(getSkillsDir(ports), CATEGORY_METADATA_FILE)
  const content = JSON.stringify(metadata, null, 2)
  ports.fs.writeFileSync(metadataPath, content + '\n', 'utf-8')
}

/**
 * Checks whether a category exists in the local catalog.
 *
 * @param ports - Core ports used to read the available categories.
 * @param categoryId - Category identifier to look up.
 * @returns `true` when the category exists.
 *
 * @example
 * ```ts
 * const exists = categoryExists(ports, 'quality')
 * ```
 */
export function categoryExists(ports: CorePorts, categoryId: string): boolean {
  return getCategories(ports).some((category) => category.id === categoryId)
}
