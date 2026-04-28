import { Box, Text, useInput } from 'ink'

import { colors, symbols } from '../theme'
import { Header } from './Header'

interface InstallResultsProps {
  results: Array<{ success: boolean; skill: string; agent: string; error?: string }>
  onExit: () => void
  title?: string
  successLabel?: string
}

export function InstallResults({
  results,
  onExit,
  title = 'Installation Complete',
  successLabel = 'succeeded',
}: InstallResultsProps) {
  useInput((_, key) => {
    if (key.return || key.escape) onExit()
  })

  const uniqueSuccessSkills = new Set(results.filter((r) => r.success).map((r) => r.skill))
  const uniqueFailedSkills = new Set(results.filter((r) => !r.success).map((r) => r.skill))
  const successCount = uniqueSuccessSkills.size
  const failCount = uniqueFailedSkills.size

  const allFailed = successCount === 0 && failCount > 0
  const anyFailed = failCount > 0
  const borderColor = allFailed ? colors.error : anyFailed ? colors.warning : colors.success

  const displayTitle = allFailed
    ? `${symbols.cross} Installation Failed`
    : anyFailed
      ? `${symbols.warning} Partially Installed`
      : `${symbols.check} ${title}`

  const titleColor = allFailed ? colors.error : anyFailed ? colors.warning : colors.success

  return (
    <Box flexDirection="column" paddingX={1}>
      <Header />

      <Box flexDirection="column" borderStyle="round" borderColor={borderColor} paddingX={2} paddingY={1}>
        <Box marginBottom={1}>
          <Text color={titleColor} bold>
            {displayTitle}
          </Text>
        </Box>

        {results.map((res, i) => (
          <Box key={i} flexDirection="column">
            <Box paddingX={1}>
              <Box width={2}>
                <Text color={res.success ? colors.success : colors.error}>
                  {res.success ? symbols.check : symbols.cross}
                </Text>
              </Box>
              <Text color={res.success ? colors.text : colors.error}>{res.skill}</Text>
              <Text color={colors.textDim}>
                {' '}
                {symbols.arrow} {res.agent}
              </Text>
            </Box>
            {!res.success && res.error && (
              <Box paddingLeft={4}>
                <Text color={colors.error} dimColor>
                  {res.error}
                </Text>
              </Box>
            )}
          </Box>
        ))}

        {(successCount > 0 || failCount > 0) && (
          <Box marginTop={1}>
            <Text color={colors.textDim}>
              {successCount > 0 && (
                <Text color={colors.success}>
                  {successCount} {successLabel}
                </Text>
              )}
              {successCount > 0 && failCount > 0 && <Text> {symbols.dot} </Text>}
              {failCount > 0 && <Text color={colors.error}>{failCount} failed</Text>}
            </Text>
          </Box>
        )}

        <Box marginTop={1}>
          <Text color={colors.textDim}>
            View details: <Text color={colors.accent}>agent-skills audit</Text>
          </Text>
        </Box>
      </Box>

      <Box marginTop={1} borderStyle="round" borderColor={colors.border} paddingX={1}>
        <Text>
          <Text color={colors.success} bold>
            enter
          </Text>
          <Text color={colors.textDim}> / </Text>
          <Text color={colors.warning} bold>
            esc
          </Text>
          <Text color={colors.textDim}> exit</Text>
        </Text>
      </Box>
    </Box>
  )
}
