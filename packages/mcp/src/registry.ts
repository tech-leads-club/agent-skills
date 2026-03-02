import Fuse from 'fuse.js'
import ky from 'ky'
import { z } from 'zod'

import { CACHE_TTL_MS, REGISTRY_URL } from './constants'
import type { Indexes, IndexSkill, Registry, RegistryCache, SkillEntry } from './types'

import { extractTriggers } from './utils'

const SkillEntrySchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.string(),
  path: z.string(),
  files: z.array(z.string()),
  author: z.string().optional(),
  version: z.string().optional(),
  contentHash: z.string(),
})

const RegistrySchema = z.object({
  version: z.string(),
  categories: z.record(z.string(), z.object({ name: z.string(), description: z.string() })),
  skills: z.array(SkillEntrySchema),
  deprecated: z.array(z.object({ name: z.string(), message: z.string(), alternatives: z.array(z.string()) })).optional(),
})

let cache: RegistryCache | null = null

export async function getRegistry(): Promise<Registry> {
  const now = Date.now()

  if (cache !== null && now - cache.fetchedAt < CACHE_TTL_MS) {
    process.stderr.write('[registry] cache hit (within TTL)\n')
    return cache.data
  }

  if (cache !== null) {
    process.stderr.write('[registry] cache TTL expired, attempting conditional fetch\n')
    try {
      const headers: Record<string, string> = {}
      if (cache.etag !== undefined) headers['If-None-Match'] = cache.etag

      const response = await ky.get(REGISTRY_URL, { headers, throwHttpErrors: false })

      if (response.status === 304) {
        process.stderr.write('[registry] 304 Not Modified — refreshing fetchedAt\n')
        cache = { ...cache, fetchedAt: now }
        return cache.data
      }

      if (response.status === 200) {
        const etag = response.headers.get('etag') ?? undefined
        const raw = RegistrySchema.parse(await response.json())
        const data: Registry = { ...raw, deprecated: raw.deprecated ?? [] }
        process.stderr.write('[registry] 200 — updated cache with new data\n')
        cache = { data, etag, fetchedAt: now }
        return cache.data
      }

      process.stderr.write(`[registry] unexpected status ${response.status} — returning stale cache\n`)
      cache = { ...cache, fetchedAt: now }
      return cache.data
    } catch (err) {
      process.stderr.write(`[registry] CDN failure (stale cache available): ${String(err)}\n`)
      return cache.data
    }
  }

  process.stderr.write('[registry] cold start fetch\n')
  const response = await ky.get(REGISTRY_URL, { retry: { limit: 3 }, throwHttpErrors: false })
  if (response.status !== 200) throw new Error(`[registry] cold start fetch failed with status ${response.status}`)
  const etag = response.headers.get('etag') ?? undefined
  const raw = RegistrySchema.parse(await response.json())
  const data: Registry = { ...raw, deprecated: raw.deprecated ?? [] }
  cache = { data, etag, fetchedAt: now }
  process.stderr.write('[registry] cold start fetch complete\n')
  return cache.data
}

export function buildIndexes(registry: Registry): Indexes {
  const slimSkills: IndexSkill[] = registry.skills.map((skill) => {
    const desc = skill.description

    let usageHint: string
    const useWhenIdx = desc.indexOf('Use when')

    if (useWhenIdx > 0) {
      usageHint = desc.slice(0, useWhenIdx).trim()
    } else {
      const dotIdx = desc.indexOf('.')
      usageHint = dotIdx >= 0 ? desc.slice(0, dotIdx).trim() : desc.trim()
    }

    return {
      name: skill.name,
      description: desc,
      usage_hint: usageHint,
      category: skill.category,
      triggers: extractTriggers(desc),
    }
  })

  const fuse = new Fuse(slimSkills, {
    keys: [
      { name: 'name', weight: 0.45 },
      { name: 'triggers', weight: 0.3 },
      { name: 'description', weight: 0.2 },
      { name: 'category', weight: 0.05 },
    ],
    threshold: 0.4,
    includeScore: true,
    useExtendedSearch: true,
    minMatchCharLength: 2,
  })

  const map = new Map<string, SkillEntry>(registry.skills.map((s) => [s.name, s]))
  return { fuse, map }
}
