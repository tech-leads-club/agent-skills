import Fuse from 'fuse.js'
import { StrictMode, useCallback, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { ExtensionMessage, ScopePolicyStatePayload } from '../shared/messages'
import type { AvailableAgent, Category, InstalledSkillsMap, Skill, SkillRegistry } from '../shared/types'
import { CategoryFilter } from './components/CategoryFilter'
import { RestrictedModeBanner } from './components/RestrictedModeBanner'
import { SearchBar } from './components/SearchBar'
import { SkillGrid } from './components/SkillGrid'
import { useInstalledState } from './hooks/useInstalledState'
import { useOperations } from './hooks/useOperations'
import './index.css'
import { onMessage, postMessage } from './lib/vscode-api'

type AppStatus = 'loading' | 'ready' | 'error' | 'offline'

/**
 * Renders the loading state shown while registry data is being fetched.
 *
 * @returns Loading UI for the skills view.
 */
function LoadingState() {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <p>Loading skills...</p>
    </div>
  )
}

/**
 * Renders an error state with a retry action.
 *
 * @param props - Error message and retry callback.
 * @returns Error UI for failed registry loading.
 */
function ErrorState({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div className="error-state">
      <p className="error-message">{message || 'Failed to load skill registry'}</p>
      <button className="retry-button" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}

/**
 * Renders the empty state shown when no registry payload is available.
 *
 * @returns Empty-state UI for missing registry data.
 */
function NoRegistryState() {
  return (
    <div className="empty-state">
      <p>No skills available in the registry</p>
    </div>
  )
}

interface RegistryContentProps {
  registry: SkillRegistry
  filteredSkills: Skill[]
  categories: Array<{ key: string; category: Category }>
  skillCounts: Record<string, number>
  searchQuery: string
  activeCategory: string | null
  onSearchChange: (value: string) => void
  onCategorySelect: (value: string | null) => void
  installedSkills: InstalledSkillsMap
  isOperating: (skillName: string) => boolean
  getOperationMessage: (skillName: string) => string | undefined
  availableAgents: AvailableAgent[]
  hasWorkspace: boolean
  onMarkPending: (skillName: string, action: 'add' | 'remove' | 'repair') => void
  onRepair: (skillName: string, agents: string[], scope: 'local' | 'global') => void
  onClearSearch: () => void
  isLifecycleBlocked: boolean
}

/**
 * Renders search/filter controls and the resulting skill list.
 *
 * @param props - Registry data, filtered view state, and UI callbacks.
 * @returns Registry content section with filters and skill grid.
 */
function RegistryContent({
  registry,
  filteredSkills,
  categories,
  skillCounts,
  searchQuery,
  activeCategory,
  onSearchChange,
  onCategorySelect,
  installedSkills,
  isOperating,
  getOperationMessage,
  availableAgents,
  hasWorkspace,
  onMarkPending,
  onRepair,
  onClearSearch,
  isLifecycleBlocked,
}: RegistryContentProps) {
  return (
    <>
      <SearchBar value={searchQuery} onChange={onSearchChange} resultCount={filteredSkills.length} />

      <CategoryFilter
        categories={categories}
        activeCategory={activeCategory}
        onSelect={onCategorySelect}
        skillCounts={skillCounts}
      />

      {filteredSkills.length === 0 && (searchQuery || activeCategory) ? (
        <div className="empty-state">
          <p>No skills match your search</p>
          <button className="clear-button" onClick={onClearSearch}>
            Clear filters
          </button>
        </div>
      ) : (
        <SkillGrid
          skills={filteredSkills}
          categories={registry.categories}
          installedSkills={installedSkills}
          isOperating={isOperating}
          getOperationMessage={getOperationMessage}
          availableAgents={availableAgents}
          hasWorkspace={hasWorkspace}
          onMarkPending={onMarkPending}
          onRepair={onRepair}
          isLifecycleBlocked={isLifecycleBlocked}
        />
      )}
    </>
  )
}

/**
 * Root webview application component.
 *
 * @returns Sidebar app UI with state-driven content.
 */
function App() {
  const [registry, setRegistry] = useState<SkillRegistry | null>(null)
  const [status, setStatus] = useState<AppStatus>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [availableAgents, setAvailableAgents] = useState<AvailableAgent[]>([])
  const [hasWorkspace, setHasWorkspace] = useState(false)
  const [isTrusted, setIsTrusted] = useState(true)
  const [policy, setPolicy] = useState<ScopePolicyStatePayload | null>(null)

  const { installedSkills } = useInstalledState()
  const { isOperating, getMessage: getOperationMessage, markPending } = useOperations()

  const handleRefresh = useCallback(() => {
    postMessage({ type: 'requestRefresh' })
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setActiveCategory(null)
  }, [])

  const handleRepair = useCallback((skillName: string, agents: string[], scope: 'local' | 'global') => {
    postMessage({
      type: 'repairSkill',
      payload: { skillName, agents, scope },
    })
  }, [])

  useEffect(() => {
    const dispose = onMessage((msg: ExtensionMessage) => {
      switch (msg.type) {
        case 'initialize':
          setAvailableAgents(msg.payload.availableAgents)
          setHasWorkspace(msg.payload.hasWorkspace)
          break
        case 'registryUpdate':
          setStatus(msg.payload.status as AppStatus)
          setRegistry(msg.payload.registry)
          setErrorMessage(msg.payload.errorMessage || null)
          setFromCache(msg.payload.fromCache || false)
          break
        case 'trustState':
          setIsTrusted(msg.payload.isTrusted)
          break
        case 'policyState':
          setPolicy(msg.payload)
          break
      }
    })

    postMessage({ type: 'webviewDidMount' })
    return dispose
  }, [])

  const fuseInstance = useMemo(() => {
    if (!registry) return null
    return new Fuse(registry.skills, {
      keys: ['name', 'description'],
      threshold: 0.3,
      includeScore: true,
    })
  }, [registry])

  const filteredSkills = useMemo(() => {
    let result = registry?.skills ?? []

    if (activeCategory) {
      result = result.filter((s) => s.category === activeCategory)
    }

    if (searchQuery.trim() && fuseInstance) {
      const searchResults = fuseInstance.search(searchQuery).map((r) => r.item)
      if (activeCategory) {
        result = result.filter((s) => searchResults.includes(s))
      } else {
        result = searchResults
      }
    }

    return result
  }, [registry, activeCategory, searchQuery, fuseInstance])

  const skillCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    registry?.skills.forEach((skill) => {
      counts[skill.category] = (counts[skill.category] || 0) + 1
    })
    return counts
  }, [registry])

  const categories = useMemo(() => {
    if (!registry) return []
    return Object.entries(registry.categories).map(([key, category]) => ({ key, category }))
  }, [registry])

  const statusContent = useMemo(() => {
    if (status === 'loading') {
      return <LoadingState />
    }
    if (status === 'error') {
      return <ErrorState message={errorMessage} onRetry={handleRefresh} />
    }
    return null
  }, [status, errorMessage, handleRefresh])

  const offlineBanner =
    fromCache && status === 'offline' ? (
      <div className="offline-banner" role="status">
        Offline — showing cached data
      </div>
    ) : null

  const isLifecycleBlocked = policy?.effectiveScopes.length === 0

  if (statusContent) {
    return <div className="app">{statusContent}</div>
  }

  return (
    <div className="app">
      <header className="app-header">
        <RestrictedModeBanner visible={!isTrusted} />
        {offlineBanner}
      </header>
      {registry ? (
        <RegistryContent
          registry={registry}
          filteredSkills={filteredSkills}
          categories={categories}
          skillCounts={skillCounts}
          searchQuery={searchQuery}
          activeCategory={activeCategory}
          onSearchChange={setSearchQuery}
          onCategorySelect={setActiveCategory}
          installedSkills={installedSkills}
          isOperating={isOperating}
          getOperationMessage={getOperationMessage}
          availableAgents={availableAgents}
          hasWorkspace={hasWorkspace}
          onMarkPending={markPending}
          onRepair={handleRepair}
          onClearSearch={handleClearSearch}
          isLifecycleBlocked={isLifecycleBlocked}
        />
      ) : (
        <NoRegistryState />
      )}
      {isLifecycleBlocked && (
        <div
          className="footer-warning"
          style={{
            backgroundColor: 'var(--vscode-inputValidation-warningBackground)',
            color: 'var(--vscode-inputValidation-warningForeground)',
            padding: '8px',
            borderTop: '1px solid var(--vscode-inputValidation-warningBorder)',
            fontSize: '12px',
          }}
        >
          Lifecycle actions are disabled: {policy?.blockedReason}
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
