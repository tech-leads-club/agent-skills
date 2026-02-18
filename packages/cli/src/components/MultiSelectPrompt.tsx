import { Box, Text, useInput } from 'ink'
import { useEffect, useRef, useState } from 'react'

import { colors, symbols } from '../theme'
import { FooterBar, type FooterHint } from './FooterBar'
import { KeyboardShortcutsOverlay, type ShortcutEntry } from './KeyboardShortcutsOverlay'

export interface MultiSelectOption<T> {
  label: string
  value: T
  hint?: string
}

interface MultiSelectPromptProps<T> {
  items: MultiSelectOption<T>[]
  onSubmit: (selected: T[]) => void
  onCancel?: () => void
  onChange?: (selected: T[]) => void
  initialSelected?: T[]
  limit?: number
}

export function MultiSelectPrompt<T>({
  items,
  onSubmit,
  onCancel,
  onChange,
  initialSelected = [],
  limit = 10,
}: MultiSelectPromptProps<T>) {
  const [selected, setSelected] = useState<T[]>(initialSelected)
  const [focusIndex, setFocusIndex] = useState(0)
  const [offset, setOffset] = useState(0)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const prevInitialSelectedRef = useRef<T[]>(initialSelected)

  useEffect(() => {
    const prev = prevInitialSelectedRef.current
    const hasChanged = prev.length !== initialSelected.length || prev.some((v, i) => v !== initialSelected[i])

    if (hasChanged) {
      setSelected(initialSelected)
      prevInitialSelectedRef.current = initialSelected
    }
  }, [initialSelected])

  useInput((input, key) => {
    if (input === '?') {
      setShowShortcuts((prev) => !prev)
      return
    }

    if (showShortcuts) {
      setShowShortcuts(false)
      return
    }

    if (key.return) {
      onSubmit(selected)
      return
    }

    if (key.escape && onCancel) {
      onCancel()
      return
    }

    let newIndex = focusIndex
    let newOffset = offset

    if (key.upArrow) {
      newIndex = focusIndex > 0 ? focusIndex - 1 : items.length - 1
    } else if (key.downArrow) {
      newIndex = focusIndex < items.length - 1 ? focusIndex + 1 : 0
    }

    if (newIndex < newOffset) {
      newOffset = newIndex
    } else if (newIndex >= newOffset + limit) {
      newOffset = newIndex - limit + 1
    }

    if (key.upArrow && focusIndex === 0) {
      newOffset = Math.max(0, items.length - limit)
    } else if (key.downArrow && focusIndex === items.length - 1) {
      newOffset = 0
    }

    if (newIndex !== focusIndex) {
      setFocusIndex(newIndex)
      setOffset(newOffset)
    }

    if (input === ' ') {
      const item = items[focusIndex]

      if (selected.includes(item.value)) {
        const newSelected = selected.filter((v) => v !== item.value)
        setSelected(newSelected)
        onChange?.(newSelected)
      } else {
        const newSelected = [...selected, item.value]
        setSelected(newSelected)
        onChange?.(newSelected)
      }
    }

    if (input === 'a' && key.ctrl) {
      if (selected.length === items.length) {
        setSelected([])
        onChange?.([])
      } else {
        const all = items.map((i) => i.value)
        setSelected(all)
        onChange?.(all)
      }
    }
  })

  const visibleItems = items.slice(offset, offset + limit)
  const hasItemsAbove = offset > 0
  const hasItemsBelow = items.length > offset + limit

  const shortcuts: ShortcutEntry[] = [
    { key: '↑/↓', description: 'Navigate' },
    { key: 'space', description: 'Toggle selection' },
    { key: 'enter', description: 'Confirm' },
    { key: 'ctrl+a', description: 'Select all / none' },
    ...(onCancel ? [{ key: 'esc', description: 'Cancel' }] : []),
  ]

  if (showShortcuts) {
    return (
      <Box flexDirection="column" flexGrow={1} alignItems="center" justifyContent="center">
        <KeyboardShortcutsOverlay
          visible={showShortcuts}
          onDismiss={() => setShowShortcuts(false)}
          shortcuts={shortcuts}
        />
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      {hasItemsAbove && (
        <Box justifyContent="center" marginBottom={1}>
          <Text color={colors.textDim}>
            {symbols.arrowUp} {symbols.arrowUp} {symbols.arrowUp}
          </Text>
        </Box>
      )}

      {visibleItems.map((item, index) => {
        const realIndex = index + offset
        const isFocused = realIndex === focusIndex
        const isSelected = selected.includes(item.value)

        const pointer = isFocused ? symbols.bullet : ' '
        const pointerColor = isSelected ? colors.success : colors.accent
        const checkbox = isSelected ? symbols.checkboxActive : symbols.checkboxInactive
        const checkboxColor = isSelected ? colors.success : colors.textMuted
        const textColor = isFocused ? colors.primary : isSelected ? colors.primaryLight : colors.text
        return (
          <Box
            key={`${String(item.value)}-${realIndex}`}
            backgroundColor={isFocused ? colors.bgLight : undefined}
            paddingX={1}
          >
            <Box width={2}>
              <Text color={pointerColor}>{pointer}</Text>
            </Box>
            <Box width={2}>
              <Text color={checkboxColor}>{checkbox}</Text>
            </Box>
            <Text color={textColor} bold={isFocused}>
              {item.label}
            </Text>
            {item.hint && (
              <Text color={isSelected ? colors.success : colors.textDim}>
                {' '}
                {symbols.dot} {item.hint}
              </Text>
            )}
          </Box>
        )
      })}

      {hasItemsBelow && (
        <Box justifyContent="center" marginTop={1}>
          <Text color={colors.textDim}>
            {symbols.arrowDown} {symbols.arrowDown} {symbols.arrowDown}
          </Text>
        </Box>
      )}

      <FooterBar
        hints={
          [
            { key: 'space', label: 'toggle' },
            { key: 'enter', label: 'confirm', color: colors.success },
            ...(onCancel ? [{ key: 'esc', label: 'back', color: colors.warning }] : []),
            { key: '?', label: 'help' },
          ] satisfies FooterHint[]
        }
        status={
          selected.length > 0 ? (
            <Text>
              <Text color={colors.success} bold>
                {symbols.checkboxActive} {selected.length}
              </Text>
              <Text color={colors.textDim}> selected</Text>
            </Text>
          ) : undefined
        }
      />
    </Box>
  )
}
