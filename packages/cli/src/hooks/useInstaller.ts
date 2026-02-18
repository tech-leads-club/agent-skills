import { useState } from 'react'

import { installSkills } from '../services/installer'
import { getSkillWithPath } from '../services/skills-provider'
import type { InstallOptions, InstallResult, SkillInfo } from '../types'

export function useInstaller() {
  const [progress, setProgress] = useState({ current: 0, total: 0, skill: '' })
  const [results, setResults] = useState<InstallResult[]>([])
  const [installing, setInstalling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const install = async (skills: SkillInfo[], options: InstallOptions) => {
    setInstalling(true)
    setError(null)
    setProgress({ current: 0, total: skills.length * options.agents.length, skill: 'Downloading...' })

    const resolvedSkills: SkillInfo[] = []
    for (const skill of skills) {
      const resolved = skill.path ? skill : await getSkillWithPath(skill.name)
      if (resolved) resolvedSkills.push(resolved)
    }

    setProgress({ current: 0, total: resolvedSkills.length * options.agents.length, skill: 'Installing...' })

    try {
      const res = await installSkills(resolvedSkills, options)
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
