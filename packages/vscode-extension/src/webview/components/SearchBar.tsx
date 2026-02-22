/**
 * Props for the top-level search input in the sidebar.
 */
export interface SearchBarProps {
  value: string
  onChange: (query: string) => void
  resultCount: number
  placeholder?: string
  ariaLabel?: string
  resultLabel?: string
}

/**
 * Sticky search input for filtering skills by keyword.
 * Uses VS Code native input styling and includes screen reader announcements.
 *
 * @param props - Search value, change callback, and visible result count.
 * @returns Rendered search input with clear action and SR announcement.
 */
export function SearchBar({
  value,
  onChange,
  resultCount,
  placeholder = 'Search skills...',
  ariaLabel = 'Search skills',
  resultLabel = 'skill',
}: SearchBarProps) {
  const handleClear = () => {
    onChange('')
  }

  let resultAnnouncement = ''
  if (value) {
    const pluralSuffix = resultCount === 1 ? '' : 's'
    resultAnnouncement = `${resultCount} ${resultLabel}${pluralSuffix} found`
  }

  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <input
          type="search"
          className="search-input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={ariaLabel}
        />
        {value && (
          <button className="search-clear-button" onClick={handleClear} aria-label="Clear search" title="Clear search">
            ×
          </button>
        )}
      </div>
      {/* Screen reader announcement for result count */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {resultAnnouncement}
      </div>
    </div>
  )
}
