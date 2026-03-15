import Fuse from 'fuse.js'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  InstalledSkillsMap,
  LifecycleScope,
  SkillRegistry,
} from '../../shared/types'
import { SearchBar } from '../components/SearchBar'
import { SelectionMenu } from '../components/SelectionMenu'
import { SkillSelectCard } from '../components/SkillSelectCard'

/**
 * Props for the SelectOutdatedSkillsPage component.
 */
export interface SelectOutdatedSkillsPageProps {
  /** The skill registry instance. */
  registry: SkillRegistry
  /** Map of currently installed skills with content hashes. */
  installedSkills: InstalledSkillsMap
  /** Effective scopes from policy (workspaceOnly: local when workspace, global always). */
  effectiveScopes: LifecycleScope[]
  /** Names of the skills currently selected. */
  selectedSkills: string[]
  /** Callback to toggle skill selection. */
  onToggleSkill: (skillName: string) => void
  /** Callback to select all visible skills. */
  onSelectAll: (skills: string[]) => void
  /** Callback to clear selection. */
  onClear: () => void
  /** Callback to cancel and return to dashboard. */
  onCancel: () => void
  /** Callback to execute update and go to status. */
  onUpdate: (skills: string[]) => void
}

function isOutdated(
  skill: SkillRegistry['skills'][number],
  installed: InstalledSkillsMap[string],
  effectiveScopes: LifecycleScope[],
): boolean {
  if (!installed || !skill.contentHash) return false

  const hasLocal = installed.local && effectiveScopes.includes('local')
  const hasGlobal = installed.global && effectiveScopes.includes('global')
  if (!hasLocal && !hasGlobal) return false

  const localHash = installed.contentHash
  return localHash !== skill.contentHash || localHash === undefined
}

/**
 * Update flow: select outdated skills, then execute update.
 *
 * @param props - Selection context and callbacks.
 * @returns Outdated skills selection view.
 */
export function SelectOutdatedSkillsPage({
  registry,
  installedSkills,
  effectiveScopes,
  selectedSkills,
  onToggleSkill,
  onSelectAll,
  onClear,
  onCancel,
  onUpdate,
}: SelectOutdatedSkillsPageProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const outdatedSkills = useMemo(() => {
    return registry.skills.filter((skill) =>
      isOutdated(skill, installedSkills[skill.name], effectiveScopes),
    )
  }, [registry.skills, installedSkills, effectiveScopes])

  const searchableSkills = useMemo(
    () =>
      outdatedSkills.map((skill) => ({
        skill,
        categoryName: registry.categories[skill.category]?.name ?? skill.category,
        authorName: skill.author ?? '',
      })),
    [outdatedSkills, registry.categories],
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
    const q = searchQuery.trim()
    if (!q) return outdatedSkills
    return fuseInstance.search(q).map((r) => r.item.skill)
  }, [outdatedSkills, fuseInstance, searchQuery])

  const visibleSkillNames = useMemo(() => visibleSkills.map((s) => s.name), [visibleSkills])
  const allVisibleSelected =
    visibleSkillNames.length > 0 && visibleSkillNames.every((n) => selectedSkills.includes(n))

  const handleToggleAllVisible = useCallback(() => {
    if (allVisibleSelected) {
      onSelectAll(selectedSkills.filter((n) => !visibleSkillNames.includes(n)))
    } else {
      onSelectAll([...new Set([...selectedSkills, ...visibleSkillNames])])
    }
  }, [allVisibleSelected, onSelectAll, selectedSkills, visibleSkillNames])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        handleToggleAllVisible()
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleToggleAllVisible, onCancel])

  const handleUpdate = useCallback(() => {
    const toUpdate = selectedSkills.length > 0 ? selectedSkills : outdatedSkills.map((s) => s.name)
    onUpdate(toUpdate)
  }, [onUpdate, outdatedSkills, selectedSkills])

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

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        resultCount={visibleSkills.length}
        placeholder="Search skills..."
        ariaLabel="Search skills"
        resultLabel="skill"
      />

      <SelectionMenu
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
                : 'No skills match your search.'}
            </p>
            <button type="button" className="secondary-footer-button" onClick={onCancel}>
              Cancel
            </button>
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
          <button type="button" className="secondary-footer-button" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="primary-footer-button primary-footer-button--install"
            onClick={handleUpdate}
          >
            Update
          </button>
        </div>
      </footer>
    </section>
  )
}
