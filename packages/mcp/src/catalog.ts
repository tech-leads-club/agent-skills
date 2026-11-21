import type { FuseResult } from 'fuse.js'
import ky from 'ky'

import { buildSkillsBaseUrl } from './cdn'
import { CACHE_TTL_MS } from './constants'
import { fetchAndVerifySkillFiles } from './integrity'
import { type RegistrySnapshot, buildIndexes, fetchRegistry } from './registry'
import type { Indexes, IndexSkill, Registry, SkillEntry } from './types'

export const CATALOG_LOAD_TIMEOUT_MS = 10_000

export class CatalogUnavailableError extends Error {
  constructor() {
    super('Skill catalog unavailable. Try again shortly.')
    this.name = 'CatalogUnavailableError'
  }
}

export interface Catalog {
  warm(): void
  close(): void
  list(): Promise<SkillEntry[]>
  get(name: string): Promise<SkillEntry | undefined>
  search(query: string, limit: number): Promise<Array<FuseResult<IndexSkill>>>
  registry(): Promise<Registry>
  read(skill: SkillEntry): Promise<Map<string, Uint8Array>>
}

export interface CatalogDeps {
  loadRegistry: (signal: AbortSignal, previous: RegistrySnapshot | null) => Promise<RegistrySnapshot>
  skillsBaseUrl: (version: string) => string
  fetchBytes: (url: string) => Promise<Uint8Array>
  verifyFiles: typeof fetchAndVerifySkillFiles
  timeoutMs: number
  ttlMs: number
  now: () => number
}

type Snapshot = { source: RegistrySnapshot; indexes: Indexes; loadedAt: number }

const defaultDeps: CatalogDeps = {
  loadRegistry: (signal, previous) => fetchRegistry(previous, signal),
  skillsBaseUrl: buildSkillsBaseUrl,
  fetchBytes: async (url) => new Uint8Array(await ky.get(url).arrayBuffer()),
  verifyFiles: fetchAndVerifySkillFiles,
  timeoutMs: CATALOG_LOAD_TIMEOUT_MS,
  ttlMs: CACHE_TTL_MS,
  now: () => Date.now(),
}

export function createCatalog(overrides: Partial<CatalogDeps> = {}): Catalog {
  const deps: CatalogDeps = { ...defaultDeps, ...overrides }
  const lifetime = new AbortController()
  let snapshot: Snapshot | null = null
  let loading: Promise<Snapshot> | null = null
  const versionOf = new WeakMap<SkillEntry, string>()

  function load(): Promise<Snapshot> {
    if (loading) return loading
    const signal = AbortSignal.any([lifetime.signal, AbortSignal.timeout(deps.timeoutMs)])
    const attempt = untilAborted(deps.loadRegistry(signal, snapshot?.source ?? null), signal).then((source) => {
      const unchanged = source === snapshot?.source
      const indexes = unchanged && snapshot ? snapshot.indexes : buildIndexes(source.data)
      if (!unchanged) for (const skill of source.data.skills) versionOf.set(skill, source.version)
      snapshot = { source, indexes, loadedAt: deps.now() }
      return snapshot
    })
    loading = attempt
    attempt.then(
      () => {
        loading = null
      },
      (error: unknown) => {
        loading = null
        process.stderr.write(`[catalog] load failed: ${String(error)}\n`)
      },
    )
    return attempt
  }

  async function current(): Promise<Snapshot> {
    if (snapshot) {
      if (deps.now() - snapshot.loadedAt >= deps.ttlMs) load().catch(() => undefined)
      return snapshot
    }
    try {
      return await load()
    } catch {
      throw new CatalogUnavailableError()
    }
  }

  return {
    warm: () => {
      load().catch(() => undefined)
    },
    close: () => lifetime.abort(),
    list: async () => [...(await current()).indexes.map.values()],
    get: async (name) => (await current()).indexes.map.get(name),
    search: async (query, limit) => (await current()).indexes.fuse.search(query).slice(0, limit),
    registry: async () => (await current()).source.data,
    read: async (skill) => {
      const version = versionOf.get(skill) ?? (await current()).source.version
      return deps.verifyFiles(skill, deps.skillsBaseUrl(version), deps.fetchBytes)
    },
  }
}

function untilAborted<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason)
    work.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort))
    if (signal.aborted) return onAbort()
    signal.addEventListener('abort', onAbort, { once: true })
  })
}
