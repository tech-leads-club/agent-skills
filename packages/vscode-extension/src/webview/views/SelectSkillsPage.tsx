import Fuse from 'fuse.js'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  AvailableAgent,
  InstalledSkillsMap,
  LifecycleScope,
  SkillRegistry,
  WebviewAction,
} from '../../shared/types'
import { SearchBar } from '../components/SearchBar'
import { SelectionMenu } from '../components/SelectionMenu'
import { SkillSelectCard } from '../components/SkillSelectCard'

/**
 * Props for the SelectSkillsPage component.
 */
export interface SelectSkillsPageProps {
  action: WebviewAction
  registry: SkillRegistry
  installedSkills: InstalledSkillsMap
  allAgents?: AvailableAgent[]
  scope: LifecycleScope
  selectedSkills: string[]
  onToggleSkill: (skillName: string) => void
  onSelectAll: (skills: string[]) => void
  onClear: () => void
  onBack: () => void
  onCancel?: () => void
  onNext: () => void
}

/**
 * Searchable wrapper for skills.
 */
interface SearchableSkillEntry {
  skill: SkillRegistry['skills'][number]
  categoryName: string
  authorName: string
}

/**
 * Checks if a skill is installed in the given scope.
 *
 * @param installed - Installation info for a skill.
 * @param scope - Scope to check.
 * @returns True if installed.
 */
function isInstalledForScope(installed: InstalledSkillsMap[string], scope: LifecycleScope): boolean {
  if (!installed) return false
  return scope === 'local' ? installed.local : installed.global
}

/**
 * Checks if a skill is installed across all provided agents in the given scope.
 *
 * @param installed - Installation info for a skill.
 * @param allAgents - List of all agents to check.
 * @param scope - Scope to check.
 * @returns True if installed.
 */
function isInstalledForAllAgents(
  installed: InstalledSkillsMap[string],
  allAgents: AvailableAgent[],
  scope: LifecycleScope,
): boolean {
  if (!installed) return false
  if (allAgents.length === 0) return isInstalledForScope(installed, scope)

  return allAgents.every((agent) => {
    const installInfo = installed.agents.find((entry) => entry.agent === agent.agent)
    if (!installInfo) return false
    return scope === 'local' ? installInfo.local : installInfo.global
  })
}

/**
 * Skills page for searching and selecting skills for a batch action.
 *
 * @param props - Selection context and callbacks for skill selection flow.
 * @returns Skills selection view.
 */
export function SelectSkillsPage({
  action,
  registry,
  installedSkills,
  allAgents = [],
  scope,
  selectedSkills,
  onToggleSkill,
  onSelectAll,
  onClear,
  onBack,
  onCancel = onBack,
  onNext,
}: SelectSkillsPageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const nextStepActionClassName =
    action === 'uninstall' ? 'primary-footer-button--uninstall' : 'primary-footer-button--install'

  const candidateSkills = useMemo(() => {
    return registry.skills.filter((skill) => {
      const installed =
        action === 'install'
          ? isInstalledForAllAgents(installedSkills[skill.name], allAgents, scope)
          : isInstalledForScope(installedSkills[skill.name], scope)
      return action === 'install' ? !installed : installed
    })
  }, [action, allAgents, installedSkills, registry.skills, scope])

  const searchableSkills = useMemo<SearchableSkillEntry[]>(
    () =>
      candidateSkills.map((skill) => ({
        skill,
        categoryName: registry.categories[skill.category]?.name ?? skill.category,
        authorName: skill.author ?? '',
      })),
    [candidateSkills, registry.categories],
  )

  const fuseInstance = useMemo(
    () =>
      new Fuse(searchableSkills, {
        keys: ['skill.name', 'skill.description', 'skill.category', 'categoryName', 'authorName'],
        threshold: 0.3,
        ignoreLocation: true,
      }),
    [searchableSkills],
  )

  const visibleSkills = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim()
    if (!normalizedSearchQuery) return candidateSkills
    return fuseInstance.search(normalizedSearchQuery).map((result) => result.item.skill)
  }, [candidateSkills, fuseInstance, searchQuery])

  const visibleSkillNames = useMemo(() => visibleSkills.map((skill) => skill.name), [visibleSkills])

  const allVisibleSelected =
    visibleSkillNames.length > 0 && visibleSkillNames.every((skillName) => selectedSkills.includes(skillName))

  const handleToggleAllVisible = useCallback(() => {
    if (allVisibleSelected) {
      onSelectAll(selectedSkills.filter((skillName) => !visibleSkillNames.includes(skillName)))
      return
    }

    onSelectAll([...new Set([...selectedSkills, ...visibleSkillNames])])
  }, [allVisibleSelected, onSelectAll, selectedSkills, visibleSkillNames])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
        event.preventDefault()
        handleToggleAllVisible()
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        onBack()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleToggleAllVisible, onBack])

  return (
    <section className="select-page" aria-label="Select skills page">
      <header className="select-page-header">
        <button className="icon-button" onClick={onBack} aria-label="Back to home">
          <span className="codicon codicon-arrow-left" aria-hidden="true" />
        </button>
        <div>
          <h1>{action === 'install' ? 'Install: Select Skills' : 'Uninstall: Select Skills'}</h1>
          <p>Select the skills you want to continue with.</p>
        </div>
      </header>

      <SearchBar value={searchQuery} onChange={setSearchQuery} resultCount={visibleSkills.length} />

      <SelectionMenu
        selectedCount={selectedSkills.length}
        allSelected={allVisibleSelected}
        onToggleAll={handleToggleAllVisible}
        onClear={onClear}
      />

      <div className="select-page-list" aria-label="Skills list">
        {visibleSkills.map((skill) => (
          <SkillSelectCard
            key={skill.name}
            skill={skill}
            categoryName={registry.categories[skill.category]?.name ?? skill.category}
            isSelected={selectedSkills.includes(skill.name)}
            onToggle={() => onToggleSkill(skill.name)}
          />
        ))}
      </div>

      <footer className="select-page-footer">
        <div className="select-page-footer-actions">
          <button className="secondary-footer-button" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`primary-footer-button ${nextStepActionClassName}`}
            onClick={onNext}
            disabled={selectedSkills.length === 0}
          >
            Select Agents
            <span className="codicon codicon-arrow-right" aria-hidden="true" />
          </button>
        </div>
      </footer>
    </section>
  )
}
