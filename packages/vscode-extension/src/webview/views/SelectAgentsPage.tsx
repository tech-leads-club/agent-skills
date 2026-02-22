import Fuse from 'fuse.js'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AvailableAgent, InstalledSkillsMap, LifecycleScope, WebviewAction } from '../../shared/types'
import { AgentSelectCard } from '../components/AgentSelectCard'
import { SearchBar } from '../components/SearchBar'
import { SelectionMenu } from '../components/SelectionMenu'

const AGENT_COMPANY_MAP: Record<string, string> = {
  cursor: 'Anysphere',
  'claude-code': 'Anthropic',
  copilot: 'GitHub',
  windsurf: 'Codeium',
  cline: 'Cline',
  codex: 'OpenAI',
  opencode: 'OpenCode',
}

export interface SelectAgentsPageProps {
  action: WebviewAction
  availableAgents: AvailableAgent[]
  installedSkills: InstalledSkillsMap
  selectedSkills: string[]
  selectedAgents: string[]
  scope: LifecycleScope
  isProcessing: boolean
  onToggleAgent: (agentId: string) => void
  onSelectAll: (agents: string[]) => void
  onClear: () => void
  onBack: () => void
  onProceed: () => void
}

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
  onProceed,
}: SelectAgentsPageProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const candidateAgents = useMemo(() => {
    return availableAgents.filter((agent) => {
      if (selectedSkills.length === 0) return false

      const hasRelevantSkill = selectedSkills.some((skillName) =>
        isSkillInstalledOnAgent(installedSkills, skillName, agent.agent, scope),
      )

      return action === 'install' ? !hasRelevantSkill : hasRelevantSkill
    })
  }, [action, availableAgents, installedSkills, scope, selectedSkills])

  const searchableAgents = useMemo(
    () =>
      candidateAgents.map((agent) => ({
        ...agent,
        company: AGENT_COMPANY_MAP[agent.agent] ?? 'Unknown',
      })),
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
    if (!searchQuery.trim()) return searchableAgents
    return fuseInstance.search(searchQuery).map((result) => result.item)
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
        <button
          className="primary-footer-button"
          onClick={onProceed}
          disabled={selectedAgents.length === 0 || isProcessing}
          title={isProcessing ? 'Operation in progress' : undefined}
        >
          {isProcessing ? 'Processing...' : proceedLabel}
        </button>
      </footer>
    </section>
  )
}
