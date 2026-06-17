import { Box, Text } from 'ink'

import type { ReportRecommendation } from '@tech-leads-club/core'

import { colors } from '../../theme'
import { symbols } from '../../theme/symbols'

interface Props {
  recommendations: ReportRecommendation[]
}

const severityColors: Record<ReportRecommendation['severity'], string> = {
  error: colors.error,
  warning: colors.warning,
  info: colors.primary,
}

const severityIcons: Record<ReportRecommendation['severity'], string> = {
  error: symbols.cross,
  warning: symbols.warning,
  info: symbols.info,
}

export function RecommendationsSection({ recommendations }: Props) {
  if (recommendations.length === 0) {
    return <Text color={colors.success}>{symbols.check} No issues found.</Text>
  }

  return (
    <Box flexDirection="column">
      {recommendations.map((rec, idx) => (
        <Box key={idx} flexDirection="column" marginBottom={1}>
          <Text color={severityColors[rec.severity]}>
            {severityIcons[rec.severity]} {rec.message}
          </Text>
          {rec.details && (
            <Box paddingLeft={2}>
              <Text color={colors.textDim}>{rec.details}</Text>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  )
}
