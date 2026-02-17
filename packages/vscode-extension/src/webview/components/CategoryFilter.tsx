import type { Category } from '../../shared/types'

/**
 * Props driving the rendering of category filter chips.
 */
export interface CategoryFilterProps {
  categories: Array<{ key: string; category: Category }>
  activeCategory: string | null
  onSelect: (categoryKey: string | null) => void
  skillCounts: Record<string, number>
}

/**
 * Horizontal scrollable row of category filter chips.
 * Includes "All" chip and one chip per category with skill counts.
 *
 * @param props - Component props containing categories, active state, and callbacks.
 * @returns Rendered category filter controls.
 */
export function CategoryFilter({ categories, activeCategory, onSelect, skillCounts }: CategoryFilterProps) {
  const totalCount = Object.values(skillCounts).reduce((sum, count) => sum + count, 0)

  const handleChipClick = (key: string | null) => {
    // Toggle: if clicking active chip, deselect it
    if (key === activeCategory) {
      onSelect(null)
    } else {
      onSelect(key)
    }
  }

  return (
    <div className="category-filter">
      <div className="category-chips" role="group" aria-label="Filter by category">
        {/* "All" chip */}
        <button
          className={`category-chip ${activeCategory === null ? 'active' : ''}`}
          onClick={() => handleChipClick(null)}
          aria-pressed={activeCategory === null}
        >
          All ({totalCount})
        </button>

        {/* Category chips */}
        {categories.map(({ key, category }) => {
          const count = skillCounts[key] || 0
          const isActive = activeCategory === key

          return (
            <button
              key={key}
              className={`category-chip ${isActive ? 'active' : ''}`}
              onClick={() => handleChipClick(key)}
              aria-pressed={isActive}
            >
              {category.name} ({count})
            </button>
          )
        })}
      </div>
    </div>
  )
}
