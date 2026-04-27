import { Box, Text } from 'ink'

import { colors } from '../../theme'
import { symbols } from '../../theme/symbols'

interface Props {
  title: string
  count?: number
  expanded: boolean
  focused: boolean
  children: React.ReactNode
}

export function SectionContainer({ title, count, expanded, focused, children }: Props) {
  const chevron = expanded ? symbols.arrowDown : symbols.arrowRight
  const focusIndicator = focused ? symbols.arrow : ' '

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text color={focused ? colors.accent : colors.textDim}>{focusIndicator} </Text>
        <Text color={colors.accent} bold>
          {chevron} {title}
        </Text>
        {count !== undefined && (
          <Text color={colors.textDim}>
            {' '}
            ({count})
          </Text>
        )}
        {!expanded && focused && <Text color={colors.textMuted}> press enter to expand</Text>}
      </Box>
      {expanded && <Box flexDirection="column" paddingLeft={4} marginTop={1}>{children}</Box>}
    </Box>
  )
}
