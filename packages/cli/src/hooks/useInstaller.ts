import { useState } from 'react'

import { installSkills } from '../services/installer'
import type { InstallOptions, InstallResult, SkillInfo } from '../types'

export function useInstaller() {
  const [progress, setProgress] = useState({ current: 0, total: 0, skill: '' })
  const [results, setResults] = useState<InstallResult[]>([])
  const [installing, setInstalling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const install = async (skills: SkillInfo[], options: InstallOptions) => {
    setInstalling(true)
    setProgress({ current: 0, total: skills.length * options.agents.length, skill: 'Initializing...' })
    setError(null)

    try {
      const res = await installSkills(skills, options)
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
