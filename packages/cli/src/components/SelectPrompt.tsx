import { Box, Text, useInput } from 'ink'
import { useMemo, useState } from 'react'

import { colors, symbols } from '../theme'

export interface SelectOption<T> {
  label: string
  value: T
  hint?: string
}

interface SelectPromptProps<T> {
  items: SelectOption<T>[]
  onSelect: (value: T) => void
  onCancel?: () => void
  initialIndex?: number
  itemLimit?: number
  hideFooter?: boolean
  footerRight?: React.ReactNode
}

export function SelectPrompt<T>({
  items,
  onSelect,
  onCancel,
  initialIndex = 0,
  itemLimit = 10,
  hideFooter,
  footerRight,
}: SelectPromptProps<T>) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex)
  const [offset, setOffset] = useState(0)

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1))
      if (selectedIndex <= offset) setOffset((prev) => Math.max(0, prev - 1))
    }

    if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(items.length - 1, prev + 1))
      if (selectedIndex >= offset + itemLimit - 1) setOffset((prev) => Math.min(items.length - itemLimit, prev + 1))
    }

    if (key.return) onSelect(items[selectedIndex].value)
    if (key.escape && onCancel) onCancel()
  })

  const visibleItems = useMemo(() => {
    return items.slice(offset, offset + itemLimit)
  }, [items, offset, itemLimit])

  return (
    <Box flexDirection="column">
      {visibleItems.map((item, index) => {
        const isFocused = index + offset === selectedIndex
        return (
          <Box key={`${item.label}-${index}`} backgroundColor={isFocused ? colors.bgLight : undefined} paddingX={1}>
            <Box width={2}>
              <Text color={isFocused ? colors.accent : colors.textMuted}>{isFocused ? symbols.bullet : ' '}</Text>
            </Box>
            <Text color={isFocused ? colors.accent : colors.text} bold={isFocused}>
              {isFocused ? symbols.radioActive : symbols.radioInactive} {item.label}
            </Text>
            {isFocused && item.hint && (
              <Text color={colors.textDim}>
                {'  '}
                {symbols.dot} {item.hint}
              </Text>
            )}
          </Box>
        )
      })}

      {items.length > itemLimit && (
        <Box marginTop={1} paddingX={1}>
          <Text color={colors.textDim}>
            {symbols.arrowUp}
            {symbols.arrowDown} {offset + 1}-{Math.min(offset + itemLimit, items.length)} of {items.length}
          </Text>
        </Box>
      )}

      {!hideFooter && (
        <Box marginTop={1} borderStyle="round" borderColor={colors.border} paddingX={1}>
          <Box justifyContent="space-between" width="100%">
            <Text>
              <Text color={colors.success} bold>
                enter
              </Text>
              <Text color={colors.textDim}> select</Text>
              {onCancel && (
                <>
                  <Text color={colors.textDim}> {symbols.dot} </Text>
                  <Text color={colors.warning} bold>
                    esc
                  </Text>
                  <Text color={colors.textDim}> back</Text>
                </>
              )}
            </Text>
            {footerRight && <Box>{footerRight}</Box>}
          </Box>
        </Box>
      )}
    </Box>
  )
}
