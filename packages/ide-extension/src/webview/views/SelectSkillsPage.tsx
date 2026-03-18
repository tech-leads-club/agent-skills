import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CategoryOption, SelectableSkillsInput } from '../../services/selection-selectors'
import type {
  ActionRequest,
  AvailableAgent,
  InstalledSkillsMap,
  Skill,
  SkillRegistry,
  WebviewAction,
} from '../../shared/types'
import { SkillSelectCard } from '../components/SkillSelectCard'
import { SkillSelectionToolbar } from '../components/SkillSelectionToolbar'
import { useFilteredSkills } from '../hooks/useFilteredSkills'

export interface SelectSkillsPageProps {
  action: WebviewAction
  registry: SkillRegistry
  installedSkills: InstalledSkillsMap
  allAgents?: AvailableAgent[]
  selectedAgents?: string[]
  scope: ActionRequest['scope']
  selectedSkills: string[]
  getCategoryOptions: (registry: SkillRegistry) => CategoryOption[]
  getSelectableSkills: (input: SelectableSkillsInput) => Skill[]
  isSkillInstalledForScope: (installed: InstalledSkillsMap[string], scope: ActionRequest['scope']) => boolean
  onToggleSkill: (skillName: string) => void
  onPreviewSkill: (skillName: string) => void
  onSelectAll: (skills: string[]) => void
  onClear: () => void
  onBack: () => void
  onCancel?: () => void
  onNext: () => void
}

export function SelectSkillsPage({
  action,
  registry,
  installedSkills,
  allAgents = [],
  selectedAgents = [],
  scope,
  selectedSkills,
  getCategoryOptions,
  getSelectableSkills,
  isSkillInstalledForScope,
  onToggleSkill,
  onPreviewSkill,
  onSelectAll,
  onClear,
  onBack,
  onCancel = onBack,
  onNext,
}: SelectSkillsPageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('all')
  const nextStepActionClassName =
    action === 'uninstall' ? 'primary-footer-button--uninstall' : 'primary-footer-button--install'

  const candidateSkills = useMemo(
    () =>
      getSelectableSkills({
        action,
        registry,
        installedSkills,
        allAgents,
        selectedAgents,
        scope,
      }),
    [action, allAgents, getSelectableSkills, installedSkills, registry, scope, selectedAgents],
  )
  const categoryOptions = useMemo(() => getCategoryOptions(registry), [getCategoryOptions, registry])
  const visibleSkills = useFilteredSkills({
    skills: candidateSkills,
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
        onBack()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleToggleAllVisible, onBack])

  return (
    <section className="select-page" aria-label="Select skills page">
      <header className="select-page-header">
        <button className="icon-button" onClick={onBack} aria-label="Back to previous step">
          <span className="codicon codicon-arrow-left" aria-hidden="true" />
        </button>
        <div>
          <h1>{action === 'install' ? 'Install: Select Skills' : 'Uninstall: Select Skills'}</h1>
          <p>Select the skills you want to continue with.</p>
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

      <div className="select-page-list" aria-label="Skills list">
        {visibleSkills.length === 0 ? (
          <div className="select-page-empty" role="status">
            <p>
              {action === 'install'
                ? 'All skills are already installed for the selected scope.'
                : 'No skills are installed for the selected scope.'}
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
              isInstalled={action === 'uninstall' || isSkillInstalledForScope(installedSkills[skill.name], scope)}
              onPreview={() => onPreviewSkill(skill.name)}
            />
          ))
        )}
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
            {action === 'install' ? 'Configure Installation' : 'Confirm Removal'}
            <span className="codicon codicon-arrow-right" aria-hidden="true" />
          </button>
        </div>
      </footer>
    </section>
  )
}
