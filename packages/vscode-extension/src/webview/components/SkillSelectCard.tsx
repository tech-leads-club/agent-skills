import type { Skill } from '../../shared/types'

export interface SkillSelectCardProps {
  skill: Skill
  categoryName: string
  isSelected: boolean
  onToggle: () => void
}

/**
 * Card row used on Select Skills page.
 *
 * @param props - Skill metadata and selection state handlers.
 * @returns Selectable skill card with checkbox.
 */
export function SkillSelectCard({ skill, categoryName, isSelected, onToggle }: SkillSelectCardProps) {
  const inputId = `skill-select-${skill.name}`

  return (
    <label className={`skill-select-card ${isSelected ? 'skill-select-card--selected' : ''}`} htmlFor={inputId}>
      <div className="skill-select-card-header">
        <p>{skill.name}</p>
        <span className="skill-select-card-category">{categoryName}</span>
      </div>
      <p className="skill-select-card-description">{skill.description}</p>
      <div className="skill-select-card-meta">
        <span>{skill.author ?? 'Unknown author'}</span>
        <span>{skill.version ? `v${skill.version}` : 'no version'}</span>
        <input
          id={inputId}
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          aria-label={`Select ${skill.name}`}
        />
      </div>
    </label>
  )
}
