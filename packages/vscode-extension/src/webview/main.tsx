import Fuse from 'fuse.js'
import { StrictMode, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { ExtensionMessage } from '../shared/messages'
import type { SkillRegistry } from '../shared/types'
import { CategoryFilter } from './components/CategoryFilter'
import { SearchBar } from './components/SearchBar'
import { SkillGrid } from './components/SkillGrid'
import './index.css'
import { onMessage, postMessage } from './lib/vscode-api'

type AppStatus = 'loading' | 'ready' | 'error' | 'offline'

function App() {
  const [version, setVersion] = useState<string | null>(null)
  const [registry, setRegistry] = useState<SkillRegistry | null>(null)
  const [status, setStatus] = useState<AppStatus>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  useEffect(() => {
    // Listen for messages from Extension Host
    const dispose = onMessage((msg: ExtensionMessage) => {
      switch (msg.type) {
        case 'initialize':
          setVersion(msg.payload.version)
          break
        case 'registryUpdate':
          setStatus(msg.payload.status)
          setRegistry(msg.payload.registry)
          setErrorMessage(msg.payload.errorMessage || null)
          setFromCache(msg.payload.fromCache || false)
          break
      }
    })

    // Signal readiness to Extension Host
    postMessage({ type: 'webviewDidMount' })

    return dispose
  }, [])

  // Fuse.js instance for fuzzy search
  const fuseInstance = useMemo(() => {
    if (!registry) return null
    return new Fuse(registry.skills, {
      keys: ['name', 'description'],
      threshold: 0.3,
      includeScore: true,
    })
  }, [registry])

  // Filtered skills based on search query and category
  const filteredSkills = useMemo(() => {
    let result = registry?.skills ?? []

    // Apply category filter first
    if (activeCategory) {
      result = result.filter((s) => s.category === activeCategory)
    }

    // Apply search filter with Fuse.js
    if (searchQuery.trim() && fuseInstance) {
      const searchResults = fuseInstance.search(searchQuery).map((r) => r.item)
      // If category is active, intersect the two filters
      if (activeCategory) {
        result = result.filter((s) => searchResults.includes(s))
      } else {
        result = searchResults
      }
    }

    return result
  }, [registry, activeCategory, searchQuery, fuseInstance])

  // Skill counts per category (for filter chips)
  const skillCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    registry?.skills.forEach((skill) => {
      counts[skill.category] = (counts[skill.category] || 0) + 1
    })
    return counts
  }, [registry])

  // Category list for filter
  const categories = useMemo(() => {
    if (!registry) return []
    return Object.entries(registry.categories).map(([key, category]) => ({ key, category }))
  }, [registry])

  const handleRefresh = () => {
    postMessage({ type: 'requestRefresh' })
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setActiveCategory(null)
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="app">
        <h1>Agent Skills</h1>
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading skills...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="app">
        <h1>Agent Skills</h1>
        <div className="error-state">
          <p className="error-message">{errorMessage || 'Failed to load skill registry'}</p>
          <button className="retry-button" onClick={handleRefresh}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Ready/Offline state with data
  return (
    <div className="app">
      <header className="app-header">
        <h1>Agent Skills</h1>
        {version && <span className="version-badge">v{version}</span>}
        {fromCache && status === 'offline' && (
          <div className="offline-banner" role="status">
            Offline — showing cached data
          </div>
        )}
      </header>

      {registry && (
        <>
          <SearchBar value={searchQuery} onChange={setSearchQuery} resultCount={filteredSkills.length} />

          <CategoryFilter
            categories={categories}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
            skillCounts={skillCounts}
          />

          {filteredSkills.length === 0 && (searchQuery || activeCategory) ? (
            <div className="empty-state">
              <p>No skills match your search</p>
              <button className="clear-button" onClick={handleClearSearch}>
                Clear filters
              </button>
            </div>
          ) : (
            <SkillGrid skills={filteredSkills} categories={registry.categories} />
          )}
        </>
      )}

      {!registry && (
        <div className="empty-state">
          <p>No skills available in the registry</p>
        </div>
      )}
    </div>
  )
}

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
