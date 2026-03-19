import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ActionRequest } from '../shared/types'
import { ErrorState, LoadingState } from './components/AppStatusViews'
import { useAppState } from './hooks/useAppState'
import { useHostState, type LastBatchContext } from './hooks/useHostState'
import { useInstalledState } from './hooks/useInstalledState'
import { postMessage } from './lib/vscode-api'
import { renderCurrentView } from './render-current-view'

function getFallbackScope(
  policy: ReturnType<typeof useHostState>['policy'],
  currentScope: ActionRequest['scope'],
): ActionRequest['scope'] | null {
  if (!policy || policy.effectiveScopes.length === 0) return null

  if (currentScope === 'all') {
    if (policy.effectiveScopes.length === 2) {
      return null
    }

    return policy.effectiveScopes[0]
  }

  if (policy.effectiveScopes.includes(currentScope)) return null
  return policy.effectiveScopes[0]
}

export function App() {
  const [lastBatchContext, setLastBatchContext] = useState<LastBatchContext | null>(null)
  const appState = useAppState()
  const hostState = useHostState()
  const { installedSkills } = useInstalledState()

  const handleRunAction = useCallback(
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
      appState.goToStatus()
      postMessage({ type: 'requestRunAction', payload: batchContext })
    },
    [appState],
  )

  const handleExecuteUpdate = useCallback(
    (skills: string[]) => {
      const batchContext: LastBatchContext = { action: 'update', skills, agents: [], scope: appState.activeScope }
      setLastBatchContext(batchContext)
      appState.goToStatus()
      postMessage({ type: 'requestRunAction', payload: batchContext })
    },
    [appState],
  )

  const handleUpdateFromHome = useCallback(() => {
    hostState.startRefreshForUpdate()
    appState.goToOutdatedSkills()
    postMessage({ type: 'requestRefreshForUpdate' })
  }, [appState, hostState.startRefreshForUpdate])

  const handleRetry = useCallback(() => {
    if (!lastBatchContext || !hostState.batchResult?.failedSkills?.length) return
    const retrySkills =
      lastBatchContext.action === 'update'
        ? hostState.batchResult.failedSkills
        : hostState.batchResult.failedSkills.filter((skill) => lastBatchContext.skills.includes(skill))
    if (retrySkills.length === 0) return

    postMessage({ type: 'requestRunAction', payload: { ...lastBatchContext, skills: retrySkills } })
  }, [hostState.batchResult, lastBatchContext])

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
        isProcessing: hostState.isBatchProcessing,
        isRefreshingForUpdate: hostState.isRefreshingForUpdate,
        selectedSkills: appState.selectedSkills,
        selectedAgents: appState.selectedAgents,
        activeScope: appState.activeScope,
        installMethod: appState.installMethod,
        currentStep: hostState.actionState.currentStep,
        logTimeline: hostState.actionState.logs,
        batchResult: hostState.batchResult,
        rejectionMessage: hostState.actionState.rejectionMessage,
        goToAgents: appState.goToAgents,
        goToAgentsView: appState.goToAgentsView,
        goToSkillsView: appState.goToSkillsView,
        goToInstallConfig: appState.goToInstallConfig,
        goToRemoveConfirm: appState.goToRemoveConfirm,
        goToOutdatedSkills: handleUpdateFromHome,
        goHome: appState.goHome,
        toggleSkill: appState.toggleSkill,
        toggleAgent: appState.toggleAgent,
        selectAllSkills: appState.selectAllSkills,
        clearSkillSelection: appState.clearSkillSelection,
        selectAllAgents: appState.selectAllAgents,
        clearAgentSelection: appState.clearAgentSelection,
        setScope: appState.setScope,
        setInstallMethod: appState.setInstallMethod,
        handleExecuteBatch: handleRunAction,
        handleExecuteUpdate,
        handleRetry,
      })}
      {hostState.policy?.effectiveScopes.length === 0 && (
        <div className="footer-warning">Lifecycle actions are disabled: {hostState.policy.blockedReason}</div>
      )}
    </div>
  )
}
