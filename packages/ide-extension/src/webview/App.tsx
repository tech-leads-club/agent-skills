import { Suspense, useEffect, useMemo } from 'react'
import { ErrorState, LoadingState } from './components/AppStatusViews'
import { ErrorBoundary } from './components/error-boundary'
import { ActionsProvider, AppStateProvider, HostStateProvider, useAppStateContext, useHostStateContext } from './contexts'
import { CurrentView } from './render-current-view'

function getFallbackScope(
  policy: ReturnType<typeof useHostStateContext>['policy'],
  currentScope: ReturnType<typeof useAppStateContext>['activeScope'],
): ReturnType<typeof useAppStateContext>['activeScope'] | null {
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

function AppContent() {
  const appState = useAppStateContext()
  const hostState = useHostStateContext()

  useEffect(() => {
    const fallbackScope = getFallbackScope(hostState.policy, appState.activeScope)
    if (fallbackScope) appState.setScope(fallbackScope)
  }, [appState, hostState.policy])

  // Preload lazy view chunks after initial render so navigations are instant
  useEffect(() => {
    void import('./views/SelectAgentsPage')
    void import('./views/SelectSkillsPage')
    void import('./views/SelectOutdatedSkillsPage')
    void import('./views/StatusPage')
    void import('./views/InstallConfigPage')
    void import('./views/RemoveConfirmPage')
  }, [])

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
    <ErrorBoundary>
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
        <Suspense fallback={null}>
          <CurrentView />
        </Suspense>
        {hostState.policy?.effectiveScopes.length === 0 && (
          <div className="footer-warning">Lifecycle actions are disabled: {hostState.policy.blockedReason}</div>
        )}
      </div>
    </ErrorBoundary>
  )
}

export function App() {
  return (
    <HostStateProvider>
      <AppStateProvider>
        <ActionsProvider>
          <AppContent />
        </ActionsProvider>
      </AppStateProvider>
    </HostStateProvider>
  )
}
