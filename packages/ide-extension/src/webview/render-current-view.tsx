import {
  getCategoryOptions,
  getOutdatedSkills,
  getSelectableSkills,
  isSkillInstalledForScope,
} from '../services/selection-selectors'
import type { ScopePolicyStatePayload } from '../shared/messages'
import { postMessage } from './lib/vscode-api'
import type { ActionRequest, FlowAction, InstallMethod, InstalledSkillsMap, LifecycleScope, SkillRegistry } from '../shared/types'
import { NoRegistryState } from './components/AppStatusViews'
import type { BatchResult } from './hooks/useHostState'
import { lazy } from 'react'
import { HomePage } from './views/HomePage'

const InstallConfigPage = lazy(() => import('./views/InstallConfigPage').then((m) => ({ default: m.InstallConfigPage })))
const RemoveConfirmPage = lazy(() => import('./views/RemoveConfirmPage').then((m) => ({ default: m.RemoveConfirmPage })))
const SelectAgentsPage = lazy(() => import('./views/SelectAgentsPage').then((m) => ({ default: m.SelectAgentsPage })))
const SelectOutdatedSkillsPage = lazy(() =>
  import('./views/SelectOutdatedSkillsPage').then((m) => ({ default: m.SelectOutdatedSkillsPage })),
)
const SelectSkillsPage = lazy(() => import('./views/SelectSkillsPage').then((m) => ({ default: m.SelectSkillsPage })))
const StatusPage = lazy(() => import('./views/StatusPage').then((m) => ({ default: m.StatusPage })))

interface RenderCurrentViewProps {
  currentView:
    | 'home'
    | 'selectSkills'
    | 'selectAgents'
    | 'installConfig'
    | 'removeConfirm'
    | 'status'
    | 'selectOutdatedSkills'
  currentAction: FlowAction | null
  registry: SkillRegistry | null
  installedSkills: InstalledSkillsMap
  availableAgents: Array<{ agent: string; displayName: string; company: string }>
  allAgents: Array<{ agent: string; displayName: string; company: string }>
  policy: ScopePolicyStatePayload | null
  isTrusted: boolean
  isProcessing: boolean
  isRefreshingForUpdate: boolean
  selectedSkills: string[]
  selectedAgents: string[]
  activeScope: ActionRequest['scope']
  installMethod: InstallMethod
  currentStep: string | null
  logTimeline: Array<{
    operation: 'install' | 'remove' | 'update'
    skillName: string
    scope?: LifecycleScope
    message: string
    severity: 'info' | 'warn' | 'error'
  }>
  batchResult: BatchResult | null
  rejectionMessage: string | null
  goToAgents: (action: 'install' | 'uninstall') => void
  goToAgentsView: () => void
  goToSkillsView: () => void
  goToInstallConfig: () => void
  goToRemoveConfirm: () => void
  goToOutdatedSkills: () => void
  goHome: () => void
  toggleSkill: (skillName: string) => void
  toggleAgent: (agentId: string) => void
  selectAllSkills: (skills: string[]) => void
  clearSkillSelection: () => void
  selectAllAgents: (agents: string[]) => void
  clearAgentSelection: () => void
  setScope: (scope: ActionRequest['scope']) => void
  setInstallMethod: (method: InstallMethod) => void
  handleExecuteBatch: (method?: 'copy' | 'symlink') => void
  handleExecuteUpdate: (skills: string[]) => void
  handleRetry: () => void
}

export function renderCurrentView(props: RenderCurrentViewProps) {
  const {
    currentView,
    currentAction,
    registry,
    installedSkills,
    availableAgents,
    allAgents,
    policy,
    isTrusted,
    isProcessing,
    isRefreshingForUpdate,
    selectedSkills,
    selectedAgents,
    activeScope,
    installMethod,
    currentStep,
    logTimeline,
    batchResult,
    rejectionMessage,
    goToAgents,
    goToAgentsView,
    goToSkillsView,
    goToInstallConfig,
    goToRemoveConfirm,
    goToOutdatedSkills,
    goHome,
    toggleSkill,
    toggleAgent,
    selectAllSkills,
    clearSkillSelection,
    selectAllAgents,
    clearAgentSelection,
    setScope,
    setInstallMethod,
    handleExecuteBatch,
    handleExecuteUpdate,
    handleRetry,
  } = props

  if (currentView !== 'home' && currentView !== 'selectOutdatedSkills' && !registry) return <NoRegistryState />
  if (currentView === 'home')
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
        isProcessing={isProcessing}
        currentStep={currentStep}
        logTimeline={logTimeline}
        batchResult={batchResult}
        rejectionMessage={rejectionMessage}
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
        isProcessing={isProcessing}
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
        isProcessing={isProcessing}
        onMethodChange={setInstallMethod}
        onScopeChange={setScope}
        onCancel={goHome}
        onBack={goToSkillsView}
        onConfirm={() => handleExecuteBatch(installMethod)}
      />
    )
  if (currentView === 'removeConfirm' && currentAction === 'uninstall')
    return (
      <RemoveConfirmPage
        selectedSkills={selectedSkills}
        selectedAgents={selectedAgents}
        scope={activeScope}
        isProcessing={isProcessing}
        onBack={goToSkillsView}
        onConfirm={() => handleExecuteBatch()}
      />
    )
  if (currentView === 'status')
    return (
      <StatusPage
        isProcessing={isProcessing}
        currentStep={currentStep}
        logTimeline={logTimeline}
        batchResult={batchResult}
        rejectionMessage={rejectionMessage}
        onRetry={handleRetry}
        onDone={goHome}
      />
    )

  return <NoRegistryState />
}
