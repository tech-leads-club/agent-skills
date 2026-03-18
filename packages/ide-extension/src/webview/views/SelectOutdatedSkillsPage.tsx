import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CategoryOption, OutdatedSkillsInput } from '../../services/selection-selectors'
import type { InstalledSkillsMap, LifecycleScope, Skill, SkillRegistry } from '../../shared/types'
import { SkillSelectCard } from '../components/SkillSelectCard'
import { SkillSelectionToolbar } from '../components/SkillSelectionToolbar'
import { useFilteredSkills } from '../hooks/useFilteredSkills'

export interface SelectOutdatedSkillsPageProps {
  registry: SkillRegistry
  installedSkills: InstalledSkillsMap
  effectiveScopes: LifecycleScope[]
  selectedSkills: string[]
  getCategoryOptions: (registry: SkillRegistry) => CategoryOption[]
  getOutdatedSkills: (input: OutdatedSkillsInput) => Skill[]
  onToggleSkill: (skillName: string) => void
  onSelectAll: (skills: string[]) => void
  onClear: () => void
  onCancel: () => void
  onUpdate: (skills: string[]) => void
}

export function SelectOutdatedSkillsPage({
  registry,
  installedSkills,
  effectiveScopes,
  selectedSkills,
  getCategoryOptions,
  getOutdatedSkills,
  onToggleSkill,
  onSelectAll,
  onClear,
  onCancel,
  onUpdate,
}: SelectOutdatedSkillsPageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('all')

  const outdatedSkills = useMemo(
    () => getOutdatedSkills({ registry, installedSkills, effectiveScopes }),
    [effectiveScopes, getOutdatedSkills, installedSkills, registry],
  )
  const categoryOptions = useMemo(() => getCategoryOptions(registry), [getCategoryOptions, registry])
  const visibleSkills = useFilteredSkills({
    skills: outdatedSkills,
    registry,
    searchQuery,
    selectedCategoryId,
  })

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
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleToggleAllVisible, onCancel])

  const handleUpdate = useCallback(() => {
    onUpdate(selectedSkills)
  }, [onUpdate, selectedSkills])

  return (
    <section className="select-page" aria-label="Update: select outdated skills">
      <header className="select-page-header">
        <button type="button" className="icon-button" onClick={onCancel} aria-label="Cancel">
          <span className="codicon codicon-arrow-left" aria-hidden="true" />
        </button>
        <div>
          <h1>Update: Select Skills</h1>
          <p>
            {outdatedSkills.length === 0
              ? 'All installed skills are up to date. You can still run update to verify.'
              : 'Select skills to update. Leave empty to update all outdated.'}
          </p>
        </div>
      </header>

      <SkillSelectionToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryOptions={categoryOptions}
        selectedCategoryId={selectedCategoryId}
        onCategoryChange={setSelectedCategoryId}
        resultCount={visibleSkills.length}
        selectedCount={selectedSkills.length}
        allSelected={allVisibleSelected}
        onToggleAll={handleToggleAllVisible}
        onClear={onClear}
      />

      <div className="select-page-list" aria-label="Outdated skills list">
        {visibleSkills.length === 0 ? (
          <div className="select-page-empty" role="status">
            <p>
              {outdatedSkills.length === 0
                ? 'All installed skills are up to date.'
                : 'No skills match the current filters.'}
            </p>
          </div>
        ) : (
          visibleSkills.map((skill) => (
            <SkillSelectCard
              key={skill.name}
              skill={skill}
              categoryName={registry.categories[skill.category]?.name ?? skill.category}
              isSelected={selectedSkills.includes(skill.name)}
              onToggle={() => onToggleSkill(skill.name)}
              isInstalled
            />
          ))
        )}
      </div>

      <footer className="select-page-footer">
        <div className="select-page-footer-actions">
          <button
            type="button"
            className="primary-footer-button primary-footer-button--install"
            onClick={handleUpdate}
            disabled={outdatedSkills.length === 0}
          >
            Update
          </button>
        </div>
      </footer>
    </section>
  )
}
