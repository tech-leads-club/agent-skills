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
