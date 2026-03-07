import { join, normalize, resolve, sep } from 'node:path'

import { CACHE_BASE_DIR, CACHE_NAMESPACE, CATEGORY_FOLDER_PATTERN } from './constants'

/**
 * Converts a category id such as `core-migration` into a display label.
 *
 * @param categoryId - Hyphenated category identifier.
 * @returns Human-friendly title-cased category name.
 *
 * @example
 * ```ts
 * formatCategoryName('core-migration') // 'Core Migration'
 * ```
 */
export function formatCategoryName(categoryId: string): string {
  return categoryId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Sanitizes a skill or file name so it can be safely used in filesystem paths.
 *
 * @param name - Raw skill or file name.
 * @returns Sanitized name with unsafe path characters removed.
 *
 * @example
 * ```ts
 * sanitizeName('../my-skill') // 'my-skill'
 * ```
 */
export function sanitizeName(name: string): string {
  const sanitized = name
    .replace(/[/\\]/g, '')
    .replace(/[\0:*?"<>|]/g, '')
    .replace(/^[.\\s]+|[.\\s]+$/g, '')
    .replace(/\.{2,}/g, '')
    .replace(/^\.+/, '')

  return (sanitized || 'unnamed-skill').substring(0, 255)
}

/**
 * Verifies that a target path stays within the provided base path.
 *
 * @param basePath - Allowed root path.
 * @param targetPath - Candidate path to validate.
 * @returns `true` when the resolved target stays inside the base path.
 *
 * @example
 * ```ts
 * isPathSafe('/repo/.agents', '/repo/.agents/skills/accessibility') // true
 * ```
 */
export function isPathSafe(basePath: string, targetPath: string): boolean {
  const normalizedBase = normalize(resolve(basePath))
  const normalizedTarget = normalize(resolve(targetPath))
  return normalizedTarget.startsWith(normalizedBase + sep) || normalizedTarget === normalizedBase
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
 * Returns the relative cache directory used by registry and download services.
 *
 * @returns Cache path relative to the user's home directory.
 *
 * @example
 * ```ts
 * getCacheDir() // '.cache/agent-skills'
 * ```
 */
export function getCacheDir(): string {
  return join(CACHE_BASE_DIR, CACHE_NAMESPACE)
}
