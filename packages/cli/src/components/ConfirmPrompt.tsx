import { Box, Text, useInput } from 'ink'
import { useState } from 'react'

import { colors, symbols } from '../theme'

interface ConfirmPromptProps {
  message: string
  initialValue?: boolean
  onSubmit: (value: boolean) => void
}

export const ConfirmPrompt = ({ message, initialValue = false, onSubmit }: ConfirmPromptProps) => {
  const [value, setValue] = useState(initialValue)

  useInput((input, key) => {
    if (key.leftArrow || key.rightArrow || input === 'y' || input === 'n') setValue((prev) => !prev)
    if (key.return) onSubmit(value)
  })

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold>{message}</Text>
      <Box marginTop={1}>
        <Text color={value ? colors.success : colors.textMuted} bold={value}>
          {value ? symbols.radioActive : symbols.radioInactive} Yes
        </Text>
        <Box width={2} />
        <Text color={!value ? colors.error : colors.textMuted} bold={!value}>
          {!value ? symbols.radioActive : symbols.radioInactive} No
        </Text>
      </Box>
    </Box>
  )
}
