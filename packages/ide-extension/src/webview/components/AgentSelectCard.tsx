import type { AvailableAgent } from '../../shared/types'

/**
 * Props for the AgentSelectCard component.
 */
export interface AgentSelectCardProps {
  /** The agent data to display. */
  agent: AvailableAgent
  /** The agent's company affiliation. */
  company: string
  /** Whether the agent is currently checked/selected. */
  isSelected: boolean
  /** Callback fired when the selection state is toggled. */
  onToggle: () => void
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
 *   company="Acme Corp"
 *   isSelected={true}
 *   onToggle={() => handleToggle(myAgent.agent)}
 * />
 * ```
 */
export function AgentSelectCard({ agent, company, isSelected, onToggle }: AgentSelectCardProps) {
  const inputId = `agent-select-${agent.agent}`
  const selectLabel = `Select ${agent.displayName}`

  return (
    <label className={`agent-select-card ${isSelected ? 'agent-select-card--selected' : ''}`} htmlFor={inputId}>
      <div className="agent-select-card-header">
        <p className="agent-select-card-name">{agent.displayName}</p>
        <input
          id={inputId}
          className="select-card-checkbox"
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          aria-label={selectLabel}
        />
      </div>
      <p className="agent-select-card-company">{company}</p>
    </label>
  )
}
