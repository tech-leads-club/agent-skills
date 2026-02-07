'use client'

import { useEffect, useState } from 'react'

const NPM_API_URL = 'https://api.npmjs.org/downloads/point/last-month/@tech-leads-club/agent-skills'

function formatNumber(num: number): string {
  return num.toLocaleString('en-US')
}

export function NpmDownloadsCard() {
  const [downloads, setDownloads] = useState<number | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(NPM_API_URL)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then((data) => setDownloads(data.downloads))
      .catch(() => setError(true))
  }, [])

  if (error) return null

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Downloads</p>
          {downloads !== null ? (
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{formatNumber(downloads)}</p>
          ) : (
            <div className="h-9 w-20 mt-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">last 30 days</p>
        </div>
        <div className="text-4xl opacity-20">⬇️</div>
      </div>
    </div>
  )
}
