import { useMemo, useState } from 'react'

interface FilterOptions<T> {
  keys: (keyof T & string)[]
}

export function useFilter<T>(items: T[], options: FilterOptions<T>) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return items

    const tokens = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 0)

    return items.filter((item) => {
      const searchable = options.keys
        .map((key) => {
          const value = item[key]
          return typeof value === 'string' ? value.toLowerCase() : ''
        })
        .join(' ')

      return tokens.every((token) => searchable.includes(token))
    })
  }, [query, items, options.keys])

  return { query, setQuery, filtered, hasFilter: query.trim().length > 0 }
}
