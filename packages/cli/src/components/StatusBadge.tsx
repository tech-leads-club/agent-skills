import { Box, Text } from 'ink'

import { colors } from '../theme/colors'
import { symbols } from '../theme/symbols'

export type StatusType = 'installed' | 'update' | 'new' | 'deprecated'

export interface StatusBadgeProps {
  status: StatusType
}

const badgeConfig = {
  installed: { icon: symbols.check, label: 'installed', color: colors.success, bg: '#052e16' },
  update: { icon: symbols.arrowUp, label: 'update', color: colors.warning, bg: '#422006' },
  new: { icon: symbols.sparkle, label: 'new', color: colors.accent, bg: '#083344' },
  deprecated: { icon: symbols.warning, label: 'deprecated', color: colors.warning, bg: '#422006' },
} as const

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = badgeConfig[status]
  if (!config) return null

  return (
    <Box>
      <Text backgroundColor={config.bg} color={config.color}>
        {' '}
        {config.icon} {config.label}{' '}
      </Text>
    </Box>
  )
}

export interface AgentBadgeProps {
  agents: string[]
}

export function AgentBadge({ agents }: AgentBadgeProps) {
  if (!agents || agents.length === 0) return null

  return (
    <Text color={colors.textDim}>
      <Text color={colors.success}>{symbols.check}</Text> {agents.join(', ')}
    </Text>
  )
}
