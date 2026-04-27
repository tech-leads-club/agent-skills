import { Box, Text } from 'ink'

import type { AuditReport, CostEstimate, SkillTokenEstimate } from '@tech-leads-club/core'

import { colors } from '../../theme'
import { symbols } from '../../theme/symbols'

interface Props {
  tokenEstimates: SkillTokenEstimate[]
  costEstimates: CostEstimate[]
  summary: AuditReport['summary']
}

export function TokenCostSection({ tokenEstimates, costEstimates, summary }: Props) {
  if (tokenEstimates.length === 0) {
    return <Text color={colors.textDim}>No skills to analyze.</Text>
  }

  const highCost = tokenEstimates.filter((e) => e.isHighCost).sort((a, b) => b.totalTokens - a.totalTokens)

  return (
    <Box flexDirection="column">
      <Box flexDirection="column" marginBottom={1}>
        <Text color={colors.textDim}>Progressive disclosure (agentskills.io/specification):</Text>
        <Text color={colors.textDim}>  1. Description (~100 tok) — always loaded at startup</Text>
        <Text color={colors.textDim}>  2. Body ({'<'} 5000 tok) — loaded on skill activation</Text>
        <Text color={colors.textDim}>  3. Resources — loaded on demand</Text>
      </Box>

      <Box marginBottom={1}>
        <Text bold>Always-on (descriptions): </Text>
        <Text color={colors.warning}>{summary.alwaysOnTokens.toLocaleString()} tokens</Text>
      </Box>
      <Box marginBottom={1}>
        <Text bold>Full activation (all):    </Text>
        <Text color={colors.warning}>{summary.totalTokens.toLocaleString()} tokens</Text>
      </Box>

      {highCost.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text color={colors.warning} bold>
            {symbols.warning} High-cost skills (total):
          </Text>
          {highCost.map((e) => (
            <Box key={`${e.agent}-${e.skillName}`} paddingLeft={2}>
              <Text color={colors.warning}>
                {symbols.bullet} {e.skillName} ({e.agent}): {e.totalTokens.toLocaleString()} tok
              </Text>
              <Text color={colors.textDim}>
                {' '}[desc:{e.descriptionTokens} body:{e.bodyTokens} ref:{e.resourceTokens}]
              </Text>
            </Box>
          ))}
        </Box>
      )}

      <Text bold>Estimated always-on cost (descriptions at startup):</Text>
      <Box flexDirection="column" marginTop={1}>
        {costEstimates.map((cost) => {
          const formattedCost =
            cost.estimatedInputCost < 0.01
              ? `$${cost.estimatedInputCost.toFixed(6)}`
              : `$${cost.estimatedInputCost.toFixed(4)}`

          return (
            <Box key={`${cost.provider.name}-${cost.provider.model}`} paddingLeft={2}>
              <Text>
                {cost.provider.name}{' '}
              </Text>
              <Text color={colors.textDim}>({cost.provider.model})</Text>
              <Text>: </Text>
              <Text color={colors.success}>{formattedCost}</Text>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
