import ky from 'ky'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import packageJson from 'package-json'

import type { CategoryInfo, SkillInfo } from '../types'
import {
  CACHE_BASE_DIR,
  CACHE_NAMESPACE,
  FETCH_TIMEOUT_MS,
  MAX_CONCURRENT_DOWNLOADS,
  MAX_RETRIES,
  REGISTRY_CACHE_FILENAME,
  REGISTRY_CACHE_TTL_MS,
  RETRY_BASE_DELAY_MS,
  SKILL_META_FILE,
  SKILLS_CATALOG_PACKAGE,
  SKILLS_SUBDIR,
} from '../utils/constants'

export interface SkillMetadata {
  name: string
  description: string
  category: string
  path: string
  files: string[]
  author?: string
  version?: string
  contentHash?: string
}

interface CachedSkillMeta {
  contentHash: string
  downloadedAt: number
}

export interface CategoryMetadata {
  name: string
  description?: string
}

export interface SkillsRegistry {
  version: string
  generatedAt: string
  baseUrl: string
  categories: Record<string, CategoryMetadata>
  skills: SkillMetadata[]
}

interface CachedRegistry {
  fetchedAt: number
  registry: SkillsRegistry
}

const CONFIG = {
  cacheTtlMs: REGISTRY_CACHE_TTL_MS,
  fetchTimeoutMs: FETCH_TIMEOUT_MS,
  maxRetries: MAX_RETRIES,
  retryBaseDelayMs: RETRY_BASE_DELAY_MS,
  maxConcurrentDownloads: MAX_CONCURRENT_DOWNLOADS,
} as const

const PATHS = {
  cacheDir: join(homedir(), CACHE_BASE_DIR, CACHE_NAMESPACE),
  get registryCacheFile() {
    return join(this.cacheDir, REGISTRY_CACHE_FILENAME)
  },
  get skillsCacheDir() {
    return join(this.cacheDir, SKILLS_SUBDIR)
  },
} as const

const UNSAFE_PATH_PATTERNS = [/[/\\]/g, /\.\./g, /[<>:"|?*]/g] as const

function ensureCacheDir(): void {
  if (!existsSync(PATHS.cacheDir)) mkdirSync(PATHS.cacheDir, { recursive: true })
  if (!existsSync(PATHS.skillsCacheDir)) mkdirSync(PATHS.skillsCacheDir, { recursive: true })
}

function isCacheValid(fetchedAt: number): boolean {
  return Date.now() - fetchedAt < CONFIG.cacheTtlMs
}

function tryReadCachedRegistry(): CachedRegistry | null {
  if (!existsSync(PATHS.registryCacheFile)) return null
  try {
    const content = readFileSync(PATHS.registryCacheFile, 'utf-8')
    return JSON.parse(content) as CachedRegistry
  } catch {
    return null
  }
}

function saveRegistryToCache(registry: SkillsRegistry): void {
  const cached: CachedRegistry = { fetchedAt: Date.now(), registry }
  writeFileSync(PATHS.registryCacheFile, JSON.stringify(cached, null, 2))
}

const httpClient = ky.create({
  timeout: CONFIG.fetchTimeoutMs,
  retry: {
    limit: CONFIG.maxRetries,
    methods: ['get'],
    statusCodes: [408, 429, 500, 502, 503, 504],
    backoffLimit: 10_000,
    delay: (attemptCount) => CONFIG.retryBaseDelayMs * Math.pow(2, attemptCount - 1),
    jitter: true,
    retryOnTimeout: true,
  },
})

async function fetchWithFallback(url: string, fallbackUrl?: string): Promise<Response> {
  try {
    return await httpClient.get(url)
  } catch (error) {
    if (fallbackUrl) {
      try {
        return await httpClient.get(fallbackUrl)
      } catch {
        // Fallback also failed, ignore and throw original error
      }
    }

    throw error
  }
}

let cachedCdnRef: string | null = null

async function getResolvedCdnRef(): Promise<string> {
  if (process.env.SKILLS_CDN_REF) return process.env.SKILLS_CDN_REF
  if (cachedCdnRef) return cachedCdnRef

  try {
    const pkg = await packageJson(SKILLS_CATALOG_PACKAGE, { version: 'latest' })
    cachedCdnRef = pkg.version as string
    return cachedCdnRef
  } catch {
    return 'latest'
  }
}

function buildUrls(cdnRef: string) {
  const cdnBase = `https://cdn.jsdelivr.net/npm/${SKILLS_CATALOG_PACKAGE}@${cdnRef}`
  const fallbackCdnBase = `https://unpkg.com/${SKILLS_CATALOG_PACKAGE}@${cdnRef}`
  return {
    registry: `${cdnBase}/skills-registry.json`,
    fallbackRegistry: `${fallbackCdnBase}/skills-registry.json`,
    skillsBase: `${cdnBase}/skills`,
    fallbackSkillsBase: `${fallbackCdnBase}/skills`,
  }
}

export async function fetchRegistry(forceRefresh = false): Promise<SkillsRegistry | null> {
  ensureCacheDir()

  const resolvedRef = await getResolvedCdnRef()

  if (!forceRefresh) {
    const cached = tryReadCachedRegistry()
    const versionChanged = cached && resolvedRef !== 'latest' && cached.registry.version !== resolvedRef
    if (cached && isCacheValid(cached.fetchedAt) && !versionChanged) return cached.registry
  }

  try {
    const urls = buildUrls(resolvedRef)
    const response = await fetchWithFallback(urls.registry, urls.fallbackRegistry)
    const registry = (await response.json()) as SkillsRegistry
    saveRegistryToCache(registry)
    return registry
  } catch (error) {
    const cached = tryReadCachedRegistry()
    if (cached) return cached.registry
    console.error(`Failed to fetch registry: ${error instanceof Error ? error.message : error}`)
    return null
  }
}

function sanitizeName(name: string): string {
  return UNSAFE_PATH_PATTERNS.reduce((result, pattern) => result.replace(pattern, ''), name).trim()
}

function isPathSafe(basePath: string, targetPath: string): boolean {
  const resolvedBase = join(basePath, '.')
  const resolvedTarget = join(targetPath, '.')
  return resolvedTarget.startsWith(resolvedBase)
}

export function getSkillCachePath(skillName: string): string {
  const safeName = sanitizeName(skillName)
  if (!safeName) throw new Error('Invalid skill name')
  return join(PATHS.skillsCacheDir, safeName)
}

export function isSkillCached(skillName: string): boolean {
  try {
    const skillPath = getSkillCachePath(skillName)
    return existsSync(join(skillPath, 'SKILL.md'))
  } catch {
    return false
  }
}

function saveCachedSkillMeta(skillName: string, meta: CachedSkillMeta): void {
  try {
    const metaPath = join(getSkillCachePath(skillName), SKILL_META_FILE)
    writeFileSync(metaPath, JSON.stringify(meta, null, 2))
  } catch {
    // Non-critical: skill works without metadata
  }
}

function readCachedSkillMeta(skillName: string): CachedSkillMeta | null {
  try {
    const metaPath = join(getSkillCachePath(skillName), SKILL_META_FILE)
    if (!existsSync(metaPath)) return null
    return JSON.parse(readFileSync(metaPath, 'utf-8')) as CachedSkillMeta
  } catch {
    return null
  }
}

export async function needsUpdate(skillName: string): Promise<boolean> {
  if (!isSkillCached(skillName)) return true
  const metadata = await getSkillMetadata(skillName)
  if (!metadata?.contentHash) return false
  const cached = readCachedSkillMeta(skillName)
  if (!cached?.contentHash) return true
  return cached.contentHash !== metadata.contentHash
}

export function getCachedContentHash(skillName: string): string | undefined {
  return readCachedSkillMeta(skillName)?.contentHash
}

export async function getUpdatableSkills(skillNames: string[]): Promise<{ toUpdate: string[]; upToDate: string[] }> {
  const toUpdate: string[] = []
  const upToDate: string[] = []

  for (const name of skillNames) {
    if (await needsUpdate(name)) {
      toUpdate.push(name)
    } else {
      upToDate.push(name)
    }
  }

  return { toUpdate, upToDate }
}

async function downloadSkillFile(skill: SkillMetadata, file: string, skillCachePath: string): Promise<boolean> {
  const filePath = join(skillCachePath, file)

  if (!isPathSafe(skillCachePath, filePath)) {
    console.error(`Security: Skipping suspicious file path: ${file}`)
    return false
  }

  const parentDir = join(filePath, '..')
  if (!existsSync(parentDir)) mkdirSync(parentDir, { recursive: true })

  const urls = buildUrls(await getResolvedCdnRef())
  const fileUrl = `${urls.skillsBase}/${skill.path}/${file}`
  const fallbackUrl = `${urls.fallbackSkillsBase}/${skill.path}/${file}`
  const response = await fetchWithFallback(fileUrl, fallbackUrl)
  if (!response.ok) throw new Error(`Failed to download ${file}: HTTP ${response.status}`)
  writeFileSync(filePath, await response.text())
  return true
}

export async function downloadSkill(skill: SkillMetadata): Promise<string | null> {
  const skillCachePath = getSkillCachePath(skill.name)
  ensureCacheDir()

  if (!existsSync(skillCachePath)) mkdirSync(skillCachePath, { recursive: true })

  try {
    const files = [...skill.files]
    let downloadedCount = 0

    for (let i = 0; i < files.length; i += CONFIG.maxConcurrentDownloads) {
      const batch = files.slice(i, i + CONFIG.maxConcurrentDownloads)
      const results = await Promise.all(batch.map((file) => downloadSkillFile(skill, file, skillCachePath)))
      downloadedCount += results.filter(Boolean).length
    }

    if (downloadedCount < files.length) {
      throw new Error(`Only ${downloadedCount}/${files.length} files downloaded successfully`)
    }

    if (skill.contentHash) {
      saveCachedSkillMeta(skill.name, { contentHash: skill.contentHash, downloadedAt: Date.now() })
    }

    return skillCachePath
  } catch (error) {
    console.error(`Failed to download skill ${skill.name}: ${error instanceof Error ? error.message : error}`)
    return null
  }
}

export async function getRemoteSkills(): Promise<SkillInfo[]> {
  const registry = await fetchRegistry()
  if (!registry) return []

  return registry.skills.map((skill) => ({
    name: skill.name,
    description: skill.description,
    path: isSkillCached(skill.name) ? getSkillCachePath(skill.name) : '',
    category: skill.category,
  }))
}

export async function getRemoteCategories(): Promise<CategoryInfo[]> {
  const registry = await fetchRegistry()
  if (!registry) return []

  return Object.entries(registry.categories)
    .map(([id, meta]) => ({
      id,
      name: meta.name,
      description: meta.description,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getSkillMetadata(skillName: string): Promise<SkillMetadata | null> {
  const registry = await fetchRegistry()
  return registry?.skills.find((s) => s.name === skillName) ?? null
}

export async function ensureSkillDownloaded(skillName: string): Promise<string | null> {
  if (isSkillCached(skillName)) return getSkillCachePath(skillName)
  const metadata = await getSkillMetadata(skillName)
  if (!metadata) return null
  return downloadSkill(metadata)
}

export function clearCache(): void {
  try {
    rmSync(PATHS.cacheDir, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
}

export function clearSkillCache(skillName: string): void {
  try {
    rmSync(join(PATHS.skillsCacheDir, skillName), { recursive: true, force: true })
  } catch {
    /* ignore */
  }
}

export function clearRegistryCache(): void {
  try {
    rmSync(PATHS.registryCacheFile, { force: true })
  } catch {
    /* ignore */
  }
}

export async function forceDownloadSkill(skillName: string): Promise<string | null> {
  clearSkillCache(skillName)
  return ensureSkillDownloaded(skillName)
}

export function getCacheDir(): string {
  return PATHS.cacheDir
}
