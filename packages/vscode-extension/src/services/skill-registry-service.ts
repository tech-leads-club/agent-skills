import * as vscode from 'vscode'
import type { Skill, SkillRegistry } from '../shared/types'
import type { LoggingService } from './logging-service'

/**
 * Cache entry stored in globalState.
 */
interface RegistryCacheEntry {
  data: SkillRegistry
  timestamp: number // Date.now() from last successful fetch
}

/**
 * Service for fetching, caching, and validating the skills registry from CDN.
 * Implements stale-while-revalidate pattern for optimal UX.
 */
export class SkillRegistryService implements vscode.Disposable {
  private static readonly CDN_URL =
    'https://cdn.jsdelivr.net/gh/tech-leads-club/agent-skills@main/packages/skills-catalog/skills-registry.json'
  private static readonly CACHE_KEY = 'agentSkills.registryCache'
  private static readonly TTL = 3_600_000 // 1 hour in milliseconds

  private inFlightFetch: Promise<SkillRegistry> | null = null

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly logger: LoggingService,
  ) {}

  /**
   * Get registry data. Returns cached data immediately if available, then refreshes in background.
   * First call fetches from network.
   */
  public async getRegistry(): Promise<SkillRegistry> {
    const cached = this.loadCache()

    if (!cached) {
      // No cache — must fetch from network
      this.logger.info('[SkillRegistry] No cache found, fetching from CDN...')
      return this.fetchFromCdn()
    }

    const age = Date.now() - cached.timestamp
    const stale = age >= SkillRegistryService.TTL

    if (stale) {
      this.logger.info(`[SkillRegistry] Cache is stale (${Math.round(age / 1000 / 60)}m old), fetching fresh data...`)
      // Stale cache — return it immediately but also await fresh data
      try {
        return await this.fetchFromCdn()
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        this.logger.warn(`[SkillRegistry] Network fetch failed: ${errorMessage}, using stale cache as fallback`)
        return cached.data
      }
    }

    // Fresh cache — return it and trigger background refresh
    this.logger.debug('[SkillRegistry] Cache is fresh, returning cached data and refreshing in background')
    this.fetchFromCdn().catch((err: unknown) => {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      this.logger.warn(`[SkillRegistry] Background refresh failed: ${errorMessage}`)
    })
    return cached.data
  }

  /**
   * Force-fetch fresh data from CDN, bypassing cache TTL logic.
   */
  public async refresh(): Promise<SkillRegistry> {
    this.logger.info('[SkillRegistry] Forced refresh requested')
    return this.fetchFromCdn()
  }

  /**
   * Fetch registry from CDN, validate, and cache the result.
   * Deduplicates concurrent calls.
   */
  private async fetchFromCdn(): Promise<SkillRegistry> {
    // Deduplicate concurrent fetches
    if (this.inFlightFetch) {
      this.logger.debug('[SkillRegistry] Deduplicating concurrent fetch')
      return this.inFlightFetch
    }

    this.inFlightFetch = this.doFetch()

    try {
      const result = await this.inFlightFetch
      return result
    } finally {
      this.inFlightFetch = null
    }
  }

  /**
   * Actual HTTP fetch logic.
   */
  private async doFetch(): Promise<SkillRegistry> {
    try {
      this.logger.debug(`[SkillRegistry] Fetching from ${SkillRegistryService.CDN_URL}`)

      const response = await fetch(SkillRegistryService.CDN_URL)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const raw = await response.json()
      const validated = this.validate(raw)

      // Save to cache
      this.saveCache({ data: validated, timestamp: Date.now() })
      this.logger.info(`[SkillRegistry] Fetched and cached ${validated.skills.length} skills`)

      return validated
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      this.logger.error(`[SkillRegistry] Fetch failed: ${errorMessage}`)

      // Try to return cached data if available
      const cached = this.loadCache()
      if (cached) {
        this.logger.warn('[SkillRegistry] Returning cached data due to network failure')
        return cached.data
      }

      // No cache, no network — throw
      throw new Error(`Failed to fetch registry: ${errorMessage}`)
    }
  }

  /**
   * Validate and sanitize registry JSON.
   * Filters out invalid skill entries.
   */
  private validate(raw: unknown): SkillRegistry {
    if (typeof raw !== 'object' || raw === null) {
      throw new Error('Invalid registry: not an object')
    }

    const data = raw as Record<string, unknown>

    if (!Array.isArray(data.skills)) {
      throw new Error('Invalid registry: missing or invalid "skills" array')
    }

    // Filter out skills missing required fields
    const validSkills = data.skills.filter((skill: unknown): skill is Skill => {
      if (typeof skill !== 'object' || skill === null) {
        this.logger.warn(`[SkillRegistry] Skipping non-object skill entry`)
        return false
      }

      const s = skill as Record<string, unknown>
      const valid =
        typeof s.name === 'string' &&
        typeof s.description === 'string' &&
        typeof s.category === 'string' &&
        typeof s.path === 'string' &&
        Array.isArray(s.files) &&
        typeof s.contentHash === 'string'

      if (!valid) {
        this.logger.warn(`[SkillRegistry] Skipping invalid skill entry: ${JSON.stringify(skill)}`)
      }

      return valid
    })

    const version = typeof data.version === 'string' ? data.version : 'unknown'
    const categories =
      typeof data.categories === 'object' && data.categories !== null && !Array.isArray(data.categories)
        ? (data.categories as Record<string, { name: string; description: string }>)
        : {}

    return {
      version,
      categories,
      skills: validSkills,
    }
  }

  /**
   * Load cache from globalState.
   */
  private loadCache(): RegistryCacheEntry | null {
    const cached = this.context.globalState.get<RegistryCacheEntry>(SkillRegistryService.CACHE_KEY)
    return cached || null
  }

  /**
   * Save cache to globalState.
   */
  private saveCache(entry: RegistryCacheEntry): void {
    this.context.globalState.update(SkillRegistryService.CACHE_KEY, entry).then(
      () => this.logger.debug('[SkillRegistry] Cache saved'),
      (saveErr: unknown) => {
        const errMsg = saveErr instanceof Error ? saveErr.message : 'Unknown error'
        this.logger.error(`[SkillRegistry] Failed to save cache: ${errMsg}`)
      },
    )
  }

  /**
   * Cleanup (no-op for this service, but required by Disposable).
   */
  public dispose(): void {
    this.logger.debug('[SkillRegistry] Service disposed')
  }
}
