import { Box, Text } from 'ink'

interface AuditEntry {
  action: 'install' | 'remove' | 'update'
  skillName: string
  agents: string[]
  success: number
  failed: number
  timestamp?: string
  forced?: boolean
}

interface Props {
  entries: AuditEntry[]
  limit?: number
}

export function AuditLogViewer({ entries, limit = 10 }: Props) {
  const displayEntries = entries.slice(0, limit)

  if (displayEntries.length === 0) {
    return (
      <Box flexDirection="column" paddingY={1}>
        <Text dimColor>No audit log entries found</Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          📋 Audit Log
        </Text>
        <Text dimColor> (showing {displayEntries.length} most recent)</Text>
      </Box>

      {displayEntries.map((entry, idx) => {
        const date = entry.timestamp ? new Date(entry.timestamp) : new Date()
        const timeAgo = entry.timestamp ? getTimeAgo(date) : 'unknown time'
        const actionColor = entry.action === 'install' ? 'green' : entry.action === 'remove' ? 'red' : 'yellow'
        const statusIcon = entry.failed === 0 ? '✓' : entry.success > 0 ? '⚠' : '✗'

        return (
          <Box key={idx} flexDirection="column" marginBottom={1} paddingLeft={2}>
            <Box>
              <Text color={actionColor} bold>
                {statusIcon} {entry.action.toUpperCase()}
              </Text>
              <Text dimColor> • {timeAgo}</Text>
            </Box>
            <Box paddingLeft={2}>
              <Text>Skills: </Text>
              <Text color="cyan">{entry.skillName}</Text>
            </Box>
            <Box paddingLeft={2}>
              <Text>Agents: </Text>
              <Text dimColor>{entry.agents.join(', ')}</Text>
            </Box>
            <Box paddingLeft={2}>
              <Text color="green">✓ {entry.success}</Text>
              {entry.failed > 0 && (
                <>
                  <Text> • </Text>
                  <Text color="red">✗ {entry.failed}</Text>
                </>
              )}
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`

  return date.toLocaleDateString()
}
