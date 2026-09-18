'use client'

import { useEffect, useRef, useState } from 'react'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  initialValue?: string
}

export function SearchBar({ onSearch, placeholder = 'Search skills...', initialValue = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastInitialValue = useRef(initialValue)

  // why: the hub reads `?search=` after mount, so the prop arrives late; without this sync the
  // input renders empty while the results below it are already filtered.
  useEffect(() => {
    if (initialValue !== lastInitialValue.current) {
      lastInitialValue.current = initialValue
      setQuery(initialValue)
    }
  }, [initialValue])

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query)
    }, 200)

    return () => clearTimeout(timer)
  }, [query, onSearch])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typingElsewhere = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
      const isSlash = event.key === '/' && !typingElsewhere
      const isCommandK = event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)
      if (isSlash || isCommandK) {
        event.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="relative w-full">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        ref={inputRef}
        type="search"
        role="searchbox"
        aria-label="Search skills"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && query !== '') {
            e.preventDefault()
            setQuery('')
          }
        }}
        placeholder={placeholder}
        className="w-full py-3.5 pl-12 pr-20 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-[15px] [&::-webkit-search-cancel-button]:hidden"
      />
      {query === '' ? (
        <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:block px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 text-[11px] text-gray-400 dark:text-gray-500 pointer-events-none">
          /
        </kbd>
      ) : (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setQuery('')
            inputRef.current?.focus()
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
