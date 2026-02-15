import { useState } from 'react'
import type { AgentInstallInfo, InstalledSkillInfo } from '../../shared/types'

interface SelectionFlowProps {
  action: 'add' | 'remove'
  installedInfo: InstalledSkillInfo | null
  agents: AgentInstallInfo[]
  hasWorkspace: boolean
  onConfirm: (agent: string, scope: 'local' | 'global' | 'all') => void
  onCancel: () => void
}

export function SelectionFlow({
  action,
  installedInfo,
  agents,
  hasWorkspace,
  onConfirm,
  onCancel,
}: SelectionFlowProps) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [selectedScope, setSelectedScope] = useState<string | null>(null)

  const agentOptions = agents.map((agent) => {
    const installed = installedInfo?.agents.find((ia) => ia.agent === agent.agent)
    const statusHint = installed
      ? installed.local && installed.global
        ? 'Local + Global'
        : installed.local
          ? 'Local'
          : installed.global
            ? 'Global'
            : '—'
      : '—'

    // Validation
    const disabled = action === 'add' ? !!(installed?.local && installed?.global) : !installed

    return { value: agent.agent, label: agent.displayName, statusHint, disabled }
  })

  const getScopeOptions = () => {
    if (!selectedAgent) return []
    const installed = installedInfo?.agents.find((a) => a.agent === selectedAgent)
    const agentInstalled = !!installed

    if (action === 'add') {
      return [
        { value: 'local', label: 'Locally', disabled: !hasWorkspace || (agentInstalled && !!installed?.local) },
        { value: 'global', label: 'Globally', disabled: agentInstalled && !!installed?.global },
        {
          value: 'all',
          label: 'All',
          disabled: !hasWorkspace || (agentInstalled && !!installed?.local && agentInstalled && !!installed?.global),
        },
      ]
    } else {
      return [
        { value: 'local', label: 'Locally', disabled: !agentInstalled || !installed?.local },
        { value: 'global', label: 'Globally', disabled: !agentInstalled || !installed?.global },
        { value: 'all', label: 'All', disabled: !agentInstalled || !installed?.local || !installed?.global },
      ]
    }
  }

  const scopeOptions = getScopeOptions()

  return (
    <div className="selection-flow" role="form" aria-label={`${action === 'add' ? 'Add' : 'Remove'} skill`}>
      <div className="selection-step">
        <label htmlFor="agent-select" className="selection-label">
          Agent
        </label>
        <select
          id="agent-select"
          className="selection-dropdown"
          value={selectedAgent ?? ''}
          onChange={(e) => {
            setSelectedAgent(e.target.value)
            setSelectedScope(null)
          }}
          aria-describedby="agent-status"
        >
          <option value="" disabled>
            Select agent…
          </option>
          {agentOptions.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label} {opt.statusHint !== '—' ? `(${opt.statusHint})` : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedAgent && (
        <div className="selection-step">
          <label htmlFor="scope-select" className="selection-label">
            Scope
          </label>
          <select
            id="scope-select"
            className="selection-dropdown"
            value={selectedScope ?? ''}
            onChange={(e) => setSelectedScope(e.target.value)}
          >
            <option value="" disabled>
              Select scope…
            </option>
            {scopeOptions.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="selection-actions">
        <button
          className="selection-confirm"
          disabled={!selectedAgent || !selectedScope}
          onClick={() =>
            selectedAgent && selectedScope && onConfirm(selectedAgent, selectedScope as 'local' | 'global' | 'all')
          }
        >
          {action === 'add' ? 'Add' : 'Remove'}
        </button>
        <button className="selection-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
