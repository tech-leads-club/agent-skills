import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { useEffect, useState } from 'react'

import { ensureSkillDownloaded, getSkillCachePath, getSkillMetadata, type SkillMetadata } from '../services/registry'

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
        const [meta, cachePath] = await Promise.all([
          getSkillMetadata(skillName).catch(() => null),
          ensureSkillDownloaded(skillName).catch(() => null),
        ])

        if (!mounted) return
        if (meta) setMetadata(meta)

        const resolvedPath = cachePath ?? getSkillCachePath(skillName)

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
