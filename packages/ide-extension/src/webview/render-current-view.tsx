import { lazy, useEffect } from 'react'
import {
  getCategoryOptions,
  getOutdatedSkills,
  getSelectableSkills,
  isSkillInstalledForScope,
} from '../services/selection-selectors'
import { NoRegistryState } from './components/AppStatusViews'
import { useActionsContext, useAppStateContext, useHostStateContext } from './contexts'
import { postMessage } from './lib/vscode-api'
import { HomePage } from './views/HomePage'

const InstallConfigPage = lazy(() =>
  import('./views/InstallConfigPage').then((m) => ({ default: m.InstallConfigPage })),
)
const RemoveConfirmPage = lazy(() =>
  import('./views/RemoveConfirmPage').then((m) => ({ default: m.RemoveConfirmPage })),
)
const SelectAgentsPage = lazy(() => import('./views/SelectAgentsPage').then((m) => ({ default: m.SelectAgentsPage })))
const SelectOutdatedSkillsPage = lazy(() =>
  import('./views/SelectOutdatedSkillsPage').then((m) => ({ default: m.SelectOutdatedSkillsPage })),
)
const SelectSkillsPage = lazy(() => import('./views/SelectSkillsPage').then((m) => ({ default: m.SelectSkillsPage })))
const StatusPage = lazy(() => import('./views/StatusPage').then((m) => ({ default: m.StatusPage })))

const focusableSelector = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ')

function focusViewRoot() {
  const heading = document.querySelector('h1')
  if (heading instanceof HTMLElement) {
    if (!heading.hasAttribute('tabindex')) {
      heading.setAttribute('tabindex', '-1')
    }
    heading.focus()
    return
  }

  const fallbackElement = Array.from(document.querySelectorAll<HTMLElement>(focusableSelector)).find(
    (element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true',
  )
  fallbackElement?.focus()
}

/**
 * Renders the active view by reading all state and actions from context.
 * Receives no external props — routing is driven by AppStateContext.
 */
export function CurrentView() {
  const {
    currentView,
    currentAction,
    selectedSkills,
    selectedAgents,
    activeScope,
    installMethod,
    goToAgents,
    goToAgentsView,
    goToSkillsView,
    goToInstallConfig,
    goToRemoveConfirm,
    goHome,
    toggleSkill,
    toggleAgent,
    selectAllSkills,
    clearSkillSelection,
    selectAllAgents,
    clearAgentSelection,
    setScope,
    setInstallMethod,
  } = useAppStateContext()

  const {
    registry,
    installedSkills,
    availableAgents,
    allAgents,
    policy,
    isTrusted,
    isBatchProcessing,
    isRefreshingForUpdate,
    actionState,
    batchResult,
  } = useHostStateContext()

  const { handleRunAction, handleExecuteUpdate, handleRetry, handleUpdateFromHome } = useActionsContext()

  useEffect(() => {
    focusViewRoot()
  }, [currentView])

  if (currentView !== 'home' && currentView !== 'selectOutdatedSkills' && !registry) return <NoRegistryState />

  if (currentView === 'home')
    return (
      <HomePage
        policy={policy}
        isTrusted={isTrusted}
        isProcessing={isBatchProcessing}
        onInstall={() => goToAgents('install')}
        onUninstall={() => goToAgents('uninstall')}
        onUpdate={handleUpdateFromHome}
      />
    )

  if (currentView === 'selectOutdatedSkills')
    return (
      <SelectOutdatedSkillsPage
        registry={registry!}
        installedSkills={installedSkills}
        effectiveScopes={policy?.effectiveScopes ?? ['global']}
        selectedSkills={selectedSkills}
        isRefreshing={isRefreshingForUpdate}
        getCategoryOptions={getCategoryOptions}
        getOutdatedSkills={getOutdatedSkills}
        onToggleSkill={toggleSkill}
        onSelectAll={selectAllSkills}
        onClear={clearSkillSelection}
        onCancel={goHome}
        onUpdate={handleExecuteUpdate}
      />
    )

  if (!currentAction || currentAction === 'update' || !registry)
    return currentView === 'status' ? (
      <StatusPage
        isProcessing={isBatchProcessing}
        currentStep={actionState.currentStep}
        logTimeline={actionState.logs}
        batchResult={batchResult}
        rejectionMessage={actionState.rejectionMessage}
        onRetry={handleRetry}
        onDone={goHome}
      />
    ) : (
      <NoRegistryState />
    )

  if (currentView === 'selectAgents')
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

  if (currentView === 'selectSkills')
    return (
      <SelectSkillsPage
        action={currentAction}
        registry={registry}
        installedSkills={installedSkills}
        allAgents={allAgents}
        selectedAgents={selectedAgents}
        scope={activeScope}
        selectedSkills={selectedSkills}
        getCategoryOptions={getCategoryOptions}
        getSelectableSkills={getSelectableSkills}
        isSkillInstalledForScope={isSkillInstalledForScope}
        onToggleSkill={toggleSkill}
        onPreviewSkill={(skillName) => postMessage({ type: 'requestPreviewSkill', payload: { skillName } })}
        onSelectAll={selectAllSkills}
        onClear={clearSkillSelection}
        onBack={goToAgentsView}
        onCancel={goHome}
        onNext={currentAction === 'install' ? goToInstallConfig : goToRemoveConfirm}
      />
    )

  if (currentView === 'installConfig' && currentAction === 'install')
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
        onConfirm={() => handleRunAction(installMethod)}
      />
    )

  if (currentView === 'removeConfirm' && currentAction === 'uninstall')
    return (
      <RemoveConfirmPage
        selectedSkills={selectedSkills}
        selectedAgents={selectedAgents}
        scope={activeScope}
        isProcessing={isBatchProcessing}
        onBack={goToSkillsView}
        onConfirm={() => handleRunAction()}
      />
    )

  if (currentView === 'status')
    return (
      <StatusPage
        isProcessing={isBatchProcessing}
        currentStep={actionState.currentStep}
        logTimeline={actionState.logs}
        batchResult={batchResult}
        rejectionMessage={actionState.rejectionMessage}
        onRetry={handleRetry}
        onDone={goHome}
      />
    )

  return <NoRegistryState />
}
