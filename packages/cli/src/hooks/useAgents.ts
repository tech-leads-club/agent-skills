import type { AgentType } from '@tech-leads-club/core'
import { detectInstalledAgents, getAllAgentTypes } from '@tech-leads-club/core'
import { useEffect, useMemo, useState } from 'react'

import { ports } from '../ports'
import { loadConfig } from '../services/config'

export function useAgents() {
  const [selectedAgents, setSelectedAgents] = useState<AgentType[]>([])
  const [installedAgents, setInstalledAgents] = useState<AgentType[]>([])
  const [loading, setLoading] = useState(true)
  const allAgents = useMemo(() => getAllAgentTypes(), [])

  useEffect(() => {
    let cancelled = false

    const timer = setTimeout(async () => {
      const detected = detectInstalledAgents(ports)
      const config = await loadConfig()
      if (cancelled) return

      setInstalledAgents(detected)
      setSelectedAgents(config.targetAgents.length > 0 ? config.targetAgents : detected)
      setLoading(false)
    }, 800)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  const toggleAgent = (agent: AgentType) => {
    setSelectedAgents((prev) => (prev.includes(agent) ? prev.filter((a) => a !== agent) : [...prev, agent]))
  }

  return { allAgents, installedAgents, selectedAgents, setSelectedAgents, toggleAgent, loading }
}
