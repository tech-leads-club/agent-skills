import { useState } from 'react'

import { removeSkill } from '../services/installer'
import type { AgentType } from '../types'

export interface RemoveResult {
  skill: string
  agent: string
  success: boolean
  error?: string
}

export function useRemover() {
  const [progress, setProgress] = useState({ current: 0, total: 0, skill: '' })
  const [results, setResults] = useState<RemoveResult[]>([])
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = async (skillName: string, agents: AgentType[], global = false) => {
    setRemoving(true)
    setProgress({ current: 0, total: agents.length, skill: skillName })
    setError(null)

    try {
      const res = await removeSkill(skillName, agents, { global })
      setResults((prev) => [...prev, ...res])
      return res
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
      return []
    } finally {
      setRemoving(false)
    }
  }

  const removeMultiple = async (skillsToRemove: { name: string; agents: AgentType[] }[]) => {
    setRemoving(true)
    const totalOps = skillsToRemove.reduce((acc, item) => acc + item.agents.length, 0)
    setProgress({ current: 0, total: totalOps, skill: 'Initializing...' })
    setResults([])
    setError(null)

    try {
      let completedOps = 0
      for (const item of skillsToRemove) {
        setProgress({ current: completedOps, total: totalOps, skill: item.name })
        const res = await removeSkill(item.name, item.agents, {})
        setResults((prev) => [...prev, ...res])
        completedOps += item.agents.length
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setRemoving(false)
    }
  }

  return { remove, removeMultiple, progress, results, removing, error }
}
