import { useEffect, useState } from 'react'

import { groupSkillsByCategory } from '../services/categories'
import { discoverSkillsAsync } from '../services/skills-provider'
import type { GroupedSkills, SkillInfo } from '../types'

export function useSkills() {
  const [skills, setSkills] = useState<SkillInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [groupedSkills, setGroupedSkills] = useState<GroupedSkills>(new Map())

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const data = await discoverSkillsAsync()

        if (mounted) {
          setSkills(data)
          setGroupedSkills(groupSkillsByCategory(data))
        }
      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  return { skills, loading, error, groupedSkills }
}
