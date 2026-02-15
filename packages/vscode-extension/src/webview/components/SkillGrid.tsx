import type { AgentInstallInfo, AvailableAgent, Category, InstalledSkillsMap, Skill } from '../../shared/types'
import { postMessage } from '../lib/vscode-api'
import { SkillCard } from './SkillCard'

export interface SkillGridProps {
  skills: Skill[]
  categories: Record<string, Category>
  installedSkills: InstalledSkillsMap
  isOperating: (skillName: string) => boolean
  getOperationMessage: (skillName: string) => string | undefined
  availableAgents: AvailableAgent[]
  hasWorkspace: boolean
  onMarkPending: (skillName: string, action: 'add' | 'remove') => void
}

/**
 * Container component that renders a vertical list of SkillCard components.
 * Resolves category display names and constructs per-card installation state.
 */
export function SkillGrid({
  skills,
  categories,
  installedSkills,
  isOperating,
  getOperationMessage,
  availableAgents,
  onMarkPending,
}: SkillGridProps) {
  if (skills.length === 0) {
    return (
      <div className="empty-state" role="status">
        <p>No skills found</p>
      </div>
    )
  }

  return (
    <div className="skill-grid" role="list" aria-label="Skills">
      {skills.map((skill) => {
        const categoryName = categories[skill.category]?.name || skill.category
        const installedInfo = installedSkills[skill.name] || null

        // Merge available agents with installation status
        const cardAgents: AgentInstallInfo[] = availableAgents.map((avail) => {
          const installed = installedInfo?.agents.find((ia) => ia.agent === avail.agent)
          if (installed) return installed
          return {
            agent: avail.agent,
            displayName: avail.displayName,
            local: false,
            global: false,
          }
        })

        // Check for updates (stub logic)
        const hasUpdate = false

        return (
          <div key={skill.name} role="listitem">
            <SkillCard
              skill={skill}
              categoryName={categoryName}
              installedInfo={installedInfo}
              isOperating={isOperating(skill.name)}
              operationMessage={getOperationMessage(skill.name)}
              hasUpdate={hasUpdate}
              agents={cardAgents}
              onUpdate={() => {
                postMessage({
                  type: 'updateSkill',
                  payload: { skillName: skill.name },
                })
              }}
              onRequestAgentPick={(action) => {
                onMarkPending(skill.name, action)
                postMessage({
                  type: 'requestAgentPick',
                  payload: { skillName: skill.name, action },
                })
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
