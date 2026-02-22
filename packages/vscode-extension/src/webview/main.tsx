import { StrictMode, useCallback, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { ExtensionMessage, ScopePolicyStatePayload } from '../shared/messages'
import type { AvailableAgent, SkillRegistry } from '../shared/types'
import { useAppState } from './hooks/useAppState'
import { useInstalledState } from './hooks/useInstalledState'
import { useOperations } from './hooks/useOperations'
import './index.css'
import { onMessage, postMessage } from './lib/vscode-api'
import { HomePage } from './views/HomePage'
import { SelectAgentsPage } from './views/SelectAgentsPage'
import { SelectSkillsPage } from './views/SelectSkillsPage'

type AppStatus = 'loading' | 'ready' | 'error' | 'offline'

/**
 * Renders the loading state shown while registry data is being fetched.
 *
 * @returns Loading UI for the skills view.
 */
function LoadingState() {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <p>Loading skills...</p>
    </div>
  )
}

/**
 * Renders an error state with a retry action.
 *
 * @param props - Error message and retry callback.
 * @returns Error UI for failed registry loading.
 */
function ErrorState({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div className="error-state">
      <p className="error-message">{message || 'Failed to load skill registry'}</p>
      <button className="retry-button" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}

/**
 * Renders the empty state shown when no registry payload is available.
 *
 * @returns Empty-state UI for missing registry data.
 */
function NoRegistryState() {
  return (
    <div className="empty-state">
      <p>No skills available in the registry</p>
    </div>
  )
}

/**
 * Root webview application component.
 *
 * @returns Sidebar app UI with state-driven content.
 */
function App() {
  const [registry, setRegistry] = useState<SkillRegistry | null>(null)
  const [status, setStatus] = useState<AppStatus>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)
  const [availableAgents, setAvailableAgents] = useState<AvailableAgent[]>([])
  const [hasWorkspace, setHasWorkspace] = useState(false)
  const [isTrusted, setIsTrusted] = useState(true)
  const [policy, setPolicy] = useState<ScopePolicyStatePayload | null>(null)
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)
  const [processingAction, setProcessingAction] = useState<'update' | 'repair' | null>(null)

  const {
    currentView,
    currentAction,
    selectedSkills,
    selectedAgents,
    activeScope,
    setScope,
    goToSkills,
    goToSkillsView,
    goToAgents,
    goHome,
    toggleSkill,
    toggleAgent,
    selectAllSkills,
    clearSkillSelection,
    selectAllAgents,
    clearAgentSelection,
  } = useAppState()
  const { installedSkills } = useInstalledState()
  const { operations } = useOperations()

  const handleRefresh = useCallback(() => {
    postMessage({ type: 'requestRefresh' })
  }, [goHome])

  const handleExecuteBatch = useCallback(() => {
    if (!currentAction || selectedSkills.length === 0 || selectedAgents.length === 0) return

    setIsBatchProcessing(true)
    postMessage({
      type: 'executeBatch',
      payload: {
        action: currentAction === 'install' ? 'install' : 'remove',
        skills: selectedSkills,
        agents: selectedAgents,
        scope: activeScope,
      },
    })
  }, [activeScope, currentAction, selectedAgents, selectedSkills])

  const handleUpdate = useCallback(() => {
    setProcessingAction('update')
  }, [])

  const handleRepair = useCallback(() => {
    setProcessingAction('repair')
  }, [])

  useEffect(() => {
    const dispose = onMessage((msg: ExtensionMessage) => {
      switch (msg.type) {
        case 'initialize':
          setAvailableAgents(msg.payload.availableAgents)
          setHasWorkspace(msg.payload.hasWorkspace)
          break
        case 'registryUpdate':
          setStatus(msg.payload.status as AppStatus)
          setRegistry(msg.payload.registry)
          setErrorMessage(msg.payload.errorMessage || null)
          setFromCache(msg.payload.fromCache || false)
          break
        case 'trustState':
          setIsTrusted(msg.payload.isTrusted)
          break
        case 'policyState':
          setPolicy(msg.payload)
          break
        case 'batchCompleted':
          setIsBatchProcessing(false)
          if (msg.payload.success) {
            goHome()
          }
          break
      }
    })

    postMessage({ type: 'webviewDidMount' })
    return dispose
  }, [])

  const statusContent = useMemo(() => {
    if (status === 'loading') {
      return <LoadingState />
    }
    if (status === 'error') {
      return <ErrorState message={errorMessage} onRetry={handleRefresh} />
    }
    return null
  }, [status, errorMessage, handleRefresh])

  const offlineBanner =
    fromCache && status === 'offline' ? (
      <div className="offline-banner" role="status">
        Offline — showing cached data
      </div>
    ) : null

  const isLifecycleBlocked = policy?.effectiveScopes.length === 0
  const isProcessing = isBatchProcessing || operations.size > 0 || processingAction !== null
  const actionLabel = currentAction === 'install' ? 'Install' : 'Uninstall'
  let currentViewAnnouncement = 'Home page'

  if (currentView === 'selectSkills') {
    currentViewAnnouncement = `${actionLabel} select skills page`
  } else if (currentView === 'selectAgents') {
    currentViewAnnouncement = `${actionLabel} select agents page`
  }

  useEffect(() => {
    if (!processingAction) return

    const timeout = window.setTimeout(() => {
      setProcessingAction(null)
    }, 1200)

    return () => window.clearTimeout(timeout)
  }, [processingAction])

  if (statusContent) {
    return <div className="app">{statusContent}</div>
  }

  const renderCurrentView = () => {
    if (currentView !== 'home' && !registry) {
      return <NoRegistryState />
    }

    if (currentView === 'home') {
      return (
        <HomePage
          registry={registry}
          installedSkills={installedSkills}
          policy={policy}
          isTrusted={isTrusted}
          hasWorkspace={hasWorkspace}
          scope={activeScope}
          isProcessing={isProcessing}
          processingAction={processingAction}
          onNavigate={goToSkills}
          onScopeChange={setScope}
          onUpdate={handleUpdate}
          onRepair={handleRepair}
        />
      )
    }

    if (!currentAction || !registry) {
      return <NoRegistryState />
    }

    if (currentView === 'selectSkills') {
      return (
        <SelectSkillsPage
          action={currentAction}
          registry={registry}
          installedSkills={installedSkills}
          scope={activeScope}
          selectedSkills={selectedSkills}
          onToggleSkill={toggleSkill}
          onSelectAll={selectAllSkills}
          onClear={clearSkillSelection}
          onBack={goHome}
          onNext={goToAgents}
        />
      )
    }

    return (
      <SelectAgentsPage
        action={currentAction}
        availableAgents={availableAgents}
        installedSkills={installedSkills}
        selectedSkills={selectedSkills}
        selectedAgents={selectedAgents}
        scope={activeScope}
        isProcessing={isBatchProcessing}
        onToggleAgent={toggleAgent}
        onSelectAll={selectAllAgents}
        onClear={clearAgentSelection}
        onBack={goToSkillsView}
        onProceed={handleExecuteBatch}
      />
    )
  }

  return (
    <div className="app">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {currentViewAnnouncement}
      </div>
      <header className="app-header">{offlineBanner}</header>
      {renderCurrentView()}
      {isLifecycleBlocked && (
        <div
          className="footer-warning"
          style={{
            backgroundColor: 'var(--vscode-inputValidation-warningBackground)',
            color: 'var(--vscode-inputValidation-warningForeground)',
            padding: '8px',
            borderTop: '1px solid var(--vscode-inputValidation-warningBorder)',
            fontSize: '12px',
          }}
        >
          Lifecycle actions are disabled: {policy?.blockedReason}
        </div>
      )}
    </div>
  )
}

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
