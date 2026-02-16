import type { AgentInstallInfo, InstalledSkillInfo, Skill } from '../../shared/types'

export interface SkillCardProps {
  skill: Skill
  categoryName: string
  installedInfo: InstalledSkillInfo | null
  isOperating: boolean
  operationMessage?: string
  hasUpdate: boolean
  isCorrupted: boolean
  agents: AgentInstallInfo[]
  onUpdate: () => void
  onRepair: () => void
  onRequestAgentPick: (action: 'add' | 'remove') => void
}

/**
 * Card component for displaying a single skill with lifecycle management actions.
 * Agent and scope selection is handled via vscode.window.showQuickPick in the extension host.
 */
export function SkillCard({
  skill,
  categoryName,
  installedInfo,
  isOperating,
  operationMessage,
  hasUpdate,
  isCorrupted,
  agents,
  onUpdate,
  onRepair,
  onRequestAgentPick,
}: SkillCardProps) {
  const ariaLabel =
    `${skill.name}. ${skill.description}. Category: ${categoryName}.` +
    (skill.author ? ` By ${skill.author}.` : '') +
    (skill.version ? ` Version ${skill.version}.` : '')

  // Render Action Buttons
  const renderActions = () => {
    const buttons = []

    if (isCorrupted) {
      // REPAIR: replaces ADD/UPDATE when corrupted
      buttons.push(
        <button
          key="repair"
          className="btn-repair"
          onClick={(e) => {
            e.stopPropagation()
            onRepair()
          }}
          disabled={isOperating}
        >
          Repair
        </button>,
      )
    } else if (hasUpdate) {
      // UPDATE replaces ADD in the primary position
      buttons.push(
        <button
          key="update"
          className="btn-update"
          onClick={(e) => {
            e.stopPropagation()
            onUpdate()
          }}
          disabled={isOperating}
        >
          Update
        </button>,
      )
    } else {
      // ADD: only when no update available AND there are non-saturated agent/scope combinations
      // Check if any agent is NOT fully installed (local + global)
      const hasAvailableCombinations = agents.some((a) => {
        const installed = installedInfo?.agents.find((ia) => ia.agent === a.agent)
        return !installed || !installed.local || !installed.global
      })

      if (hasAvailableCombinations) {
        buttons.push(
          <button
            key="add"
            className="btn-add"
            onClick={(e) => {
              e.stopPropagation()
              onRequestAgentPick('add')
            }}
            disabled={isOperating}
          >
            Add
          </button>,
        )
      }
    }

    // REMOVE: if installed in at least one agent/scope
    if (installedInfo && installedInfo.agents.length > 0) {
      buttons.push(
        <button
          key="remove"
          className="btn-remove"
          onClick={(e) => {
            e.stopPropagation()
            onRequestAgentPick('remove')
          }}
          disabled={isOperating}
        >
          Remove
        </button>,
      )
    }

    return <div className="skill-card-actions">{buttons}</div>
  }

  const cardClasses = `skill-card ${isOperating ? 'skill-card--operating' : ''}`

  return (
    <div className={cardClasses} role="article" aria-label={ariaLabel} aria-busy={isOperating}>
      <div className="skill-card-header">
        <h3 className="skill-card-title">{skill.name}</h3>
        {isCorrupted && <span className="skill-card-category-badge skill-card-badge--warning">⚠ Corrupted</span>}
        <span className="skill-card-category-badge">{categoryName}</span>
      </div>

      <p className="skill-card-description">{skill.description}</p>
      <div className="skill-card-meta">
        {skill.author && <span className="skill-card-author">by {skill.author}</span>}
        {skill.version && <span className="skill-card-version">v{skill.version}</span>}
      </div>

      {renderActions()}

      {isOperating && operationMessage && (
        <div className="skill-card-progress" aria-live="polite">
          {operationMessage}
        </div>
      )}
    </div>
  )
}
