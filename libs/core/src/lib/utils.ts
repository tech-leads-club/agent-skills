import { join, normalize, resolve, sep } from 'node:path'

import { CACHE_BASE_DIR, CACHE_NAMESPACE } from './constants'

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
    .replace(/^[.\s]+|[.\s]+$/g, '')
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
