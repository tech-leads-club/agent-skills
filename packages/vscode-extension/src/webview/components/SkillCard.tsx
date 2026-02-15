import { useState } from 'react'
import type { AgentInstallInfo, InstalledSkillInfo, Skill } from '../../shared/types'
import { SelectionFlow } from './SelectionFlow'

export interface SkillCardProps {
  skill: Skill
  categoryName: string
  installedInfo: InstalledSkillInfo | null
  isOperating: boolean
  operationMessage?: string
  hasUpdate: boolean
  agents: AgentInstallInfo[]
  hasWorkspace: boolean
  onInstall: (agent: string, scope: 'local' | 'global' | 'all') => void
  onRemove: (agent: string, scope: 'local' | 'global' | 'all') => void
  onUpdate: () => void
}

type ActionType = 'add' | 'remove' | null

/**
 * Card component for displaying a single skill with lifecycle management actions.
 * Supports guided selection flow for agent/scope selection.
 */
export function SkillCard({
  skill,
  categoryName,
  installedInfo,
  isOperating,
  operationMessage,
  hasUpdate,
  agents,
  hasWorkspace,
  onInstall,
  onRemove,
  onUpdate,
}: SkillCardProps) {
  const [activeAction, setActiveAction] = useState<ActionType>(null)

  const ariaLabel =
    `${skill.name}. ${skill.description}. Category: ${categoryName}.` +
    (skill.author ? ` By ${skill.author}.` : '') +
    (skill.version ? ` Version ${skill.version}.` : '')

  // Render Action Buttons
  const renderActions = () => {
    if (activeAction) return null

    const buttons = []

    if (hasUpdate) {
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
              setActiveAction('add')
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
            setActiveAction('remove')
          }}
          disabled={isOperating}
        >
          Remove
        </button>,
      )
    }

    return <div className="skill-card-actions">{buttons}</div>
  }

  // Render Selection Flow
  const renderSelectionFlow = () => {
    if (!activeAction) return null

    return (
      <SelectionFlow
        action={activeAction}
        installedInfo={installedInfo}
        agents={agents}
        hasWorkspace={hasWorkspace}
        onConfirm={(agent, scope) => {
          if (activeAction === 'add') {
            onInstall(agent, scope)
          } else {
            onRemove(agent, scope)
          }
          setActiveAction(null)
        }}
        onCancel={() => setActiveAction(null)}
      />
    )
  }

  const cardClasses = `skill-card ${isOperating ? 'skill-card--operating' : ''}`

  return (
    <div
      className={cardClasses}
      role="article" // Changed from button to article since it contains interactive elements
      aria-label={ariaLabel}
      aria-busy={isOperating}
    >
      <div className="skill-card-header">
        <h3 className="skill-card-title">{skill.name}</h3>
        <span className="skill-card-category-badge">{categoryName}</span>
      </div>

      {!activeAction && (
        <>
          <p className="skill-card-description">{skill.description}</p>
          <div className="skill-card-meta">
            {skill.author && <span className="skill-card-author">by {skill.author}</span>}
            {skill.version && <span className="skill-card-version">v{skill.version}</span>}
          </div>
        </>
      )}

      {renderActions()}
      {renderSelectionFlow()}

      {isOperating && operationMessage && (
        <div className="skill-card-progress" aria-live="polite">
          {operationMessage}
        </div>
      )}
    </div>
  )
}
