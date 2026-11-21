import Fuse from 'fuse.js'
import ky from 'ky'
import { z } from 'zod'

import { buildRegistryUrl, resolveCdnRef } from './cdn'
import type { Indexes, IndexSkill, Registry, SkillEntry } from './types'

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
  deprecated: z
    .array(z.object({ name: z.string(), message: z.string(), alternatives: z.array(z.string()) }))
    .optional(),
})

export type RegistrySnapshot = { data: Registry; version: string; etag?: string }

async function parseRegistry(response: Response, version: string): Promise<RegistrySnapshot> {
  const etag = response.headers.get('etag') ?? undefined
  const raw = RegistrySchema.parse(await response.json())
  return { data: { ...raw, deprecated: raw.deprecated ?? [] }, version, etag }
}

/**
 * Fetches the registry of the current catalog version. When that version is the previous
 * snapshot's, it revalidates by ETag, and a `304 Not Modified` returns that same snapshot object.
 */
export async function fetchRegistry(
  previous: RegistrySnapshot | null,
  signal?: AbortSignal,
): Promise<RegistrySnapshot> {
  const version = await resolveCdnRef(signal)
  const registryUrl = buildRegistryUrl(version)

  if (previous && previous.version === version) {
    const headers: Record<string, string> = previous.etag ? { 'If-None-Match': previous.etag } : {}
    const response = await ky.get(registryUrl, { headers, throwHttpErrors: false, signal })
    if (response.status === 304) {
      process.stderr.write(`[registry] ${version} not modified\n`)
      return previous
    }
    if (response.status !== 200) throw new Error(`[registry] refresh failed with status ${response.status}`)
    process.stderr.write(`[registry] ${version} updated\n`)
    return parseRegistry(response, version)
  }

  process.stderr.write(`[registry] fetching catalog ${version}\n`)
  const response = await ky.get(registryUrl, { retry: { limit: 3 }, throwHttpErrors: false, signal })
  if (response.status !== 200) throw new Error(`[registry] fetch of ${version} failed with status ${response.status}`)
  return parseRegistry(response, version)
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
    // why: useExtendedSearch turns every whitespace-separated token into a mandatory
    // AND clause, so natural intent phrases ("react component testing") matched nothing.
    // Token search + ignoreLocation scores each word independently, anywhere in the field.
    threshold: 0.3,
    includeScore: true,
    useTokenSearch: true,
    ignoreLocation: true,
    minMatchCharLength: 2,
  })

  const map = new Map<string, SkillEntry>(registry.skills.map((s) => [s.name, s]))
  return { fuse, map }
}
