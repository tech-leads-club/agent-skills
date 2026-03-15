import '@vscode/codicons/dist/codicon.css'
import { StrictMode, useCallback, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { ExtensionMessage, ScopePolicyStatePayload } from '../shared/messages'
import type { AvailableAgent, LifecycleScope, SkillRegistry } from '../shared/types'
import { useAppState } from './hooks/useAppState'
import { useInstalledState } from './hooks/useInstalledState'
import { useOperations } from './hooks/useOperations'
import './index.css'
import { onMessage, postMessage } from './lib/vscode-api'
import { HomePage } from './views/HomePage'
import { InstallConfigPage } from './views/InstallConfigPage'
import { RemoveConfirmPage } from './views/RemoveConfirmPage'
import { SelectAgentsPage } from './views/SelectAgentsPage'
import { SelectOutdatedSkillsPage } from './views/SelectOutdatedSkillsPage'
import { SelectSkillsPage } from './views/SelectSkillsPage'
import { StatusPage } from './views/StatusPage'

/**
 * Application connection status.
 *
 * @internal
 */
type AppStatus = 'loading' | 'ready' | 'error' | 'offline'

/**
 * Renders the loading state shown while registry data is being fetched.
 *
 * @returns Loading UI for the skills view.
 *
 * @internal
 *
 * @example
 * ```tsx
 * if (status === 'loading') {
 *   return <LoadingState />;
 * }
 * ```
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
 * Renders an error state (no manual retry; host handles refresh).
 *
 * @param props - Error message.
 * @returns Error UI for failed registry loading.
 *
 * @internal
 */
function ErrorState({ message }: { message: string | null }) {
  return (
    <div className="error-state">
      <p className="error-message">{message || 'Failed to load skill registry'}</p>
    </div>
  )
}

/**
 * Renders the empty state shown when no registry payload is available.
 *
 * @returns Empty-state UI for missing registry data.
 *
 * @internal
 */
function NoRegistryState() {
  return (
    <div className="empty-state">
      <p>No skills available in the registry</p>
    </div>
  )
}

/**
 * Calculates a fallback scope if the currently selected one becomes disallowed.
 *
 * @param policy - The validated scope constraints.
 * @param currentScope - The currently chosen scope.
 * @returns The new best-effort scope, or null if ok.
 *
 * @example
 * ```typescript
 * const newScope = getFallbackScope(policy, 'local');
 * if (newScope) setScope(newScope);
 * ```
 */
function getFallbackScope(policy: ScopePolicyStatePayload | null, currentScope: LifecycleScope): LifecycleScope | null {
  if (!policy || policy.effectiveScopes.length === 0) {
    return null
  }

  if (policy.effectiveScopes.includes(currentScope)) {
    return null
  }

  return policy.effectiveScopes[0]
}

/**
 * Root webview application component.
 *
 * @returns Sidebar app UI with state-driven content.
 *
 * @internal
 *
 * @example
 * ```tsx
 * const root = createRoot(document.getElementById('root')!);
 * root.render(<App />);
 * ```
 */
function App() {
  const [registry, setRegistry] = useState<SkillRegistry | null>(null)
  const [status, setStatus] = useState<AppStatus>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)
  const [availableAgents, setAvailableAgents] = useState<AvailableAgent[]>([])
  const [allAgents, setAllAgents] = useState<AvailableAgent[]>([])
  const [isTrusted, setIsTrusted] = useState(true)
  const [policy, setPolicy] = useState<ScopePolicyStatePayload | null>(null)
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)
  const [batchResult, setBatchResult] = useState<{
    success: boolean
    failedSkills?: string[]
    errorMessage?: string
    results?: Array<{ skillName: string; success: boolean; errorMessage?: string }>
    action?: 'install' | 'remove' | 'update'
  } | null>(null)
  const [lastBatchContext, setLastBatchContext] = useState<{
    action: 'install' | 'remove' | 'update'
    skills: string[]
    agents: string[]
    scope: LifecycleScope
    method?: 'copy' | 'symlink'
  } | null>(null)

  const {
    currentView,
    currentAction,
    selectedSkills,
    selectedAgents,
    activeScope,
    installMethod,
    setScope,
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
    selectAllSkills,
    clearSkillSelection,
    selectAllAgents,
    clearAgentSelection,
  } = useAppState()
  const { installedSkills } = useInstalledState()
  const { operations } = useOperations()

  const handleExecuteBatch = useCallback(
    (method?: 'copy' | 'symlink') => {
      const action = currentAction === 'install' ? 'install' : currentAction === 'update' ? 'update' : 'remove'
      const skills = action === 'update' ? selectedSkills : selectedSkills
      const agents = action === 'update' ? [] : selectedAgents

      if (action !== 'update' && (skills.length === 0 || agents.length === 0)) return
      if (action === 'update' && skills.length === 0) return

      const ctx = {
        action,
        skills,
        agents,
        scope: activeScope,
        method: action === 'install' ? (method ?? installMethod) : undefined,
      }
      setLastBatchContext(ctx)
      setBatchResult(null)
      setIsBatchProcessing(true)
      goToStatus()
      postMessage({
        type: 'executeBatch',
        payload: {
          action,
          skills,
          agents,
          scope: activeScope,
          method: ctx.method,
        },
      })
    },
    [activeScope, currentAction, installMethod, selectedAgents, selectedSkills, goToStatus],
  )

  const handleExecuteUpdate = useCallback(
    (skills: string[]) => {
      const toUpdate = skills.length > 0 ? skills : []
      setLastBatchContext({ action: 'update', skills: toUpdate, agents: [], scope: activeScope })
      setBatchResult(null)
      setIsBatchProcessing(true)
      goToStatus()
      postMessage({
        type: 'executeBatch',
        payload: {
          action: 'update',
          skills: toUpdate,
          agents: [],
          scope: activeScope,
        },
      })
    },
    [activeScope, goToStatus],
  )

  const handleRetry = useCallback(() => {
    if (!lastBatchContext) return
    const { action, skills, agents, scope, method } = lastBatchContext
    const toRetry =
      action === 'update'
        ? (batchResult?.failedSkills ?? [])
        : (batchResult?.failedSkills ?? []).filter((s) => skills.includes(s))
    if (toRetry.length === 0) return

    setBatchResult(null)
    setIsBatchProcessing(true)
    postMessage({
      type: 'executeBatch',
      payload: {
        action,
        skills: toRetry,
        agents,
        scope,
        method,
      },
    })
  }, [batchResult?.failedSkills, lastBatchContext])

  useEffect(() => {
    const dispose = onMessage((msg: ExtensionMessage) => {
      switch (msg.type) {
        case 'initialize':
          setAvailableAgents(msg.payload.availableAgents)
          setAllAgents(msg.payload.allAgents)
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
          setBatchResult({
            success: msg.payload.success,
            failedSkills: msg.payload.failedSkills,
            errorMessage: msg.payload.errorMessage,
            results: msg.payload.results,
            action: msg.payload.action,
          })
          break
      }
    })

    postMessage({ type: 'webviewDidMount' })
    return dispose
  }, [])

  useEffect(() => {
    const fallbackScope = getFallbackScope(policy, activeScope)
    if (!fallbackScope) return

    setScope(fallbackScope)
  }, [activeScope, policy, setScope])

  const statusContent = useMemo(() => {
    if (status === 'loading') {
      return <LoadingState />
    }
    if (status === 'error') {
      return <ErrorState message={errorMessage} />
    }
    return null
  }, [status, errorMessage])

  const offlineBanner =
    fromCache && status === 'offline' ? (
      <div className="offline-banner" role="status">
        Offline — showing cached data
      </div>
    ) : null

  const isLifecycleBlocked = policy?.effectiveScopes.length === 0
  const isProcessing = isBatchProcessing || operations.size > 0
  const actionLabel =
    currentAction === 'install'
      ? 'Install'
      : currentAction === 'update'
        ? 'Update'
        : 'Uninstall'
  let currentViewAnnouncement = 'Home page'

  if (currentView === 'selectSkills') {
    currentViewAnnouncement = `${actionLabel} select skills page`
  } else if (currentView === 'selectAgents') {
    currentViewAnnouncement = `${actionLabel} select agents page`
  } else if (currentView === 'selectOutdatedSkills') {
    currentViewAnnouncement = 'Update select skills page'
  } else if (currentView === 'installConfig') {
    currentViewAnnouncement = 'Install configuration page'
  } else if (currentView === 'removeConfirm') {
    currentViewAnnouncement = 'Remove confirmation page'
  } else if (currentView === 'status') {
    currentViewAnnouncement = isBatchProcessing ? 'Operation in progress' : 'Operation complete'
  }

  if (statusContent) {
    return <div className="app">{statusContent}</div>
  }

  const renderCurrentView = () => {
    if (currentView !== 'home' && currentView !== 'selectOutdatedSkills' && !registry) {
      return <NoRegistryState />
    }

    if (currentView === 'home') {
      return (
        <HomePage
          policy={policy}
          isTrusted={isTrusted}
          isProcessing={isProcessing}
          onInstall={() => goToAgents('install')}
          onUninstall={() => goToAgents('uninstall')}
          onUpdate={goToOutdatedSkills}
        />
      )
    }

    if (currentView === 'selectOutdatedSkills') {
      return (
        <SelectOutdatedSkillsPage
          registry={registry!}
          installedSkills={installedSkills}
          effectiveScopes={policy?.effectiveScopes ?? ['global']}
          selectedSkills={selectedSkills}
          onToggleSkill={toggleSkill}
          onSelectAll={selectAllSkills}
          onClear={clearSkillSelection}
          onCancel={goHome}
          onUpdate={handleExecuteUpdate}
        />
      )
    }

    if (!currentAction || currentAction === 'update' || !registry) {
      if (currentView === 'status') {
        return (
          <StatusPage
            isProcessing={isBatchProcessing || operations.size > 0}
            operations={operations}
            batchResult={batchResult}
            onRetry={handleRetry}
            onDone={goHome}
          />
        )
      }
      return <NoRegistryState />
    }

    if (currentView === 'selectAgents') {
      return (
        <SelectAgentsPage
          action={currentAction}
          availableAgents={allAgents.length > 0 ? allAgents : availableAgents}
          installedSkills={installedSkills}
          selectedSkills={selectedSkills}
          selectedAgents={selectedAgents}
          scope={activeScope}
          isProcessing={isBatchProcessing}
          onToggleAgent={toggleAgent}
          onSelectAll={selectAllAgents}
          onClear={clearAgentSelection}
          onBack={goHome}
          onCancel={goHome}
          onProceed={goToSkillsView}
        />
      )
    }

    if (currentView === 'selectSkills') {
      return (
        <SelectSkillsPage
          action={currentAction}
          registry={registry}
          installedSkills={installedSkills}
          allAgents={allAgents}
          selectedAgents={selectedAgents}
          scope={activeScope}
          selectedSkills={selectedSkills}
          onToggleSkill={toggleSkill}
          onSelectAll={selectAllSkills}
          onClear={clearSkillSelection}
          onBack={goToAgentsView}
          onCancel={goHome}
          onNext={
            currentAction === 'install'
              ? goToInstallConfig
              : goToRemoveConfirm
          }
        />
      )
    }

    if (currentView === 'installConfig' && currentAction === 'install') {
      return (
        <InstallConfigPage
          selectedSkills={selectedSkills}
          selectedAgents={selectedAgents}
          scope={activeScope}
          method={installMethod}
          effectiveScopes={policy?.effectiveScopes ?? ['global']}
          isProcessing={isBatchProcessing}
          onMethodChange={setInstallMethod}
          onScopeChange={setScope}
          onCancel={goHome}
          onBack={goToSkillsView}
          onConfirm={() => handleExecuteBatch(installMethod)}
        />
      )
    }

    if (currentView === 'removeConfirm' && currentAction === 'uninstall') {
      return (
        <RemoveConfirmPage
          selectedSkills={selectedSkills}
          selectedAgents={selectedAgents}
          scope={activeScope}
          isProcessing={isBatchProcessing}
          onBack={goToSkillsView}
          onConfirm={() => handleExecuteBatch()}
        />
      )
    }

    if (currentView === 'status') {
      return (
        <StatusPage
          isProcessing={isBatchProcessing || operations.size > 0}
          operations={operations}
          batchResult={batchResult}
          onRetry={handleRetry}
          onDone={goHome}
        />
      )
    }

    return <NoRegistryState />
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
