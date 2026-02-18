import { Box, Text, useInput } from 'ink'
import React, { useEffect } from 'react'

import { colors, symbols } from '../theme'
import { AnimatedTransition } from './AnimatedTransition'

export interface ShortcutEntry {
  key: string
  description: string
}

export interface KeyboardShortcutsOverlayProps {
  visible: boolean
  onDismiss: () => void
  shortcuts: ShortcutEntry[]
}

export const KeyboardShortcutsOverlay: React.FC<KeyboardShortcutsOverlayProps> = ({
  visible,
  onDismiss,
  shortcuts,
}) => {
  useInput(
    () => {
      if (visible) onDismiss()
    },
    { isActive: visible },
  )

  useEffect(() => {
    let timer: NodeJS.Timeout

    if (visible) {
      timer = setTimeout(() => {
        onDismiss()
      }, 8000)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [visible, onDismiss])

  const mid = Math.ceil(shortcuts.length / 2)
  const leftColumn = shortcuts.slice(0, mid)
  const rightColumn = shortcuts.slice(mid)

  const KeyBadge = ({ label }: { label: string }) => (
    <Box flexShrink={0}>
      <Text backgroundColor={colors.bgLight} color={colors.accent} bold>
        {` ${label} `}
      </Text>
    </Box>
  )

  const ShortcutRow = ({ entry }: { entry: ShortcutEntry }) => (
    <Box marginBottom={0} gap={1}>
      <Box width={10} justifyContent="flex-end" flexShrink={0}>
        <KeyBadge label={entry.key} />
      </Box>
      <Text color={colors.textDim}>{entry.description}</Text>
    </Box>
  )

  const divider = '─'.repeat(48)

  return (
    <AnimatedTransition visible={visible} duration={200}>
      <Box
        borderStyle="round"
        borderColor={colors.border}
        backgroundColor={colors.bg}
        paddingX={2}
        paddingY={1}
        flexDirection="column"
        width={56}
      >
        <Box justifyContent="center" marginBottom={1}>
          <Text color={colors.accent} bold>
            {symbols.sparkle} Keyboard Shortcuts
          </Text>
        </Box>

        <Box justifyContent="center">
          <Text color={colors.border}>{divider}</Text>
        </Box>

        <Box marginTop={1} gap={2}>
          <Box flexDirection="column" gap={1} flexGrow={1}>
            {leftColumn.map((entry) => (
              <ShortcutRow key={entry.key} entry={entry} />
            ))}
          </Box>

          <Box flexDirection="column" gap={1} flexGrow={1}>
            {rightColumn.map((entry) => (
              <ShortcutRow key={entry.key} entry={entry} />
            ))}
          </Box>
        </Box>

        <Box justifyContent="center" marginTop={1}>
          <Text color={colors.border}>{divider}</Text>
        </Box>

        <Box marginTop={1} justifyContent="center">
          <Text color={colors.textMuted}>press any key to dismiss</Text>
        </Box>
      </Box>
    </AnimatedTransition>
  )
}
