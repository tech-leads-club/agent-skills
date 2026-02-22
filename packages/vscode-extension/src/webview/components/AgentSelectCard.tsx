import type { AvailableAgent } from '../../shared/types'

export interface AgentSelectCardProps {
  agent: AvailableAgent
  company: string
  isSelected: boolean
  onToggle: () => void
}

/**
 * Card row used on Select Agents page.
 *
 * @param props - Agent metadata and selection state handlers.
 * @returns Selectable agent card with checkbox.
 */
export function AgentSelectCard({ agent, company, isSelected, onToggle }: AgentSelectCardProps) {
  const inputId = `agent-select-${agent.agent}`

  return (
    <label className={`agent-select-card ${isSelected ? 'agent-select-card--selected' : ''}`} htmlFor={inputId}>
      <div className="agent-select-card-body">
        <p className="agent-select-card-name">{agent.displayName}</p>
        <p>{company}</p>
      </div>
      <input
        id={inputId}
        type="checkbox"
        checked={isSelected}
        onChange={onToggle}
        aria-label={`Select ${agent.displayName}`}
      />
    </label>
  )
}
