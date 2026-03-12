import { join } from 'node:path'

import { CATEGORY_FOLDER_PATTERN, CATEGORY_METADATA_FILE, SKILLS_CATALOG_DIR } from '../constants'
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
