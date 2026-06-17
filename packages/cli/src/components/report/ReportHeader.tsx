import { Box, Text } from 'ink'

import type { AuditReport } from '@tech-leads-club/core'

import { colors } from '../../theme'
import { symbols } from '../../theme/symbols'

interface Props {
  summary: AuditReport['summary']
}

export function ReportHeader({ summary }: Props) {
  const warnings: string[] = []
  if (summary.highCostSkillCount > 0) warnings.push(`${summary.highCostSkillCount} high-cost`)
  if (summary.orphanedSkillCount > 0) warnings.push(`${summary.orphanedSkillCount} orphaned`)
  if (summary.duplicateSkillCount > 0) warnings.push(`${summary.duplicateSkillCount} duplicated`)

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text color={colors.success}>{summary.totalAgentsDetected} agents</Text>
        <Text color={colors.textDim}> {symbols.dot} </Text>
        <Text color={colors.accent}>{summary.totalSkillsInstalled} skills</Text>
        <Text color={colors.textDim}> {symbols.dot} </Text>
        <Text color={colors.warning}>{summary.alwaysOnTokens.toLocaleString()} always-on tokens</Text>
        <Text color={colors.textDim}> {symbols.dot} </Text>
        <Text color={colors.primaryLight}>{summary.totalMcpServers} MCP servers</Text>
      </Box>

      {warnings.length > 0 && (
        <Box>
          <Text color={colors.warning}>
            {symbols.warning} {warnings.join(', ')}
          </Text>
        </Box>
      )}
    </Box>
  )
}
