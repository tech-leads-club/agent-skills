import { join } from 'node:path'

import {
  CACHE_BASE_DIR,
  CACHE_NAMESPACE,
  MAX_CONCURRENT_DOWNLOADS,
  REGISTRY_CACHE_FILENAME,
  REGISTRY_CACHE_TTL_MS,
  SKILL_META_FILE,
  SKILLS_CATALOG_PACKAGE,
  SKILLS_SUBDIR,
} from '../constants'
import type { CorePorts } from '../ports'
import type { CategoryInfo, DeprecatedEntry, SkillInfo, SkillMetadata, SkillsRegistry } from '../types'

const UNSAFE_PATH_PATTERNS = [/[/\\]/g, /\.\./g, /[<>:"|?*]/g] as const

const cachedHashes = new Map<string, string>()
let cachedCdnRef: string | null = null

type CachedRegistry = {
  fetchedAt: number
  registry: SkillsRegistry
}

type CachedSkillMeta = {
  contentHash: string
  downloadedAt: number
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

function getResolvedSkillCachePath(ports: CorePorts, skillName: string): string {
  return join(getResolvedCacheDir(ports), SKILLS_SUBDIR, sanitizeName(skillName))
}

function isSkillCachedInternal(ports: CorePorts, skillName: string): boolean {
  try {
    return ports.fs.existsSync(join(getResolvedSkillCachePath(ports, skillName), 'SKILL.md'))
  } catch {
    return false
  }
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

function isPathSafe(basePath: string, targetPath: string): boolean {
  const resolvedBase = join(basePath, '.')
  const resolvedTarget = join(targetPath, '.')
  return resolvedTarget.startsWith(resolvedBase)
}

function saveCachedSkillMeta(ports: CorePorts, skillName: string, meta: CachedSkillMeta): void {
  try {
    const metaPath = join(getResolvedSkillCachePath(ports, skillName), SKILL_META_FILE)
    ports.fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8')
    setCachedContentHash(skillName, meta.contentHash)
  } catch {
    // Non-critical metadata write failure.
  }
}

function readCachedSkillMeta(ports: CorePorts, skillName: string): CachedSkillMeta | null {
  try {
    const metaPath = join(getResolvedSkillCachePath(ports, skillName), SKILL_META_FILE)
    if (!ports.fs.existsSync(metaPath)) return null

    const parsed = JSON.parse(ports.fs.readFileSync(metaPath, 'utf-8')) as CachedSkillMeta
    if (parsed.contentHash) {
      setCachedContentHash(skillName, parsed.contentHash)
    }

    return parsed
  } catch {
    return null
  }
}

async function downloadSkillFile(
  ports: CorePorts,
  skill: SkillMetadata,
  file: string,
  skillCachePath: string,
): Promise<boolean> {
  const filePath = join(skillCachePath, file)

  if (!isPathSafe(skillCachePath, filePath)) {
    ports.logger.error(`Security: Skipping suspicious file path: ${file}`)
    return false
  }

  const parentDir = join(filePath, '..')
  if (!ports.fs.existsSync(parentDir)) {
    await ports.fs.mkdir(parentDir, { recursive: true })
  }

  const resolvedRef = await getResolvedCdnRef(ports)
  const urls = buildUrls(resolvedRef)
  const fileUrl = `${urls.skillsBase}/${skill.path}/${file}`
  const fallbackUrl = `${urls.fallbackSkillsBase}/${skill.path}/${file}`
  const response = await ports.http.getWithFallback(fileUrl, fallbackUrl)

  if (!response.ok) {
    throw new Error(`Failed to download ${file}: HTTP ${response.status}`)
  }

  ports.fs.writeFileSync(filePath, await response.text(), 'utf-8')
  return true
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
 * Downloads a skill from the remote registry CDN into the local cache.
 *
 * @param ports - Core ports used for filesystem, HTTP, environment, package resolution, and logging.
 * @param skill - Skill metadata that describes source path and files to download.
 * @returns Absolute cache directory path on success, otherwise `null`.
 *
 * @example
 * ```ts
 * const cachedPath = await downloadSkill(ports, metadata)
 * ```
 */
export async function downloadSkill(ports: CorePorts, skill: SkillMetadata): Promise<string | null> {
  await ensureCacheDir(ports)
  const skillCachePath = getResolvedSkillCachePath(ports, skill.name)

  if (!ports.fs.existsSync(skillCachePath)) {
    await ports.fs.mkdir(skillCachePath, { recursive: true })
  }

  try {
    const files = [...skill.files]
    let downloadedCount = 0

    for (let index = 0; index < files.length; index += MAX_CONCURRENT_DOWNLOADS) {
      const batch = files.slice(index, index + MAX_CONCURRENT_DOWNLOADS)
      const results = await Promise.all(batch.map((file) => downloadSkillFile(ports, skill, file, skillCachePath)))
      downloadedCount += results.filter(Boolean).length
    }

    if (downloadedCount < files.length) {
      throw new Error(`Only ${downloadedCount}/${files.length} files downloaded successfully`)
    }

    if (skill.contentHash) {
      saveCachedSkillMeta(ports, skill.name, {
        contentHash: skill.contentHash,
        downloadedAt: Date.now(),
      })
    }

    return skillCachePath
  } catch (error) {
    ports.logger.error(
      `Failed to download skill ${skill.name}: ${error instanceof Error ? error.message : String(error)}`,
    )
    return null
  }
}

/**
 * Lists all skills from the remote registry.
 *
 * @param ports - Core ports used to fetch the remote registry and inspect local cache state.
 * @returns Skill descriptors from the registry, with local cache paths when available.
 *
 * @example
 * ```ts
 * const skills = await getRemoteSkills(ports)
 * ```
 */
export async function getRemoteSkills(ports: CorePorts): Promise<SkillInfo[]> {
  const registry = await fetchRegistry(ports)
  if (!registry) return []

  return registry.skills.map((skill) => ({
    name: skill.name,
    description: skill.description,
    path: isSkillCachedInternal(ports, skill.name) ? getResolvedSkillCachePath(ports, skill.name) : '',
    category: skill.category,
  }))
}

/**
 * Lists all categories from the remote registry.
 *
 * @param ports - Core ports used to fetch the remote registry.
 * @returns Categories sorted alphabetically by display name.
 *
 * @example
 * ```ts
 * const categories = await getRemoteCategories(ports)
 * ```
 */
export async function getRemoteCategories(ports: CorePorts): Promise<CategoryInfo[]> {
  const registry = await fetchRegistry(ports)
  if (!registry) return []

  return Object.entries(registry.categories)
    .map(([id, meta]) => ({
      id,
      name: meta.name,
      description: meta.description,
    }))
    .sort((left, right) => left.name.localeCompare(right.name))
}

/**
 * Looks up metadata for a single skill in the remote registry.
 *
 * @param ports - Core ports used to fetch the remote registry.
 * @param name - Canonical skill name to search for.
 * @returns Matching skill metadata when found; otherwise `null`.
 *
 * @example
 * ```ts
 * const metadata = await getSkillMetadata(ports, 'accessibility')
 * ```
 */
export async function getSkillMetadata(ports: CorePorts, name: string): Promise<SkillMetadata | null> {
  const registry = await fetchRegistry(ports)
  return registry?.skills.find((skill) => skill.name === name) ?? null
}

/**
 * Returns all deprecated skill entries published by the remote registry.
 *
 * @param ports - Core ports used to fetch the remote registry.
 * @returns Deprecated skill entries or an empty list when none are defined.
 *
 * @example
 * ```ts
 * const deprecated = await getDeprecatedSkills(ports)
 * ```
 */
export async function getDeprecatedSkills(ports: CorePorts): Promise<DeprecatedEntry[]> {
  const registry = await fetchRegistry(ports)
  return registry?.deprecated ?? []
}

/**
 * Returns deprecated registry entries indexed by skill name.
 *
 * @param ports - Core ports used to fetch the remote registry.
 * @returns A map keyed by deprecated skill name.
 *
 * @example
 * ```ts
 * const deprecatedMap = await getDeprecatedMap(ports)
 * ```
 */
export async function getDeprecatedMap(ports: CorePorts): Promise<Map<string, DeprecatedEntry>> {
  const deprecated = await getDeprecatedSkills(ports)
  return new Map(deprecated.map((entry) => [entry.name, entry]))
}

/**
 * Checks whether a cached skill differs from the current remote registry metadata.
 *
 * @param ports - Core ports used for cache inspection and registry lookup.
 * @param skillName - Canonical skill name to compare.
 * @returns `true` when the skill should be updated, otherwise `false`.
 *
 * @example
 * ```ts
 * const shouldUpdate = await needsUpdate(ports, 'accessibility')
 * ```
 */
export async function needsUpdate(ports: CorePorts, skillName: string): Promise<boolean> {
  if (!isSkillCachedInternal(ports, skillName)) return true

  const metadata = await getSkillMetadata(ports, skillName)
  if (!metadata?.contentHash) return false

  const cached = readCachedSkillMeta(ports, skillName)
  if (!cached?.contentHash) return true

  return cached.contentHash !== metadata.contentHash
}

/**
 * Splits skill names into update-required and up-to-date groups.
 *
 * @param ports - Core ports used to compare cached and remote skill metadata.
 * @param names - Skill names to evaluate.
 * @returns Skill names grouped by update status.
 *
 * @example
 * ```ts
 * const result = await getUpdatableSkills(ports, ['accessibility'])
 * ```
 */
export async function getUpdatableSkills(
  ports: CorePorts,
  names: string[],
): Promise<{ toUpdate: string[]; upToDate: string[] }> {
  const toUpdate: string[] = []
  const upToDate: string[] = []

  for (const name of names) {
    if (await needsUpdate(ports, name)) {
      toUpdate.push(name)
    } else {
      upToDate.push(name)
    }
  }

  return { toUpdate, upToDate }
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
