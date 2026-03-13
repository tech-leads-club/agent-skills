import { join } from 'node:path'

import { CACHE_BASE_DIR, CACHE_NAMESPACE, SKILLS_SUBDIR } from '../constants'

const UNSAFE_PATH_PATTERNS = [/[/\\]/g, /\.\./g, /[<>:"|?*]/g] as const

const cachedHashes = new Map<string, string>()

function sanitizeName(name: string): string {
  return UNSAFE_PATH_PATTERNS.reduce((result, pattern) => result.replace(pattern, ''), name).trim()
}

/**
 * Returns the base cache directory used by the registry service.
 *
 * @returns Relative cache directory used to store registry and skill payloads.
 *
 * @example
 * ```ts
 * const cacheDir = getCacheDir()
 * // .cache/agent-skills
 * ```
 */
export function getCacheDir(): string {
  return join(CACHE_BASE_DIR, CACHE_NAMESPACE)
}

/**
 * Resolves the local cache path for a skill.
 *
 * @param skillName - Canonical skill name.
 * @returns Relative cache path for the skill directory.
 * @throws {Error} Throws when the skill name is empty or unsafe after sanitization.
 *
 * @example
 * ```ts
 * const path = getSkillCachePath('accessibility')
 * // .cache/agent-skills/skills/accessibility
 * ```
 */
export function getSkillCachePath(skillName: string): string {
  const safeName = sanitizeName(skillName)
  if (!safeName) throw new Error('Invalid skill name')
  return join(getCacheDir(), SKILLS_SUBDIR, safeName)
}

/**
 * Returns the in-memory cached content hash for a previously downloaded skill.
 *
 * @param skillName - Canonical skill name.
 * @returns The cached content hash when known; otherwise `undefined`.
 *
 * @example
 * ```ts
 * const hash = getCachedContentHash('accessibility')
 * ```
 */
export function getCachedContentHash(skillName: string): string | undefined {
  return cachedHashes.get(skillName)
}

export function setCachedContentHash(skillName: string, contentHash: string): void {
  cachedHashes.set(skillName, contentHash)
}

export function clearCachedContentHash(skillName: string): void {
  cachedHashes.delete(skillName)
}

export function clearAllCachedContentHashes(): void {
  cachedHashes.clear()
}
