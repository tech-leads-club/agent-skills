import { join } from 'node:path'

import {
  CACHE_BASE_DIR,
  CACHE_NAMESPACE,
  REGISTRY_CACHE_FILENAME,
  REGISTRY_CACHE_TTL_MS,
  SKILLS_CATALOG_PACKAGE,
  SKILLS_SUBDIR,
} from '../constants'
import type { CorePorts } from '../ports'
import type { SkillsRegistry } from '../types'

const UNSAFE_PATH_PATTERNS = [/[/\\]/g, /\.\./g, /[<>:"|?*]/g] as const

const cachedHashes = new Map<string, string>()
let cachedCdnRef: string | null = null

type CachedRegistry = {
  fetchedAt: number
  registry: SkillsRegistry
}

function sanitizeName(name: string): string {
  return UNSAFE_PATH_PATTERNS.reduce((result, pattern) => result.replace(pattern, ''), name).trim()
}

function getResolvedCacheDir(ports: CorePorts): string {
  return join(ports.env.homedir(), getCacheDir())
}

function getRegistryCachePath(ports: CorePorts): string {
  return join(getResolvedCacheDir(ports), REGISTRY_CACHE_FILENAME)
}

async function ensureCacheDir(ports: CorePorts): Promise<void> {
  const cacheDir = getResolvedCacheDir(ports)
  const skillsCacheDir = join(cacheDir, SKILLS_SUBDIR)

  if (!ports.fs.existsSync(cacheDir)) {
    await ports.fs.mkdir(cacheDir, { recursive: true })
  }

  if (!ports.fs.existsSync(skillsCacheDir)) {
    await ports.fs.mkdir(skillsCacheDir, { recursive: true })
  }
}

function isCacheValid(fetchedAt: number): boolean {
  return Date.now() - fetchedAt < REGISTRY_CACHE_TTL_MS
}

function tryReadCachedRegistry(ports: CorePorts): CachedRegistry | null {
  const cachePath = getRegistryCachePath(ports)
  if (!ports.fs.existsSync(cachePath)) return null

  try {
    const content = ports.fs.readFileSync(cachePath, 'utf-8')
    return JSON.parse(content) as CachedRegistry
  } catch {
    return null
  }
}

function saveRegistryToCache(ports: CorePorts, registry: SkillsRegistry): void {
  const cachePath = getRegistryCachePath(ports)
  const payload: CachedRegistry = { fetchedAt: Date.now(), registry }
  ports.fs.writeFileSync(cachePath, JSON.stringify(payload, null, 2), 'utf-8')
}

async function getResolvedCdnRef(ports: CorePorts): Promise<string> {
  const envRef = ports.env.getEnv('SKILLS_CDN_REF')
  if (envRef) return envRef

  if (cachedCdnRef) return cachedCdnRef

  try {
    cachedCdnRef = await ports.packageResolver.getLatestVersion(SKILLS_CATALOG_PACKAGE)
    return cachedCdnRef
  } catch {
    return 'latest'
  }
}

function buildUrls(cdnRef: string): {
  registry: string
  fallbackRegistry: string
  skillsBase: string
  fallbackSkillsBase: string
} {
  const cdnBase = `https://cdn.jsdelivr.net/npm/${SKILLS_CATALOG_PACKAGE}@${cdnRef}`
  const fallbackCdnBase = `https://unpkg.com/${SKILLS_CATALOG_PACKAGE}@${cdnRef}`

  return {
    registry: `${cdnBase}/skills-registry.json`,
    fallbackRegistry: `${fallbackCdnBase}/skills-registry.json`,
    skillsBase: `${cdnBase}/skills`,
    fallbackSkillsBase: `${fallbackCdnBase}/skills`,
  }
}

/**
 * Fetches the remote skills registry using CDN fallback and local cache.
 *
 * @param ports - Core ports used for filesystem, HTTP, environment, package resolution, and logging.
 * @param forceRefresh - When `true`, bypasses TTL cache validation and fetches from remote.
 * @returns A registry payload, cached fallback payload, or `null` when no payload is available.
 *
 * @example
 * ```ts
 * const registry = await fetchRegistry(ports)
 * ```
 */
export async function fetchRegistry(ports: CorePorts, forceRefresh = false): Promise<SkillsRegistry | null> {
  await ensureCacheDir(ports)
  const resolvedRef = await getResolvedCdnRef(ports)

  if (!forceRefresh) {
    const cached = tryReadCachedRegistry(ports)
    const versionChanged = cached && resolvedRef !== 'latest' && cached.registry.version !== resolvedRef

    if (cached && isCacheValid(cached.fetchedAt) && !versionChanged) {
      return cached.registry
    }
  }

  try {
    const urls = buildUrls(resolvedRef)
    const response = await ports.http.getWithFallback(urls.registry, urls.fallbackRegistry)
    const registry = (await response.json()) as SkillsRegistry
    saveRegistryToCache(ports, registry)
    return registry
  } catch (error) {
    const cached = tryReadCachedRegistry(ports)
    if (cached) return cached.registry

    ports.logger.error(`Failed to fetch registry: ${error instanceof Error ? error.message : String(error)}`)
    return null
  }
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
