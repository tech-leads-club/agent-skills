import type { Skill } from '../../shared/types'

export interface SkillCardProps {
  skill: Skill
  categoryName: string
}

/**
 * Card component for displaying a single skill.
 * Shows name, description (truncated to 2 lines), category badge, author, and version.
 * Keyboard accessible with Tab navigation and Enter/Space activation.
 */
export function SkillCard({ skill, categoryName }: SkillCardProps) {
  const ariaLabel = `${skill.name}. ${skill.description}. Category: ${categoryName}.${
    skill.author ? ` By ${skill.author}.` : ''
  }${skill.version ? ` Version ${skill.version}.` : ''}`

  const handleClick = () => {
    // TODO: In M3 (Lifecycle Management), this will navigate to skill details or trigger installation
    console.log('Skill clicked:', skill.name)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <div
      className="skill-card"
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="skill-card-header">
        <h3 className="skill-card-title">{skill.name}</h3>
        <span className="skill-card-category-badge">{categoryName}</span>
      </div>
      <p className="skill-card-description">{skill.description}</p>
      <div className="skill-card-meta">
        {skill.author && <span className="skill-card-author">by {skill.author}</span>}
        {skill.version && <span className="skill-card-version">v{skill.version}</span>}
      </div>
    </div>
  )
}
