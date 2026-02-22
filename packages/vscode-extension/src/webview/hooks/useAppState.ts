import { useCallback, useMemo, useState } from 'react'
import type { LifecycleScope, ViewRoute, WebviewAction } from '../../shared/types'

type SelectionTarget = 'skills' | 'agents'

/**
 * Holds navigation state and user selections for the webview flow.
 *
 * @returns Current route/action/scope state and navigation/selection helpers.
 */
export function useAppState() {
  const [currentView, setCurrentView] = useState<ViewRoute>('home')
  const [currentAction, setCurrentAction] = useState<WebviewAction | null>(null)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [activeScope, setActiveScope] = useState<LifecycleScope>('local')

  const goToSkills = useCallback((action: WebviewAction) => {
    setCurrentAction(action)
    setCurrentView('selectSkills')
    setSelectedSkills([])
    setSelectedAgents([])
  }, [])

  const goToAgents = useCallback(() => {
    setCurrentView('selectAgents')
  }, [])

  const goHome = useCallback(() => {
    setCurrentView('home')
    setCurrentAction(null)
    setSelectedSkills([])
    setSelectedAgents([])
  }, [])

  const toggleSkill = useCallback((skillName: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillName) ? prev.filter((name) => name !== skillName) : [...prev, skillName],
    )
  }, [])

  const toggleAgent = useCallback((agentId: string) => {
    setSelectedAgents((prev) => (prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]))
  }, [])

  const selectAll = useCallback((target: SelectionTarget, values: string[]) => {
    const nextValues = [...new Set(values)]
    if (target === 'skills') {
      setSelectedSkills(nextValues)
      return
    }
    setSelectedAgents(nextValues)
  }, [])

  const clearSelection = useCallback((target: SelectionTarget) => {
    if (target === 'skills') {
      setSelectedSkills([])
      return
    }
    setSelectedAgents([])
  }, [])

  return useMemo(
    () => ({
      currentView,
      currentAction,
      selectedSkills,
      selectedAgents,
      activeScope,
      setScope: setActiveScope,
      goToSkills,
      goToAgents,
      goHome,
      toggleSkill,
      toggleAgent,
      selectAll,
      clearSelection,
    }),
    [
      activeScope,
      clearSelection,
      currentAction,
      currentView,
      goHome,
      goToAgents,
      goToSkills,
      selectAll,
      selectedAgents,
      selectedSkills,
      toggleAgent,
      toggleSkill,
    ],
  )
}
