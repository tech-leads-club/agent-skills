import { Box, Text } from 'ink'

import type { AgentReportSummary } from '@tech-leads-club/core'

import { colors } from '../../theme'
import { symbols } from '../../theme/symbols'

interface Props {
  agents: AgentReportSummary[]
}

export function AgentOverviewSection({ agents }: Props) {
  if (agents.length === 0) {
    return <Text color={colors.textDim}>No agents detected.</Text>
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color={colors.textDim}>
          {'Agent'.padEnd(20)} {'Status'.padEnd(10)} {'Local'.padEnd(7)} {'Global'.padEnd(7)}{' '}
          {'Tokens'.padEnd(10)} MCP
        </Text>
      </Box>

      {agents.map((agent) => (
        <Box key={agent.agent}>
          <Text>{agent.displayName.padEnd(20)}</Text>
          <Text color={agent.isInstalled ? colors.success : colors.textMuted}>
            {agent.isInstalled ? `${symbols.check} active` : '  —'} {'  '}
          </Text>
          <Text>{String(agent.localSkillCount).padEnd(7)}</Text>
          <Text>{String(agent.globalSkillCount).padEnd(7)}</Text>
          <Text>{agent.totalTokens > 0 ? agent.totalTokens.toLocaleString().padEnd(10) : '0'.padEnd(10)}</Text>
          <Text>{agent.mcpServerCount}</Text>
        </Box>
      ))}
    </Box>
  )
}
