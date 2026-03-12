import { CATEGORY_FOLDER_PATTERN } from '../constants'

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
