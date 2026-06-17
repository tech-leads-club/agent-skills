import { Box, Text } from 'ink'

import { colors } from '../theme/colors'
import { symbols } from '../theme/symbols'
import { StatusBadge, type StatusType } from './StatusBadge'

export interface SkillCardProps {
  name: string
  description: string
  status?: StatusType | null
  selected?: boolean
  focused?: boolean
  readOnly?: boolean
}

export function SkillCard({
  name,
  description,
  status,
  selected = false,
  focused = false,
  readOnly = false,
}: SkillCardProps) {
  const isInstalled = status === 'installed'

  const checkbox = isInstalled ? symbols.checkboxActive : selected ? symbols.checkboxActive : symbols.checkboxInactive
  const checkboxColor = isInstalled ? colors.textMuted : selected ? colors.success : colors.textMuted

  const pointer = focused ? symbols.bullet : ' '
  const pointerColor = isInstalled ? colors.textMuted : selected ? colors.success : colors.accent
  const nameColor = isInstalled
    ? colors.textDim
    : focused
      ? colors.primary
      : selected
        ? colors.primaryLight
        : colors.text
  const descColor = colors.textMuted
  const bgColor = focused ? colors.bgLight : undefined

  return (
    <Box flexDirection="column" backgroundColor={bgColor}>
      <Box>
        <Box width={2} flexShrink={0}>
          <Text color={pointerColor}>{pointer}</Text>
        </Box>

        {!readOnly && (
          <Box width={2} flexShrink={0}>
            <Text color={checkboxColor}>{checkbox}</Text>
          </Box>
        )}

        <Box flexGrow={1}>
          <Text bold color={nameColor}>
            {name}
          </Text>
        </Box>

        {status && (
          <Box marginLeft={1} flexShrink={0}>
            <StatusBadge status={status} />
          </Box>
        )}
      </Box>

      <Box paddingLeft={readOnly ? 2 : 4}>
        <Text color={descColor} wrap="truncate">
          {description}
        </Text>
      </Box>
    </Box>
  )
}
