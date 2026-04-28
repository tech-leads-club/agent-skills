import { Box, Text } from 'ink'
import { useMemo } from 'react'

import { formatCategoryBadge } from '../services/badge-format'
import { colors, symbols } from '../theme'

interface CategoryHeaderProps {
  name: string
  categoryId?: string
  totalCount: number
  installedCount?: number
  isExpanded?: boolean
  isFocused?: boolean
}

export const CategoryHeader = ({
  name,
  totalCount,
  installedCount = 0,
  isExpanded = false,
  isFocused = false,
}: CategoryHeaderProps) => {
  const badge = useMemo(() => formatCategoryBadge(installedCount, totalCount), [installedCount, totalCount])
  const chevron = isExpanded ? '\u25BE' : '\u25B8'

  return (
    <Box>
      <Box width={2}>{isFocused ? <Text color={colors.accent}>{symbols.bullet}</Text> : <Text> </Text>}</Box>
      <Text color={isFocused ? colors.accent : colors.primaryLight} bold>
        {chevron}{' '}
      </Text>
      <Text color={isFocused ? colors.accent : colors.text} bold>
        {name}
      </Text>
      <Text color={installedCount > 0 ? colors.success : colors.textMuted}> {badge}</Text>
      {!isExpanded && isFocused && <Text color={colors.textDim}> {symbols.dot} press space to expand</Text>}
    </Box>
  )
}
