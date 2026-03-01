/**
 * Props for the top-level search input in the sidebar.
 */
export interface SearchBarProps {
  /** The current search query string. */
  value: string
  /** Callback fired when the search query changes. */
  onChange: (query: string) => void
  /** The number of results found for the current query. */
  resultCount: number
  /** Placeholder text for the input field. @defaultValue 'Search skills...' */
  placeholder?: string
  /** ARIA label for the input field. @defaultValue 'Search skills' */
  ariaLabel?: string
  /** Label for screen reader result count announcements. @defaultValue 'skill' */
  resultLabel?: string
}

/**
 * Sticky search input for filtering skills by keyword.
 * Uses VS Code native input styling and includes screen reader announcements.
 *
 * @param props - Component props.
 * @returns Rendered search input with clear action and SR announcement.
 *
 * @see {@link SearchBarProps} for available props.
 *
 * @example
 * ```tsx
 * <SearchBar
 *   value={searchQuery}
 *   onChange={(query) => setQuery(query)}
 *   resultCount={12}
 *   placeholder="Search skills..."
 * />
 * ```
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
          <button
            type="button"
            className="search-clear-button"
            onClick={handleClear}
            aria-label="Clear search"
            title="Clear search"
          >
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
