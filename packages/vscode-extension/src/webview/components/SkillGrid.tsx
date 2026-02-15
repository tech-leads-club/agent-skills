import type { Category, Skill } from '../../shared/types'
import { SkillCard } from './SkillCard'

export interface SkillGridProps {
  skills: Skill[]
  categories: Record<string, Category>
}

/**
 * Container component that renders a vertical list of SkillCard components.
 * Resolves category display names from the categories map.
 */
export function SkillGrid({ skills, categories }: SkillGridProps) {
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

        return (
          <div key={skill.name} role="listitem">
            <SkillCard skill={skill} categoryName={categoryName} />
          </div>
        )
      })}
    </div>
  )
}
