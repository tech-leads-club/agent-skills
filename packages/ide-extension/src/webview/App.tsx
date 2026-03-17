import { useCallback, useEffect, useMemo, useState } from 'react'
import type { LifecycleScope } from '../shared/types'
import { ErrorState, LoadingState } from './components/AppStatusViews'
import { useAppState } from './hooks/useAppState'
import { useHostState, type LastBatchContext } from './hooks/useHostState'
import { useInstalledState } from './hooks/useInstalledState'
import { useOperations } from './hooks/useOperations'
import { postMessage } from './lib/vscode-api'
import { renderCurrentView } from './render-current-view'

function getFallbackScope(
  policy: ReturnType<typeof useHostState>['policy'],
  currentScope: LifecycleScope,
): LifecycleScope | null {
  if (!policy || policy.effectiveScopes.length === 0 || policy.effectiveScopes.includes(currentScope)) return null
  return policy.effectiveScopes[0]
}

export function App() {
  const [lastBatchContext, setLastBatchContext] = useState<LastBatchContext | null>(null)
  const appState = useAppState()
  const hostState = useHostState()
  const { installedSkills } = useInstalledState()
  const { operations, logTimeline, clearLogTimeline } = useOperations()

  const handleExecuteBatch = useCallback(
    (method?: 'copy' | 'symlink') => {
      const action =
        appState.currentAction === 'install' ? 'install' : appState.currentAction === 'update' ? 'update' : 'remove'
      const agents = action === 'update' ? [] : appState.selectedAgents
      if (
        (action !== 'update' && (appState.selectedSkills.length === 0 || agents.length === 0)) ||
        (action === 'update' && appState.selectedSkills.length === 0)
      )
        return

      const batchContext: LastBatchContext = {
        action,
        skills: appState.selectedSkills,
        agents,
        scope: appState.activeScope,
        method: action === 'install' ? (method ?? appState.installMethod) : undefined,
      }

      setLastBatchContext(batchContext)
      hostState.setBatchResult(null)
      clearLogTimeline()
      hostState.setIsBatchProcessing(true)
      appState.goToStatus()
      postMessage({ type: 'executeBatch', payload: batchContext })
    },
    [appState, clearLogTimeline, hostState],
  )

  const handleExecuteUpdate = useCallback(
    (skills: string[]) => {
      const batchContext: LastBatchContext = { action: 'update', skills, agents: [], scope: appState.activeScope }
      setLastBatchContext(batchContext)
      hostState.setBatchResult(null)
      clearLogTimeline()
      hostState.setIsBatchProcessing(true)
      appState.goToStatus()
      postMessage({ type: 'executeBatch', payload: batchContext })
    },
    [appState, clearLogTimeline, hostState],
  )

  const handleRetry = useCallback(() => {
    if (!lastBatchContext || !hostState.batchResult?.failedSkills?.length) return
    const retrySkills =
      lastBatchContext.action === 'update'
        ? hostState.batchResult.failedSkills
        : hostState.batchResult.failedSkills.filter((skill) => lastBatchContext.skills.includes(skill))
    if (retrySkills.length === 0) return

    hostState.setBatchResult(null)
    clearLogTimeline()
    hostState.setIsBatchProcessing(true)
    postMessage({ type: 'executeBatch', payload: { ...lastBatchContext, skills: retrySkills } })
  }, [clearLogTimeline, hostState, lastBatchContext])

  useEffect(() => {
    const fallbackScope = getFallbackScope(hostState.policy, appState.activeScope)
    if (fallbackScope) appState.setScope(fallbackScope)
  }, [appState, hostState.policy])

  const currentViewAnnouncement = useMemo(() => {
    if (appState.currentView === 'status')
      return hostState.isBatchProcessing ? 'Operation in progress' : 'Operation complete'
    if (appState.currentView === 'selectOutdatedSkills') return 'Update select skills page'
    if (appState.currentView === 'installConfig') return 'Install configuration page'
    if (appState.currentView === 'removeConfirm') return 'Remove confirmation page'
    if (appState.currentView === 'selectSkills')
      return `${appState.currentAction === 'install' ? 'Install' : 'Uninstall'} select skills page`
    if (appState.currentView === 'selectAgents')
      return `${appState.currentAction === 'install' ? 'Install' : 'Uninstall'} select agents page`
    return 'Home page'
  }, [appState.currentAction, appState.currentView, hostState.isBatchProcessing])

  if (hostState.status === 'loading')
    return (
      <div className="app">
        <LoadingState />
      </div>
    )
  if (hostState.status === 'error')
    return (
      <div className="app">
        <ErrorState message={hostState.errorMessage} />
      </div>
    )

  return (
    <div className="app">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {currentViewAnnouncement}
      </div>
      <header className="app-header">
        {hostState.fromCache && hostState.status === 'offline' && (
          <div className="offline-banner" role="status">
            Offline - showing cached data
          </div>
        )}
      </header>
      {renderCurrentView({
        currentView: appState.currentView,
        currentAction: appState.currentAction,
        registry: hostState.registry,
        installedSkills,
        availableAgents: hostState.availableAgents,
        allAgents: hostState.allAgents,
        policy: hostState.policy,
        isTrusted: hostState.isTrusted,
        isProcessing: hostState.isBatchProcessing || operations.size > 0,
        selectedSkills: appState.selectedSkills,
        selectedAgents: appState.selectedAgents,
        activeScope: appState.activeScope,
        installMethod: appState.installMethod,
        operations,
        logTimeline,
        batchResult: hostState.batchResult,
        goToAgents: appState.goToAgents,
        goToAgentsView: appState.goToAgentsView,
        goToSkillsView: appState.goToSkillsView,
        goToInstallConfig: appState.goToInstallConfig,
        goToRemoveConfirm: appState.goToRemoveConfirm,
        goToOutdatedSkills: appState.goToOutdatedSkills,
        goHome: appState.goHome,
        toggleSkill: appState.toggleSkill,
        toggleAgent: appState.toggleAgent,
        selectAllSkills: appState.selectAllSkills,
        clearSkillSelection: appState.clearSkillSelection,
        selectAllAgents: appState.selectAllAgents,
        clearAgentSelection: appState.clearAgentSelection,
        setScope: appState.setScope,
        setInstallMethod: appState.setInstallMethod,
        handleExecuteBatch,
        handleExecuteUpdate,
        handleRetry,
      })}
      {hostState.policy?.effectiveScopes.length === 0 && (
        <div className="footer-warning">Lifecycle actions are disabled: {hostState.policy.blockedReason}</div>
      )}
    </div>
  )
}
