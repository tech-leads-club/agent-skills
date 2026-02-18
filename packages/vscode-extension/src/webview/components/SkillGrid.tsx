import type { AgentInstallInfo, AvailableAgent, Category, InstalledSkillsMap, Skill } from '../../shared/types'
import { postMessage } from '../lib/vscode-api'
import { SkillCard } from './SkillCard'

/**
 * Props consumed by the skill grid, covering display data and action hooks.
 */
export interface SkillGridProps {
  skills: Skill[]
  categories: Record<string, Category>
  installedSkills: InstalledSkillsMap
  isOperating: (skillName: string) => boolean
  getOperationMessage: (skillName: string) => string | undefined
  availableAgents: AvailableAgent[]
  hasWorkspace: boolean
  onMarkPending: (skillName: string, action: 'add' | 'remove' | 'repair') => void
  onRepair: (skillName: string, agents: string[], scope: 'local' | 'global') => void
  isLifecycleBlocked: boolean
}

/**
 * Container component that renders a vertical list of SkillCard components.
 * Resolves category display names and constructs per-card installation state.
 *
 * @param props - Grid data, state selectors, and action callbacks.
 * @returns Rendered skill grid or an empty-state message.
 */
export function SkillGrid({
  skills,
  categories,
  installedSkills,
  isOperating,
  getOperationMessage,
  availableAgents,
  hasWorkspace,
  onMarkPending,
  onRepair,
  isLifecycleBlocked,
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

        // Derive corruption state from agents
        const isCorrupted = installedInfo?.agents.some((a) => a.corrupted) ?? false

        // Merge available agents with installation status
        const cardAgents: AgentInstallInfo[] = availableAgents.map((avail) => {
          const installed = installedInfo?.agents.find((ia) => ia.agent === avail.agent)
          if (installed) return installed
          return {
            agent: avail.agent,
            displayName: avail.displayName,
            local: false,
            global: false,
            corrupted: false,
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
              isCorrupted={isCorrupted}
              agents={cardAgents}
              onUpdate={() => {
                postMessage({
                  type: 'updateSkill',
                  payload: { skillName: skill.name },
                })
              }}
              onRepair={() => {
                // Determine what to repair. If multiple agents are corrupted, repair all?
                if (!installedInfo) return

                const agents = installedInfo.agents.map((a) => a.agent)

                // If hasWorkspace, default to 'local' repair if possible, else 'global'
                // Or just send 'local' if hasWorkspace is true, and Orchestrator handles it?
                // Orchestrator needs specific scope.

                const targetScope = hasWorkspace ? 'local' : 'global'
                onRepair(skill.name, agents, targetScope)
                onMarkPending(skill.name, 'repair')
              }}
              onRequestAgentPick={(action) => {
                onMarkPending(skill.name, action)
                postMessage({
                  type: 'requestAgentPick',
                  payload: { skillName: skill.name, action },
                })
              }}
              isLifecycleBlocked={isLifecycleBlocked}
            />
          </div>
        )
      })}
    </div>
  )
}
