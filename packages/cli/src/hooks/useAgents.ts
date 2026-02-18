import { useEffect, useMemo, useState } from 'react'

import { detectInstalledAgents, getAllAgentTypes } from '../services/agents'
import type { AgentType } from '../types'

export function useAgents() {
  const [selectedAgents, setSelectedAgents] = useState<AgentType[]>([])
  const [installedAgents, setInstalledAgents] = useState<AgentType[]>([])
  const [loading, setLoading] = useState(true)
  const allAgents = useMemo(() => getAllAgentTypes(), [])

  useEffect(() => {
    const timer = setTimeout(() => {
      const detected = detectInstalledAgents()
      setInstalledAgents(detected)
      setSelectedAgents(detected)
      setLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  const toggleAgent = (agent: AgentType) => {
    setSelectedAgents((prev) => (prev.includes(agent) ? prev.filter((a) => a !== agent) : [...prev, agent]))
  }

  return { allAgents, installedAgents, selectedAgents, setSelectedAgents, toggleAgent, loading }
}
