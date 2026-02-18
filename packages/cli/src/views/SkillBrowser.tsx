import { Box, Text, useInput, useStdout } from 'ink'
import { useAtomValue } from 'jotai'
import { useMemo, useState } from 'react'

import { installedSkillsAtom } from '../atoms/installedSkills'
import { selectedAgentsAtom } from '../atoms/wizard'
import { CategoryHeader, Header, SearchInput, SkillCard, SkillDetailPanel } from '../components'
import { FooterBar } from '../components/FooterBar'
import { KeyboardShortcutsOverlay, type ShortcutEntry } from '../components/KeyboardShortcutsOverlay'
import { useFilter, useSkills } from '../hooks'
import { groupSkillsByCategory } from '../services/categories'
import { canShowDetailPanel } from '../services/terminal-dimensions'
import { colors, symbols } from '../theme'
import type { SkillInfo } from '../types'

interface SkillBrowserProps {
  onInstall?: (selectedSkills: SkillInfo[]) => void
  onExit?: () => void
  overrideSkills?: SkillInfo[]
  readOnly?: boolean
}

type VisualItem =
  | { type: 'header'; category: string; categoryId?: string; count: number; installedCount: number }
  | { type: 'skill'; skill: SkillInfo }

const MIN_VISIBLE = 5
const CHROME_LINES = 24
const PANEL_WIDTH_RATIO = 0.35

const getShortcuts = (readOnly: boolean): ShortcutEntry[] => {
  const common = [
    { key: '/', description: 'Filter skills' },
    { key: '←/→', description: 'Collapse / expand' },
    { key: 'tab/→', description: 'Skill details' },
    { key: 'f', description: 'Expand / compact panel' },
  ]

  const exitKey = { key: 'esc', description: readOnly ? 'Exit / close panel' : 'Back / close panel' }

  if (readOnly) return [...common, exitKey]

  return [
    ...common,
    { key: 'space', description: 'Toggle / expand' },
    { key: 'enter', description: 'Install selected' },
    { key: 'ctrl+a', description: 'Select all' },
    exitKey,
  ]
}

export const SkillBrowser = ({ onInstall, onExit, overrideSkills, readOnly = false }: SkillBrowserProps) => {
  const { skills: fetchedSkills, loading: fetching, error } = useSkills()
  const { stdout } = useStdout()
  const selectedAgents = useAtomValue(selectedAgentsAtom)
  const installedSkills = useAtomValue(installedSkillsAtom)

  const skills = overrideSkills || fetchedSkills
  const loading = overrideSkills ? false : fetching

  const { query, setQuery, filtered } = useFilter(skills, {
    keys: ['name', 'description', 'category'],
  })

  const [selectedSet, setSelectedSet] = useState<Set<string>>(new Set())
  const [focusArea, setFocusArea] = useState<'search' | 'list'>('list')
  const [listIndex, setListIndex] = useState(0)
  const [offset, setOffset] = useState(0)
  const [showSearch, setShowSearch] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [detailSkill, setDetailSkill] = useState<SkillInfo | null>(null)
  const [drawerExpanded, setDrawerExpanded] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const canShowPanel = canShowDetailPanel()
  const terminalRows = stdout?.rows ?? 40
  const terminalCols = stdout?.columns ?? 120
  const VISIBLE_ITEMS = Math.max(MIN_VISIBLE, terminalRows - CHROME_LINES)
  const panelWidth = Math.max(30, Math.round(terminalCols * PANEL_WIDTH_RATIO))
  const contentAreaHeight = Math.max(10, terminalRows - 17)
  const isSearchExpanded = query.trim().length > 0

  const groupedMap = useMemo(() => groupSkillsByCategory(filtered), [filtered])

  useMemo(() => {
    if (query) setShowSearch(true)
  }, [query])

  const isCategoryExpanded = (categoryName: string) => isSearchExpanded || expandedCategory === categoryName

  const toggleCategory = (categoryName: string) => {
    setExpandedCategory(isCategoryExpanded(categoryName) ? null : categoryName)
  }

  const visualList = useMemo(() => {
    const list: VisualItem[] = []

    for (const [category, categorySkills] of groupedMap.entries()) {
      const installedCount = categorySkills.filter((s) => {
        const agents = installedSkills[s.name] || []
        if (selectedAgents.length > 0) return agents.some((a) => selectedAgents.includes(a))
        return agents.length > 0
      }).length

      list.push({
        type: 'header',
        category: category.name,
        categoryId: category.id,
        count: categorySkills.length,
        installedCount,
      })

      if (isCategoryExpanded(category.name)) categorySkills.forEach((skill) => list.push({ type: 'skill', skill }))
    }

    return list
  }, [groupedMap, expandedCategory, isSearchExpanded, installedSkills, selectedAgents])

  const handleToggleShortcuts = () => setShowShortcuts((prev) => !prev)

  const handleEscape = () => {
    if (showSearch) {
      setShowSearch(false)
      setQuery('')
      setFocusArea('list')
      return
    }
    onExit?.()
  }

  const handleSelectAll = () => {
    const allSkillNames = filtered.map((s) => s.name)
    setSelectedSet(selectedSet.size === allSkillNames.length ? new Set() : new Set(allSkillNames))
  }

  const handleSearchNavigation = (key: { downArrow?: boolean; return?: boolean }) => {
    if ((key.downArrow || key.return) && visualList.length > 0) {
      setFocusArea('list')
      setListIndex(0)
    }
  }

  const handleUpArrow = () => {
    if (listIndex === 0 && showSearch) {
      setFocusArea('search')
      return
    }

    const newIndex = Math.max(0, listIndex - 1)
    setListIndex(newIndex)
    if (newIndex < offset) setOffset(newIndex)
  }

  const handleDownArrow = () => {
    const newIndex = Math.min(visualList.length - 1, listIndex + 1)
    setListIndex(newIndex)
    if (newIndex >= offset + VISIBLE_ITEMS) setOffset(newIndex - VISIBLE_ITEMS + 1)
  }

  const handleSpaceKey = () => {
    const item = visualList[listIndex]

    if (item.type === 'header') {
      toggleCategory(item.category)
      return
    }

    if (item.type === 'skill' && !readOnly) {
      const isInstalled =
        selectedAgents.length > 0
          ? (installedSkills[item.skill.name]?.some((a) => selectedAgents.includes(a)) ?? false)
          : (installedSkills[item.skill.name]?.length ?? 0) > 0

      if (isInstalled && !overrideSkills) return

      const newSet = new Set(selectedSet)
      if (newSet.has(item.skill.name)) {
        newSet.delete(item.skill.name)
      } else {
        newSet.add(item.skill.name)
      }
      setSelectedSet(newSet)
    }
  }

  const handleEnterKey = () => {
    const item = visualList[listIndex]

    if (item.type === 'header') {
      toggleCategory(item.category)
      return
    }

    if (readOnly) return

    const selectedSkills = skills.filter((s) => selectedSet.has(s.name))
    if (selectedSkills.length > 0) onInstall?.(selectedSkills)
  }

  const handleTabOrRightArrow = (isTab: boolean) => {
    const item = visualList[listIndex]

    if (item.type === 'skill' && canShowPanel) {
      setDetailSkill(item.skill)
      setDrawerExpanded(false)
      return
    }

    if (!isTab && item.type === 'header' && !isCategoryExpanded(item.category)) setExpandedCategory(item.category)
  }

  const handleLeftArrow = () => {
    const item = visualList[listIndex]
    if (item.type === 'header' && isCategoryExpanded(item.category)) setExpandedCategory(null)
  }

  const isRegularCharacter = (
    input: string,
    key: {
      ctrl?: boolean
      meta?: boolean
      upArrow?: boolean
      downArrow?: boolean
      leftArrow?: boolean
      rightArrow?: boolean
    },
  ) =>
    input.length === 1 && !key.ctrl && !key.meta && !key.upArrow && !key.downArrow && !key.leftArrow && !key.rightArrow

  useInput(
    (input, key) => {
      if (input === '?') return handleToggleShortcuts()
      if (showShortcuts) return setShowShortcuts(false)
      if (key.escape) return handleEscape()

      if (!showSearch && input === '/') {
        setShowSearch(true)
        setFocusArea('search')
        return
      }

      if (input === 'a' && key.ctrl && !readOnly) return handleSelectAll()
      if (focusArea === 'search') return handleSearchNavigation(key)

      if (focusArea === 'list') {
        if (key.upArrow) return handleUpArrow()
        if (key.downArrow) return handleDownArrow()
        if (input === ' ') return handleSpaceKey()
        if (key.return) return handleEnterKey()
        if (key.tab) return handleTabOrRightArrow(true)
        if (key.rightArrow) return handleTabOrRightArrow(false)
        if (key.leftArrow) return handleLeftArrow()

        if (isRegularCharacter(input, key)) {
          setShowSearch(true)
          setFocusArea('search')
          setQuery(input)
        }
      }
    },
    { isActive: !detailSkill },
  )

  const visibleWindow = visualList.slice(offset, offset + VISIBLE_ITEMS)
  const hasItemsAbove = offset > 0
  const hasItemsBelow = offset + VISIBLE_ITEMS < visualList.length
  const scrollPercent =
    visualList.length <= VISIBLE_ITEMS ? 100 : Math.round(((offset + VISIBLE_ITEMS) / visualList.length) * 100)
  const showSkillList = !detailSkill || !drawerExpanded

  if (loading) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Header />
        <Box flexDirection="column" alignItems="center" justifyContent="center" paddingY={4}>
          <Text color={colors.accent}>Loading skills...</Text>
        </Box>
      </Box>
    )
  }

  if (error || (!loading && skills.length === 0)) {
    return (
      <Box flexDirection="column" paddingX={1} minHeight={20}>
        <Header />
        <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
          <Box
            flexDirection="column"
            borderStyle="round"
            borderColor={colors.error}
            paddingX={3}
            paddingY={2}
            alignItems="center"
          >
            <Text color={colors.error} bold>
              {symbols.cross} No Skills Available
            </Text>
            <Box marginTop={1}>
              <Text color={colors.textDim}>Check your internet connection and try again</Text>
            </Box>
            {error && (
              <Box marginTop={1}>
                <Text color={colors.textMuted} dimColor>
                  {error}
                </Text>
              </Box>
            )}
          </Box>
          <Box marginTop={2}>
            <Text color={colors.textDim}>
              Press{' '}
              <Text color={colors.accent} bold>
                Esc
              </Text>{' '}
              to exit
            </Text>
          </Box>
        </Box>
      </Box>
    )
  }

  const renderSkillListItem = (item: VisualItem, index: number) => {
    const realIndex = offset + index
    const isFocused = focusArea === 'list' && realIndex === listIndex

    if (item.type === 'header') {
      return (
        <Box key={`cat-${item.category}`} marginTop={index === 0 ? 0 : 1}>
          <CategoryHeader
            name={item.category}
            categoryId={item.categoryId}
            totalCount={item.count}
            installedCount={item.installedCount}
            isExpanded={isCategoryExpanded(item.category)}
            isFocused={isFocused}
          />
        </Box>
      )
    }

    const isSelected = selectedSet.has(item.skill.name)
    const isInstalled =
      selectedAgents.length > 0
        ? (installedSkills[item.skill.name]?.some((a) => selectedAgents.includes(a)) ?? false)
        : (installedSkills[item.skill.name]?.length ?? 0) > 0
    const status = isInstalled ? 'installed' : null

    return (
      <SkillCard
        key={item.skill.name}
        name={item.skill.name}
        description={item.skill.description}
        status={status}
        selected={isSelected}
        focused={isFocused}
        readOnly={readOnly}
      />
    )
  }

  const renderScrollIndicator = (direction: 'up' | 'down') => (
    <Box justifyContent="center" marginBottom={direction === 'up' ? 1 : 0} marginTop={direction === 'down' ? 1 : 0}>
      <Text color={colors.textDim}>
        {direction === 'up' ? symbols.arrowUp : symbols.arrowDown}{' '}
        {direction === 'up' ? symbols.arrowUp : symbols.arrowDown}{' '}
        {direction === 'up' ? symbols.arrowUp : symbols.arrowDown}
      </Text>
    </Box>
  )

  const renderFooterHints = () => {
    if (detailSkill) {
      return [
        { key: '↑/↓', label: 'scroll' },
        { key: 'f', label: drawerExpanded ? 'compact' : 'expand' },
        { key: 'Esc', label: 'close', color: colors.warning },
      ]
    }

    if (readOnly) {
      return [
        { key: '/', label: 'filter' },
        { key: 'tab', label: 'detail' },
        { key: 'esc', label: 'exit', color: colors.warning },
        { key: '?', label: 'help' },
      ]
    }

    return [
      { key: 'space', label: 'toggle' },
      { key: 'enter', label: 'install', color: colors.success },
      { key: '/', label: 'filter' },
      { key: 'tab', label: 'detail' },
      { key: 'esc', label: 'exit', color: colors.warning },
      { key: '?', label: 'help' },
    ]
  }

  const renderFooterStatus = () => {
    if (detailSkill) return undefined

    return (
      <>
        {!readOnly && selectedSet.size > 0 && (
          <Text>
            <Text color={colors.success} bold>
              {symbols.checkboxActive} {selectedSet.size}
            </Text>
            <Text color={colors.textDim}> selected</Text>
          </Text>
        )}
        {visualList.length > VISIBLE_ITEMS && (
          <Text color={colors.textDim}>
            {!readOnly && selectedSet.size > 0 ? `  ${symbols.dot}  ` : ''}
            {scrollPercent}%
          </Text>
        )}
      </>
    )
  }

  return (
    <Box flexDirection="column" paddingX={1} minHeight={20}>
      <Header />

      {showShortcuts ? (
        <Box flexDirection="column" flexGrow={1} alignItems="center" justifyContent="center">
          <KeyboardShortcutsOverlay
            visible={showShortcuts}
            onDismiss={() => setShowShortcuts(false)}
            shortcuts={getShortcuts(readOnly)}
          />
        </Box>
      ) : (
        <Box
          flexDirection="row"
          height={detailSkill ? contentAreaHeight : undefined}
          flexGrow={detailSkill ? 0 : 1}
          overflow="hidden"
        >
          {showSkillList && (
            <Box key="skill-list" flexDirection="column" flexGrow={1} flexShrink={1}>
              {showSearch && (
                <Box marginBottom={1}>
                  <SearchInput
                    query={query}
                    onChange={(q) => {
                      setQuery(q)
                      setListIndex(0)
                      setOffset(0)
                    }}
                    total={skills.length}
                    filtered={filtered.length}
                    isLoading={loading}
                    focus={focusArea === 'search'}
                  />
                </Box>
              )}

              <Box flexDirection="column" flexGrow={1}>
                {hasItemsAbove && renderScrollIndicator('up')}
                {visibleWindow.map(renderSkillListItem)}
                {hasItemsBelow && renderScrollIndicator('down')}
                {visualList.length === 0 && (
                  <Box paddingY={1}>
                    <Text color={colors.textMuted}>No skills match "{query}"</Text>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {detailSkill && (
            <Box
              key="detail-panel"
              flexDirection="column"
              width={drawerExpanded ? undefined : panelWidth}
              flexGrow={drawerExpanded ? 1 : 0}
              flexShrink={0}
            >
              <SkillDetailPanel
                skill={detailSkill}
                expanded={drawerExpanded}
                onClose={() => {
                  setDetailSkill(null)
                  setDrawerExpanded(false)
                }}
                onToggleExpand={() => setDrawerExpanded((prev) => !prev)}
              />
            </Box>
          )}
        </Box>
      )}

      <FooterBar hints={renderFooterHints()} status={renderFooterStatus()} />
    </Box>
  )
}
