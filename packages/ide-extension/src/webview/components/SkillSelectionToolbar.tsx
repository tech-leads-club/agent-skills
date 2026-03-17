import type { CategoryOption } from '../../services/selection-selectors'
import { CategoryFilter } from './CategoryFilter'
import { SearchBar } from './SearchBar'
import { SelectionMenu } from './SelectionMenu'

export interface SkillSelectionToolbarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  categoryOptions: CategoryOption[]
  selectedCategoryId: string
  onCategoryChange: (categoryId: string) => void
  resultCount: number
  selectedCount: number
  allSelected: boolean
  onToggleAll: () => void
  onClear: () => void
}

export function SkillSelectionToolbar({
  searchQuery,
  onSearchChange,
  categoryOptions,
  selectedCategoryId,
  onCategoryChange,
  resultCount,
  selectedCount,
  allSelected,
  onToggleAll,
  onClear,
}: SkillSelectionToolbarProps) {
  return (
    <>
      <SearchBar value={searchQuery} onChange={onSearchChange} resultCount={resultCount} />
      <CategoryFilter options={categoryOptions} value={selectedCategoryId} onChange={onCategoryChange} />
      <SelectionMenu
        selectedCount={selectedCount}
        allSelected={allSelected}
        onToggleAll={onToggleAll}
        onClear={onClear}
      />
    </>
  )
}
