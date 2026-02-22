export interface SelectionMenuProps {
  selectedCount: number
  allSelected: boolean
  onToggleAll: () => void
  onClear: () => void
}

/**
 * Displays shared bulk-selection controls for selection pages.
 *
 * @param props - Selection count and bulk selection callbacks.
 * @returns Selection toolbar with check-all and clear actions.
 */
export function SelectionMenu({ selectedCount, allSelected, onToggleAll, onClear }: SelectionMenuProps) {
  return (
    <div className="selection-menu" role="toolbar" aria-label="Selection actions">
      <button className="selection-menu-button" onClick={onToggleAll}>
        {allSelected ? 'Uncheck All' : 'Check All'}
      </button>
      <span className="selection-menu-count" aria-live="polite" aria-atomic="true">
        {selectedCount} selected
      </span>
      <button className="selection-menu-clear" onClick={onClear} disabled={selectedCount === 0}>
        Clear Selection
      </button>
    </div>
  )
}
