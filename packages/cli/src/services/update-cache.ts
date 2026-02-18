import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

import { CACHE_FILE, UPDATE_CHECK_CACHE_TTL_MS, CONFIG_DIR } from '../utils/constants'

export interface UpdateCache {
  lastUpdateCheck: number
  latestVersion: string | null
}

function getCachePath(): string {
  return join(homedir(), CONFIG_DIR, CACHE_FILE)
}

function validateCache(cache: unknown): UpdateCache | null {
  if (typeof cache !== 'object' || cache === null) return null
  const partial = cache as Partial<UpdateCache>
  if (typeof partial.lastUpdateCheck !== 'number') return null
  return { lastUpdateCheck: partial.lastUpdateCheck, latestVersion: partial.latestVersion ?? null }
}

export async function getCachedUpdate(): Promise<UpdateCache | null> {
  const cachePath = getCachePath()

  try {
    const content = await readFile(cachePath, 'utf-8')
    const parsed = JSON.parse(content)
    return validateCache(parsed)
  } catch {
    // Return null if file doesn't exist or is invalid
    return null
  }
}

export async function setCachedUpdate(version: string | null): Promise<void> {
  const cachePath = getCachePath()
  const cache: UpdateCache = {
    lastUpdateCheck: Date.now(),
    latestVersion: version,
  }

  // Ensure directory exists
  await mkdir(dirname(cachePath), { recursive: true })
  await writeFile(cachePath, JSON.stringify(cache, null, 2), 'utf-8')
}

export async function isCacheValid(): Promise<boolean> {
  const cache = await getCachedUpdate()
  if (!cache) return false
  const now = Date.now()
  const age = now - cache.lastUpdateCheck
  return age < UPDATE_CHECK_CACHE_TTL_MS
}

export async function clearCache(): Promise<void> {
  const cachePath = getCachePath()

  try {
    const { unlink } = await import('node:fs/promises')
    await unlink(cachePath)
  } catch {
    // Silently fail if file doesn't exist
  }
}
