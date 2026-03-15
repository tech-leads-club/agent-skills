import Fuse from 'fuse.js'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AvailableAgent, InstalledSkillsMap, LifecycleScope, WebviewAction } from '../../shared/types'
import { AgentSelectCard } from '../components/AgentSelectCard'
import { SearchBar } from '../components/SearchBar'
import { SelectionMenu } from '../components/SelectionMenu'

/**
 * Props for the SelectAgentsPage component.
 */
export interface SelectAgentsPageProps {
  /** The webview action being performed (e.g., 'install' or 'uninstall'). */
  action: WebviewAction
  /** Array of all available target agents. */
  availableAgents: AvailableAgent[]
  /** Map of currently installed skills across the system. */
  installedSkills: InstalledSkillsMap
  /** Names of the skills selected in the previous step. */
  selectedSkills: string[]
  /** IDs of the agents currently selected. */
  selectedAgents: string[]
  /** The install/uninstall scope (local or global). */
  scope: LifecycleScope
  /** Whether a background operation is currently running. */
  isProcessing: boolean
  /** Callback to toggle an agent's selection state. */
  onToggleAgent: (agentId: string) => void
  /** Callback to replace the entire agent selection. */
  onSelectAll: (agents: string[]) => void
  /** Callback to clear all agent selections. */
  onClear: () => void
  /** Callback to navigate back to the previous step. */
  onBack: () => void
  /** Callback to cancel the operation fully. */
  onCancel?: () => void
  /** Callback to proceed to the next step. */
  onProceed: () => void
}

/**
 * Checks if a skill is installed on a specific agent.
 *
 * @param installedSkills - Map of all installed skills.
 * @param skillName - Name of the skill to check.
 * @param agentId - ID of the agent to check.
 * @param scope - The requested scope.
 * @returns True if installed.
 *
 * @example
 * ```typescript
 * const isInstalled = isSkillInstalledOnAgent(installedSkills, 'my-skill', 'agent1', 'global');
 * ```
 */
function isSkillInstalledOnAgent(
  installedSkills: InstalledSkillsMap,
  skillName: string,
  agentId: string,
  scope: LifecycleScope,
): boolean {
  const installed = installedSkills[skillName]
  if (!installed) return false

  const agentInstall = installed.agents.find((entry) => entry.agent === agentId)
  if (!agentInstall) return false

  return scope === 'local' ? agentInstall.local : agentInstall.global
}

/**
 * Agents page for selecting target agents and executing a batch operation.
 *
 * @param props - Selection context and callbacks for agent selection flow.
 * @returns Agents selection view.
 *
 * @see {@link SelectAgentsPageProps} for available props.
 *
 * @example
 * ```tsx
 * <SelectAgentsPage
 *   action="install"
 *   availableAgents={allAgents}
 *   installedSkills={installedSkills}
 *   selectedSkills={['my-skill']}
 *   selectedAgents={['agent1']}
 *   scope="local"
 *   isProcessing={false}
 *   onToggleAgent={(agentId) => toggleAgent(agentId)}
 *   onSelectAll={(agents) => selectAllAgents(agents)}
 *   onClear={() => clearAgentSelection()}
 *   onBack={() => goBack()}
 *   onProceed={() => executeBatch()}
 * />
 * ```
 */
export function SelectAgentsPage({
  action,
  availableAgents,
  installedSkills,
  selectedSkills,
  selectedAgents,
  scope,
  isProcessing,
  onToggleAgent,
  onSelectAll,
  onClear,
  onBack,
  onCancel = onBack,
  onProceed,
}: SelectAgentsPageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const proceedActionClassName =
    action === 'uninstall' ? 'primary-footer-button--uninstall' : 'primary-footer-button--install'

  const candidateAgents = useMemo(() => {
    return availableAgents.filter((agent) => {
      if (selectedSkills.length === 0) return false

      const hasAnySelectedSkillInstalled = selectedSkills.some((skillName) =>
        isSkillInstalledOnAgent(installedSkills, skillName, agent.agent, scope),
      )

      if (action === 'uninstall') {
        return hasAnySelectedSkillInstalled
      }

      const hasAllSelectedSkillsInstalled = selectedSkills.every((skillName) =>
        isSkillInstalledOnAgent(installedSkills, skillName, agent.agent, scope),
      )

      return !hasAllSelectedSkillsInstalled
    })
  }, [action, availableAgents, installedSkills, scope, selectedSkills])

  const searchableAgents = useMemo(
    () =>
      candidateAgents
        .map((agent) => ({
          ...agent,
          company: agent.company || 'Unknown',
        }))
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [candidateAgents],
  )

  const fuseInstance = useMemo(
    () =>
      new Fuse(searchableAgents, {
        keys: ['displayName', 'company'],
        threshold: 0.3,
      }),
    [searchableAgents],
  )

  const visibleAgents = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim()
    if (!normalizedSearchQuery) return searchableAgents
    return fuseInstance.search(normalizedSearchQuery).map((result) => result.item)
  }, [fuseInstance, searchQuery, searchableAgents])

  const visibleAgentIds = useMemo(() => visibleAgents.map((agent) => agent.agent), [visibleAgents])

  const allVisibleSelected =
    visibleAgentIds.length > 0 && visibleAgentIds.every((agent) => selectedAgents.includes(agent))

  const handleToggleAllVisible = useCallback(() => {
    if (allVisibleSelected) {
      onSelectAll(selectedAgents.filter((agentId) => !visibleAgentIds.includes(agentId)))
      return
    }

    onSelectAll([...new Set([...selectedAgents, ...visibleAgentIds])])
  }, [allVisibleSelected, onSelectAll, selectedAgents, visibleAgentIds])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
        event.preventDefault()
        handleToggleAllVisible()
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        onBack()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleToggleAllVisible, onBack])

  const proceedLabel = action === 'install' ? 'Install Skills' : 'Uninstall Skills'

  return (
    <section className="select-page" aria-label="Select agents page">
      <header className="select-page-header">
        <button className="icon-button" onClick={onBack} aria-label="Back to skills">
          <span className="codicon codicon-arrow-left" aria-hidden="true" />
        </button>
        <div>
          <h1>{action === 'install' ? 'Install: Select Agents' : 'Uninstall: Select Agents'}</h1>
          <p>Choose which agents should receive the selected skills.</p>
        </div>
      </header>

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        resultCount={visibleAgents.length}
        placeholder="Search agents..."
        ariaLabel="Search agents"
        resultLabel="agent"
      />

      <SelectionMenu
        selectedCount={selectedAgents.length}
        allSelected={allVisibleSelected}
        onToggleAll={handleToggleAllVisible}
        onClear={onClear}
      />

      <div className="select-page-list" aria-label="Agents list">
        {visibleAgents.map((agent) => (
          <AgentSelectCard
            key={agent.agent}
            agent={agent}
            company={agent.company}
            isSelected={selectedAgents.includes(agent.agent)}
            onToggle={() => onToggleAgent(agent.agent)}
          />
        ))}
      </div>

      <footer className="select-page-footer">
        <div className="select-page-footer-actions">
          <button className="secondary-footer-button" onClick={onCancel} disabled={isProcessing}>
            Cancel
          </button>
          <button
            className={`primary-footer-button ${proceedActionClassName}`}
            onClick={onProceed}
            disabled={selectedAgents.length === 0 || isProcessing}
            title={isProcessing ? 'Operation in progress' : undefined}
          >
            {isProcessing ? 'Processing...' : proceedLabel}
          </button>
        </div>
      </footer>
    </section>
  )
}
