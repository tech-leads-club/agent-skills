import ky from 'ky'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import type { CategoryInfo, SkillInfo } from './types'

import pkg from '../package.json' with { type: 'json' }

export interface SkillMetadata {
  name: string
  description: string
  category: string
  path: string
  files: string[]
  author?: string
  version?: string
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
  cliVersion: pkg.version,
  cacheTtlMs: 24 * 60 * 60 * 1000,
  fetchTimeoutMs: 15_000,
  maxRetries: 3,
  retryBaseDelayMs: 500,
  maxConcurrentDownloads: 10,
} as const

const PATHS = {
  cacheDir: join(homedir(), '.cache', 'tlc-skills'),
  get registryCacheFile() {
    return join(this.cacheDir, 'registry.json')
  },
  get skillsCacheDir() {
    return join(this.cacheDir, 'skills')
  },
} as const

const URLS = {
  get cdnRef() {
    return process.env.SKILLS_CDN_REF ?? `v${CONFIG.cliVersion}`
  },
  get cdnBase() {
    return `https://cdn.jsdelivr.net/gh/tech-leads-club/agent-skills@${this.cdnRef}`
  },
  get fallbackCdnBase() {
    return `https://raw.githubusercontent.com/tech-leads-club/agent-skills/${this.cdnRef}`
  },
  get registry() {
    return `${this.cdnBase}/packages/skills-catalog/skills-registry.json`
  },
  get fallbackRegistry() {
    return `${this.fallbackCdnBase}/packages/skills-catalog/skills-registry.json`
  },
  get skillsBase() {
    return `${this.cdnBase}/packages/skills-catalog/skills`
  },
  get fallbackSkillsBase() {
    return `${this.fallbackCdnBase}/packages/skills-catalog/skills`
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
    // Try fallback URL if primary failed
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

export async function fetchRegistry(forceRefresh = false): Promise<SkillsRegistry | null> {
  ensureCacheDir()

  if (!forceRefresh) {
    const cached = tryReadCachedRegistry()
    if (cached && isCacheValid(cached.fetchedAt)) return cached.registry
  }

  try {
    const response = await fetchWithFallback(URLS.registry, URLS.fallbackRegistry)

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

async function downloadSkillFile(skill: SkillMetadata, file: string, skillCachePath: string): Promise<boolean> {
  const filePath = join(skillCachePath, file)

  if (!isPathSafe(skillCachePath, filePath)) {
    console.error(`Security: Skipping suspicious file path: ${file}`)
    return false
  }

  const parentDir = join(filePath, '..')
  if (!existsSync(parentDir)) mkdirSync(parentDir, { recursive: true })
  const fileUrl = `${URLS.skillsBase}/${skill.path}/${file}`
  const fallbackUrl = `${URLS.fallbackSkillsBase}/${skill.path}/${file}`
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
