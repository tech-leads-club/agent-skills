import { Box, Text } from 'ink'
import BigText from 'ink-big-text'
import Gradient from 'ink-gradient'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'

import { environmentCheckAtom } from '../atoms/environmentCheck'
import { PACKAGE_VERSION } from '../services/package-info'
import { symbols } from '../theme/symbols'
import { MESSAGES } from '../utils/constants'

const crystalColors = ['#1e3a8a', '#3b82f6', '#0ea5e9', '#06b6d4', '#22d3ee']
const SEPARATOR_CHAR = '─'

export const Header = ({ notification: overrideNotification }: { notification?: React.ReactNode }) => {
  const envCheck = useAtomValue(environmentCheckAtom)

  const notification = useMemo(() => {
    if (overrideNotification) return overrideNotification

    const { updateAvailable, currentVersion, isGlobal, isLoading } = envCheck

    if (isLoading) return null

    if (updateAvailable && !isGlobal) {
      return (
        <Box flexDirection="column" alignItems="center">
          <Text color="yellow">
            {symbols.warning} {MESSAGES.UPDATE_AVAILABLE(currentVersion, updateAvailable)}
          </Text>
          <Text color="blue">
            {symbols.info} {MESSAGES.TIP_INSTALL_UPDATE} <Text bold>{MESSAGES.INSTALL_COMMAND}</Text>
          </Text>
        </Box>
      )
    }

    if (updateAvailable) {
      return (
        <Text color="yellow">
          {symbols.warning} {MESSAGES.UPDATE_AVAILABLE(currentVersion, updateAvailable)} (run{' '}
          <Text bold>{MESSAGES.UPDATE_COMMAND}</Text>)
        </Text>
      )
    }

    if (!isGlobal) {
      return (
        <Text color="blue">
          {symbols.info} {MESSAGES.TIP_INSTALL_ACCESS} <Text bold>{MESSAGES.INSTALL_COMMAND}</Text>
        </Text>
      )
    }

    return null
  }, [overrideNotification, envCheck])

  return (
    <Box flexDirection="column" paddingBottom={1}>
      <Box flexDirection="column" alignItems="center" marginBottom={1}>
        <Box marginBottom={-1}>
          <Gradient colors={['#1e3a8a', '#3b82f6']}>
            <BigText text="TLC" font="tiny" />
          </Gradient>
        </Box>

        <Box>
          <Gradient colors={crystalColors}>
            <BigText text="AGENT SKILLS" font="block" />
          </Gradient>
        </Box>

        <Box marginTop={-1} alignItems="center">
          <Text color="#334155">────── </Text>
          <Text color="white" bold>
            VERSION {PACKAGE_VERSION}
          </Text>
          <Text color="#334155"> ──────</Text>
        </Box>

        <Box marginTop={1}>
          <Text color="#64748b" italic>
            {MESSAGES.DESCRIPTION}
          </Text>
        </Box>

        {notification && <Box marginTop={1}>{notification}</Box>}
      </Box>

      <Box marginTop={notification ? 0 : 1} justifyContent="center">
        <Gradient colors={crystalColors}>
          <Text>{SEPARATOR_CHAR.repeat(60)}</Text>
        </Gradient>
      </Box>
    </Box>
  )
}
