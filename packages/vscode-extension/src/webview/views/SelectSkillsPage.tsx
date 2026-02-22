import Fuse from 'fuse.js'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { InstalledSkillsMap, LifecycleScope, SkillRegistry, WebviewAction } from '../../shared/types'
import { SearchBar } from '../components/SearchBar'
import { SelectionMenu } from '../components/SelectionMenu'
import { SkillSelectCard } from '../components/SkillSelectCard'

export interface SelectSkillsPageProps {
  action: WebviewAction
  registry: SkillRegistry
  installedSkills: InstalledSkillsMap
  scope: LifecycleScope
  selectedSkills: string[]
  onToggleSkill: (skillName: string) => void
  onSelectAll: (skills: string[]) => void
  onClear: () => void
  onBack: () => void
  onNext: () => void
}

function isInstalledForScope(installed: InstalledSkillsMap[string], scope: LifecycleScope): boolean {
  if (!installed) return false
  return scope === 'local' ? installed.local : installed.global
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
  scope,
  selectedSkills,
  onToggleSkill,
  onSelectAll,
  onClear,
  onBack,
  onNext,
}: SelectSkillsPageProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const candidateSkills = useMemo(() => {
    return registry.skills.filter((skill) => {
      const installed = isInstalledForScope(installedSkills[skill.name], scope)
      return action === 'install' ? !installed : installed
    })
  }, [action, installedSkills, registry.skills, scope])

  const fuseInstance = useMemo(
    () =>
      new Fuse(candidateSkills, {
        keys: ['name', 'description', 'category'],
        threshold: 0.3,
      }),
    [candidateSkills],
  )

  const visibleSkills = useMemo(() => {
    if (!searchQuery.trim()) return candidateSkills
    return fuseInstance.search(searchQuery).map((result) => result.item)
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
        <button className="primary-footer-button" onClick={onNext} disabled={selectedSkills.length === 0}>
          Select Agents
          <span className="codicon codicon-arrow-right" aria-hidden="true" />
        </button>
      </footer>
    </section>
  )
}
