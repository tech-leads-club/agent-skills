import { memo } from 'react'

import type { AvailableAgent } from '../../shared/types'

/**
 * Props for the AgentSelectCard component.
 */
export interface AgentSelectCardProps {
  /** The agent data to display. */
  agent: AvailableAgent
  /** Whether the agent is currently checked/selected. */
  isSelected: boolean
  /** Callback fired when the selection state is toggled. */
  onToggle: () => void
  /** Whether the agent has skills installed (shows "Installed" tag). */
  isInstalled?: boolean
}

function agentsEqual(a: AvailableAgent, b: AvailableAgent): boolean {
  return a.agent === b.agent && a.displayName === b.displayName && a.company === b.company
}

function areAgentSelectCardPropsEqual(prev: AgentSelectCardProps, next: AgentSelectCardProps): boolean {
  if (!agentsEqual(prev.agent, next.agent)) return false
  if (prev.isSelected !== next.isSelected) return false
  if (prev.isInstalled !== next.isInstalled) return false
  if (prev.onToggle !== next.onToggle) return false
  return true
}

/**
 * Card row used on Select Agents page.
 *
 * @param props - Component props containing agent metadata and selection state handlers.
 * @returns Selectable agent card with checkbox.
 *
 * @see {@link AgentSelectCardProps} for available props.
 *
 * @example
 * ```tsx
 * <AgentSelectCard
 *   agent={myAgent}
 *   isSelected={true}
 *   onToggle={() => handleToggle(myAgent.agent)}
 * />
 * ```
 */
export const AgentSelectCard = memo(function AgentSelectCard({
  agent,
  isSelected,
  onToggle,
  isInstalled = false,
}: AgentSelectCardProps) {
  const inputId = `agent-select-${agent.agent}`
  const selectLabel = `Select ${agent.displayName}`

  return (
    <label className={`agent-select-card ${isSelected ? 'agent-select-card--selected' : ''}`} htmlFor={inputId}>
      <div className="agent-select-card-header">
        <p className="agent-select-card-name">{agent.displayName}</p>
        <div className="agent-select-card-header-end">
          {isInstalled && <span className="agent-select-card-tag agent-select-card-tag--installed">Installed</span>}
          <input
            id={inputId}
            className="select-card-checkbox"
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            aria-label={selectLabel}
          />
        </div>
      </div>
    </label>
  )
}, areAgentSelectCardPropsEqual)
