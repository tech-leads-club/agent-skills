import * as vscode from 'vscode'
import { fetchRegistry } from '@tech-leads-club/core'
import type { CorePorts } from '@tech-leads-club/core'
import type { SkillRegistry } from '../shared/types'
import type { LoggingService } from './logging-service'

/**
 * Cache entry stored in globalState.
 */
interface RegistryCacheEntry {
  data: SkillRegistry
  timestamp: number
}

/**
 * Result produced by CDN fetch operations.
 */
interface CdnFetchResult {
  registry: SkillRegistry
  offlineFallback: boolean
}

/**
 * Metadata returned to callers that need cache provenance.
 */
export interface RegistryResult {
  data: SkillRegistry
  fromCache: boolean
  offline: boolean
}

/**
 * Service for fetching, caching, and validating the skills registry from CDN.
 * Implements stale-while-revalidate UX for the marketplace view.
 */
export class SkillRegistryService implements vscode.Disposable {
  /** URL for the skills registry JSON file on CDN. */
  private static readonly CDN_URL =
    'https://cdn.jsdelivr.net/gh/tech-leads-club/agent-skills@main/packages/skills-catalog/skills-registry.json'

  /** Key used to store the registry cache in VS Code global state. */
  private static readonly CACHE_KEY = 'agentSkills.registryCache'

  /** Time-to-live for the registry cache in milliseconds. */
  private static readonly TTL = 3_600_000

  /** Promise resolving to an in-progress registry fetch, used for deduplication. */
  private inFlightFetch: Promise<CdnFetchResult> | null = null

  /**
   * Creates a registry service instance.
   *
   * @param ports - Core ports for registry fetch.
   * @param context - Extension context used for persisted global state.
   * @param logger - Logging service for registry fetch/cache diagnostics.
   */
  constructor(
    private readonly ports: CorePorts,
    private readonly context: vscode.ExtensionContext,
    private readonly logger: LoggingService,
  ) {}

  /**
   * Get registry data synchronously for consumers that only care about the payload.
   *
   * @returns A promise resolving to registry data.
   *
   * @example
   * ```typescript
   * const registry = await registryService.getRegistry();
   * console.log(registry.skills.length);
   * ```
   */
  public async getRegistry(): Promise<SkillRegistry> {
    return (await this.loadRegistryInternal(false)).data
  }

  /**
   * Force-fetch fresh registry data, bypassing cache TTL.
   *
   * @returns A promise resolving to freshly loaded registry data.
   *
   * @example
   * ```typescript
   * const freshRegistry = await registryService.refresh();
   * ```
   */
  public async refresh(): Promise<SkillRegistry> {
    return (await this.loadRegistryInternal(true)).data
  }

  /**
   * Get registry data along with cache metadata for UI consumers.
   *
   * @param forceRefresh - When true, bypasses cache TTL.
   * @returns A promise resolving to registry data and cache metadata.
   *
   * @example
   * ```typescript
   * const { data, fromCache, offline } = await registryService.getRegistryWithMetadata();
   * ```
   */
  public async getRegistryWithMetadata(forceRefresh = false): Promise<RegistryResult> {
    return this.loadRegistryInternal(forceRefresh)
  }

  /**
   * Centralized loader that handles cache staleness and metadata reporting.
   *
   * @param forceRefresh - When true, bypasses cache TTL.
   * @returns A promise resolving to registry data and cache metadata.
   */
  private async loadRegistryInternal(forceRefresh: boolean): Promise<RegistryResult> {
    const extCached = this.loadCache()

    if (!extCached || forceRefresh) {
      this.logger.info(
        !extCached
          ? '[SkillRegistry] No cache found, fetching via core...'
          : '[SkillRegistry] Forced refresh requested, fetching the latest registry...',
      )
      const fetchResult = await this.fetchFromCdn()
      return {
        data: fetchResult.registry,
        fromCache: fetchResult.offlineFallback,
        offline: fetchResult.offlineFallback,
      }
    }

    const age = Date.now() - extCached.timestamp
    const stale = age >= SkillRegistryService.TTL

    if (stale) {
      this.logger.info(
        `[SkillRegistry] Cache is stale (${Math.round(age / 1000 / 60)}m old), emitting cached data and refreshing in background...`,
      )
      void this.refreshInBackground()
      return { data: extCached.data, fromCache: true, offline: false }
    }

    this.logger.debug('[SkillRegistry] Cache is fresh, returning cached data and refreshing in background')
    void this.refreshInBackground()
    return { data: extCached.data, fromCache: false, offline: false }
  }

  /**
   * Fetch registry from CDN, validate, and cache the result.
   * Deduplicates concurrent calls.
   *
   * @returns A promise resolving to fetch result and offline fallback metadata.
   */
  private async fetchFromCdn(): Promise<CdnFetchResult> {
    if (this.inFlightFetch) {
      this.logger.debug('[SkillRegistry] Deduplicating concurrent fetch')
      return this.inFlightFetch
    }

    this.inFlightFetch = this.doFetch()

    try {
      return await this.inFlightFetch
    } finally {
      this.inFlightFetch = null
    }
  }

  /**
   * Fetches registry via core fetchRegistry.
   *
   * @returns A promise resolving to fetched registry payload metadata.
   * @throws {Error} When fetching fails and no cache is available.
   */
  private async doFetch(): Promise<CdnFetchResult> {
    try {
      this.logger.debug('[SkillRegistry] Fetching via core fetchRegistry')

      const coreRegistry = await fetchRegistry(this.ports, true)
      if (!coreRegistry) {
        throw new Error('Core fetchRegistry returned null')
      }

      const validated = this.mapCoreToShared(coreRegistry)
      this.saveCache({ data: validated, timestamp: Date.now() })
      this.logger.info(`[SkillRegistry] Fetched and cached ${validated.skills.length} skills`)

      return { registry: validated, offlineFallback: false }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      this.logger.error(`[SkillRegistry] Fetch failed: ${errorMessage}`, err)

      const cached = this.loadCache()
      if (cached) {
        this.logger.warn(`[SkillRegistry] Returning cached data due to error: ${errorMessage}`)
        return { registry: cached.data, offlineFallback: true }
      }

      throw new Error(`Failed to fetch registry: ${errorMessage}`)
    }
  }

  /**
   * Maps core SkillsRegistry to shared SkillRegistry format.
   */
  private mapCoreToShared(core: {
    version: string
    categories: Record<string, { name: string; description?: string }>
    skills: Array<{ name: string; description: string; category: string; path: string; files: string[]; contentHash?: string; author?: string; version?: string }>
  }): SkillRegistry {
    const categories: Record<string, { name: string; description: string }> = {}
    for (const [id, cat] of Object.entries(core.categories)) {
      categories[id] = { name: cat.name, description: cat.description ?? '' }
    }
    return {
      version: core.version,
      categories,
      skills: core.skills.map((s) => ({
        name: s.name,
        description: s.description,
        category: s.category,
        path: s.path,
        files: s.files,
        contentHash: s.contentHash ?? '',
        author: s.author,
        version: s.version,
      })),
    }
  }

  /**
   * Attempts a background refresh without blocking the caller.
   *
   * @returns A promise that resolves after refresh attempt completes.
   */
  private async refreshInBackground(): Promise<void> {
    try {
      const result = await this.fetchFromCdn()
      if (result.offlineFallback) {
        this.logger.warn('[SkillRegistry] Background refresh could not reach CDN; operating with cached data')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      this.logger.warn(`[SkillRegistry] Background refresh failed: ${errorMessage}`)
    }
  }

  /**
   * Load cache from globalState.
   *
   * @returns Cached registry entry, or `null` when unavailable.
   */
  private loadCache(): RegistryCacheEntry | null {
    const cached = this.context.globalState.get<RegistryCacheEntry>(SkillRegistryService.CACHE_KEY)
    return cached || null
  }

  /**
   * Save cache to globalState.
   *
   * @param entry - Cache payload to persist.
   * @returns Nothing.
   */
  private saveCache(entry: RegistryCacheEntry): void {
    this.context.globalState.update(SkillRegistryService.CACHE_KEY, entry).then(
      () => this.logger.debug('[SkillRegistry] Cache saved'),
      (saveErr: unknown) => {
        const errMsg = saveErr instanceof Error ? saveErr.message : 'Unknown error'
        this.logger.error(`[SkillRegistry] Failed to save cache: ${errMsg}`, saveErr)
      },
    )
  }

  /**
   * Cleanup (no-op for this service, but required by Disposable).
   *
   * @returns Nothing.
   */
  public dispose(): void {
    this.logger.debug('[SkillRegistry] Service disposed')
  }
}
