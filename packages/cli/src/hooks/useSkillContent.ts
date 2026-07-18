import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { useEffect, useState } from 'react'
import {
  ensureSkillDownloaded,
  getSkillCachePath,
  getSkillMetadata,
  isSkillCached,
  type SkillMetadata,
} from '@tech-leads-club/core'

import { ports } from '../ports'

export interface SkillContent {
  metadata: SkillMetadata | null
  content: string | null
  loading: boolean
  error: string | null
}

export function useSkillContent(skillName: string | null): SkillContent {
  const [metadata, setMetadata] = useState<SkillMetadata | null>(null)
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!skillName) {
      setMetadata(null)
      setContent(null)
      setLoading(false)
      setError(null)
      return
    }

    let mounted = true
    setLoading(true)
    setError(null)

    const load = async () => {
      try {
        // Preview should not refresh stale cache — only download when missing.
        // Install/update own the freshness path via ensureSkillDownloaded.
        const cachePathPromise = isSkillCached(ports, skillName)
          ? Promise.resolve(getSkillCachePath(ports, skillName))
          : ensureSkillDownloaded(ports, skillName).catch(() => null)

        const [meta, cachePath] = await Promise.all([
          getSkillMetadata(ports, skillName).catch(() => null),
          cachePathPromise,
        ])

        if (!mounted) return
        if (meta) setMetadata(meta)

        const resolvedPath = cachePath ?? getSkillCachePath(ports, skillName)

        try {
          const skillMd = readFileSync(join(resolvedPath, 'SKILL.md'), 'utf-8')
          setContent(skillMd)
        } catch {
          setError('Failed to load skill content')
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [skillName])

  return { metadata, content, loading, error }
}
