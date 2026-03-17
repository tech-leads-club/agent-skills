import type { CategoryOption } from '../../services/selection-selectors'

export interface CategoryFilterProps {
  options: CategoryOption[]
  value: string
  onChange: (categoryId: string) => void
}

export function CategoryFilter({ options, value, onChange }: CategoryFilterProps) {
  return (
    <label className="category-filter">
      <span className="category-filter-label">Category</span>
      <select
        className="category-filter-select"
        aria-label="Filter by category"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
