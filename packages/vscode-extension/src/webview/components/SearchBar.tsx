export interface SearchBarProps {
  value: string
  onChange: (query: string) => void
  resultCount: number
}

/**
 * Sticky search input for filtering skills by keyword.
 * Uses VS Code native input styling and includes screen reader announcements.
 */
export function SearchBar({ value, onChange, resultCount }: SearchBarProps) {
  const handleClear = () => {
    onChange('')
  }

  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <input
          type="search"
          className="search-input"
          placeholder="Search skills..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Search skills"
        />
        {value && (
          <button className="search-clear-button" onClick={handleClear} aria-label="Clear search" title="Clear search">
            ×
          </button>
        )}
      </div>
      {/* Screen reader announcement for result count */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {value ? `${resultCount} skill${resultCount === 1 ? '' : 's'} found` : ''}
      </div>
    </div>
  )
}
