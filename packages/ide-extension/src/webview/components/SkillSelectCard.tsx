import { memo } from 'react'

import type { Skill } from '../../shared/types'

/**
 * Props for the SkillSelectCard component.
 */
export interface SkillSelectCardProps {
  /** The skill data to display. */
  skill: Skill
  /** The localized display name of the skill's category. */
  categoryName: string
  /** Whether the skill is currently checked/selected. */
  isSelected: boolean
  /** Callback fired when the selection state is toggled. */
  onToggle: () => void
  /** Whether the skill is installed (shows "Installed" tag). */
  isInstalled?: boolean
  /** Callback fired when the preview button is clicked. */
  onPreview?: () => void
}

function skillsEqual(a: Skill, b: Skill): boolean {
  if (a.name !== b.name) return false
  if (a.description !== b.description) return false
  if (a.category !== b.category) return false
  if (a.path !== b.path) return false
  if (a.contentHash !== b.contentHash) return false
  if (a.author !== b.author) return false
  if (a.version !== b.version) return false
  if (a.files.length !== b.files.length) return false
  for (let i = 0; i < a.files.length; i++) {
    if (a.files[i] !== b.files[i]) return false
  }
  return true
}

function areSkillSelectCardPropsEqual(prev: SkillSelectCardProps, next: SkillSelectCardProps): boolean {
  if (!skillsEqual(prev.skill, next.skill)) return false
  if (prev.categoryName !== next.categoryName) return false
  if (prev.isSelected !== next.isSelected) return false
  if (prev.isInstalled !== next.isInstalled) return false
  if (prev.onToggle !== next.onToggle) return false
  if (prev.onPreview !== next.onPreview) return false
  return true
}

/**
 * Card row used on Select Skills page.
 *
 * @param props - Component props containing skill metadata and selection state handlers.
 * @returns Selectable skill card with checkbox.
 *
 * @see {@link SkillSelectCardProps} for available props.
 *
 * @example
 * ```tsx
 * <SkillSelectCard
 *   skill={mySkill}
 *   categoryName="Utilities"
 *   isSelected={true}
 *   onToggle={() => handleToggle(mySkill.name)}
 * />
 * ```
 */
export const SkillSelectCard = memo(function SkillSelectCard({
  skill,
  categoryName,
  isSelected,
  onToggle,
  isInstalled = false,
  onPreview,
}: SkillSelectCardProps) {
  const inputId = `skill-select-${skill.name}`
  const descriptionId = `${inputId}-description`
  const selectLabel = `Select ${skill.name}`

  return (
    <label className={`skill-select-card ${isSelected ? 'skill-select-card--selected' : ''}`} htmlFor={inputId}>
      <div className="skill-select-card-header">
        <p>{skill.name}</p>
        <div className="skill-select-card-header-end">
          {onPreview && (
            <button
              type="button"
              className="skill-select-card-preview-btn"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onPreview()
              }}
              aria-label={`Preview ${skill.name}`}
            >
              <span className="codicon codicon-eye" aria-hidden="true" />
            </button>
          )}
          {isInstalled && <span className="skill-select-card-tag skill-select-card-tag--installed">Installed</span>}
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
      <p id={descriptionId} className="skill-select-card-description">
        {skill.description}
      </p>
      <div className="skill-select-card-meta">
        <span className="skill-select-card-meta-author">{skill.author ?? 'Unknown author'}</span>
        <span className="skill-select-card-meta-divider" aria-hidden="true" />
        <span className="skill-select-card-meta-version">{skill.version ? `v${skill.version}` : 'no version'}</span>
      </div>
    </label>
  )
}, areSkillSelectCardPropsEqual)
