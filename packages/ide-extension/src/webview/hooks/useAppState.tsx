import { useCallback, useMemo, useState } from 'react'
import type { ActionRequest, FlowAction, InstallMethod, ViewRoute, WebviewAction } from '../../shared/types'

/**
 * Target collection for bulk selection toggles.
 *
 * @internal
 */
type SelectionTarget = 'skills' | 'agents'

/**
 * Holds navigation state and user selections for the webview flow.
 *
 * @returns Current route/action/scope state and navigation/selection helpers.
 *
 * @example
 * ```tsx
 * const { currentView, goToAgents } = useAppState();
 * ```
 */
export function useAppState() {
  const [currentView, setCurrentView] = useState<ViewRoute>('home')
  const [currentAction, setCurrentAction] = useState<FlowAction | null>(null)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [activeScope, setActiveScope] = useState<ActionRequest['scope']>('local')
  const [installMethod, setInstallMethod] = useState<InstallMethod>('copy')

  const goToAgents = useCallback((action: WebviewAction) => {
    setCurrentAction(action)
    setCurrentView('selectAgents')
    setSelectedSkills([])
    setSelectedAgents([])
    if (action === 'uninstall') {
      setActiveScope('all')
    }
  }, [])

  const goToSkillsView = useCallback(() => {
    setCurrentView('selectSkills')
  }, [])

  const goToAgentsView = useCallback(() => {
    setCurrentView('selectAgents')
  }, [])

  const goToInstallConfig = useCallback(() => {
    setCurrentView('installConfig')
  }, [])

  const goToRemoveConfirm = useCallback(() => {
    setCurrentView('removeConfirm')
  }, [])

  const goToStatus = useCallback(() => {
    setCurrentView('status')
  }, [])

  const goToOutdatedSkills = useCallback(() => {
    setCurrentAction('update')
    setCurrentView('selectOutdatedSkills')
    setSelectedSkills([])
    setSelectedAgents([])
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

  const selectAllSkills = useCallback(
    (skills: string[]) => {
      selectAll('skills', skills)
    },
    [selectAll],
  )

  const clearSkillSelection = useCallback(() => {
    clearSelection('skills')
  }, [clearSelection])

  const selectAllAgents = useCallback(
    (agents: string[]) => {
      selectAll('agents', agents)
    },
    [selectAll],
  )

  const clearAgentSelection = useCallback(() => {
    clearSelection('agents')
  }, [clearSelection])

  return useMemo(
    () => ({
      currentView,
      currentAction,
      selectedSkills,
      selectedAgents,
      activeScope,
      installMethod,
      setScope: setActiveScope,
      setInstallMethod,
      goToAgents,
      goToAgentsView,
      goToSkillsView,
      goToInstallConfig,
      goToRemoveConfirm,
      goToStatus,
      goToOutdatedSkills,
      goHome,
      toggleSkill,
      toggleAgent,
      selectAll,
      clearSelection,
      selectAllSkills,
      clearSkillSelection,
      selectAllAgents,
      clearAgentSelection,
    }),
    [
      activeScope,
      clearSelection,
      currentAction,
      currentView,
      goHome,
      goToAgents,
      goToAgentsView,
      goToInstallConfig,
      goToRemoveConfirm,
      goToStatus,
      goToOutdatedSkills,
      goToSkillsView,
      installMethod,
      selectAll,
      selectAllAgents,
      selectAllSkills,
      selectedAgents,
      selectedSkills,
      toggleAgent,
      toggleSkill,
      clearAgentSelection,
      clearSkillSelection,
    ],
  )
}
