import { useState } from 'react'
import { ensureSkillDownloaded, fetchRegistry, forceDownloadSkill, installSkills } from '@tech-leads-club/core'
import type { InstallOptions, InstallResult, SkillInfo } from '@tech-leads-club/core'

import { ports } from '../ports'

export function useInstaller() {
  const [progress, setProgress] = useState({ current: 0, total: 0, skill: '' })
  const [results, setResults] = useState<InstallResult[]>([])
  const [installing, setInstalling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const install = async (skills: SkillInfo[], options: InstallOptions) => {
    setInstalling(true)
    setError(null)
    setProgress({ current: 0, total: skills.length * options.agents.length, skill: 'Downloading...' })

    // Bypass the 24h registry TTL so install/update see newly published content hashes.
    await fetchRegistry(ports, true)

    const resolvedSkills: SkillInfo[] = []
    for (const skill of skills) {
      // Never reuse skill.path from getRemoteSkills — it points at the local cache
      // whenever SKILL.md exists, even when the registry has a newer contentHash.
      // ensureSkillDownloaded refreshes stale cache; isUpdate always redownloads.
      const path = options.isUpdate
        ? await forceDownloadSkill(ports, skill.name)
        : await ensureSkillDownloaded(ports, skill.name)
      if (path) resolvedSkills.push({ ...skill, path })
    }

    setProgress({ current: 0, total: resolvedSkills.length * options.agents.length, skill: 'Installing...' })

    try {
      const res = await installSkills(ports, resolvedSkills, options)
      setResults(res)
      return res
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
      return []
    } finally {
      setInstalling(false)
    }
  }

  return { install, progress, results, installing, error }
}
