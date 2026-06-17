import { Box, Text } from 'ink'
import { memo } from 'react'

import { colors, symbols } from '../theme'

export interface FooterHint {
  key: string
  label: string
  color?: string
}

export interface FooterBarProps {
  hints: FooterHint[]
  status?: React.ReactNode
}

export const FooterBar = memo(function FooterBar({ hints, status }: FooterBarProps) {
  return (
    <Box marginTop={1} borderStyle="round" borderColor={colors.border} paddingX={1}>
      <Box justifyContent="space-between" width="100%">
        <Text>
          {hints.map((hint, i) => (
            <Text key={hint.key}>
              {i > 0 && <Text color={colors.textDim}> {symbols.dot} </Text>}
              <Text color={hint.color ?? colors.accent} bold>
                {hint.key}
              </Text>
              <Text color={colors.textDim}> {hint.label}</Text>
            </Text>
          ))}
        </Text>
        {status && <Box>{status}</Box>}
      </Box>
    </Box>
  )
})
