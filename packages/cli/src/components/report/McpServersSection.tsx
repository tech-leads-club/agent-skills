import { Box, Text } from 'ink'

import type { McpServerConflict, McpServerEntry } from '@tech-leads-club/core'

import { colors } from '../../theme'
import { symbols } from '../../theme/symbols'

interface Props {
  servers: McpServerEntry[]
  conflicts: McpServerConflict[]
}

export function McpServersSection({ servers, conflicts }: Props) {
  if (servers.length === 0) {
    return <Text color={colors.textDim}>No MCP servers detected.</Text>
  }

  const byAgent = new Map<string, McpServerEntry[]>()
  for (const server of servers) {
    const existing = byAgent.get(server.agent) ?? []
    existing.push(server)
    byAgent.set(server.agent, existing)
  }

  return (
    <Box flexDirection="column">
      {[...byAgent.entries()].map(([agent, agentServers]) => (
        <Box key={agent} flexDirection="column" marginBottom={1}>
          <Text bold>
            {agent} ({agentServers.length})
          </Text>
          {agentServers.map((server) => {
            const hasConflict = conflicts.some((c) => c.serverName === server.name)
            return (
              <Box key={`${server.agent}-${server.name}-${server.sourceFile}`} paddingLeft={2}>
                <Text>{symbols.bullet} {server.name}</Text>
                {server.location === 'global' && <Text color={colors.textDim}> (global)</Text>}
                {hasConflict && <Text color={colors.error}> [conflict]</Text>}
                <Text color={colors.textDim}>
                  {' '}
                  {symbols.arrowRight} {server.command} {(server.args ?? []).join(' ')}
                </Text>
              </Box>
            )
          })}
        </Box>
      ))}

      {conflicts.length > 0 && (
        <Text color={colors.error}>
          {symbols.warning} {conflicts.length} conflict(s) detected — same server name with different configurations
        </Text>
      )}
    </Box>
  )
}
