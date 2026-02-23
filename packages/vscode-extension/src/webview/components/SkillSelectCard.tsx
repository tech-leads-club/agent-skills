import type { Skill } from '../../shared/types'

/**
 * Props for the SkillSelectCard component.
 */
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
  const descriptionId = `${inputId}-description`
  const selectLabel = `Select ${skill.name}`

  return (
    <label className={`skill-select-card ${isSelected ? 'skill-select-card--selected' : ''}`} htmlFor={inputId}>
      <div className="skill-select-card-header">
        <p>{skill.name}</p>
        <div className="skill-select-card-header-end">
          <span className="skill-select-card-category" data-category={skill.category}>
            {categoryName}
          </span>
          <input
            id={inputId}
            className="select-card-checkbox"
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            aria-label={selectLabel}
            aria-describedby={descriptionId}
          />
        </div>
      </div>
      <p id={descriptionId} className="skill-select-card-description" title={skill.description}>
        {skill.description}
      </p>
      <div className="skill-select-card-meta">
        <span className="skill-select-card-meta-author">{skill.author ?? 'Unknown author'}</span>
        <span className="skill-select-card-meta-divider" aria-hidden="true" />
        <span className="skill-select-card-meta-version">{skill.version ? `v${skill.version}` : 'no version'}</span>
      </div>
    </label>
  )
}
