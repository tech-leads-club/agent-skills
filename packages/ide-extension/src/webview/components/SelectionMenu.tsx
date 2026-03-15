/**
 * Props for the SelectionMenu component.
 */
export interface SelectionMenuProps {
  /** The total number of items currently selected. */
  selectedCount: number
  /** Whether all visible items are currently selected. */
  allSelected: boolean
  /** Callback fired to toggle the selection state of all visible items. */
  onToggleAll: () => void
  /** Callback fired to clear the current selection entirely. */
  onClear: () => void
}

/**
 * Displays shared bulk-selection controls for selection pages.
 *
 * @param props - Component props containing selection count and bulk selection callbacks.
 * @returns Selection toolbar with check-all and clear actions.
 *
 * @see {@link SelectionMenuProps} for available props.
 *
 * @example
 * ```tsx
 * <SelectionMenu
 *   selectedCount={5}
 *   allSelected={false}
 *   onToggleAll={() => toggleAll()}
 *   onClear={() => clearSelection()}
 * />
 * ```
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
