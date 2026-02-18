import { Box, Text, useInput, useStdout } from 'ink'
import Spinner from 'ink-spinner'
import { useState } from 'react'

import { FooterBar } from '../components/FooterBar'
import { Header } from '../components/Header'
import { KeyboardShortcutsOverlay, type ShortcutEntry } from '../components/KeyboardShortcutsOverlay'
import { MultiSelectPrompt } from '../components/MultiSelectPrompt'
import { useAgents } from '../hooks/useAgents'
import { getAgentConfig } from '../services/agents'
import { colors, symbols } from '../theme'
import type { AgentType } from '../types'

interface AgentSelectorProps {
  onSelect: (agents: AgentType[]) => void
  onBack?: () => void
}

const CHROME_LINES = 28

export function AgentSelector({ onSelect, onBack }: AgentSelectorProps) {
  const { stdout } = useStdout()
  const termRows = stdout?.rows ?? 40
  const listLimit = Math.max(3, termRows - CHROME_LINES)

  const { allAgents, installedAgents, selectedAgents, setSelectedAgents, loading } = useAgents()

  const agentShortcuts: ShortcutEntry[] = [
    { key: 'space', description: 'Toggle selection' },
    { key: 'enter', description: 'Confirm' },
    { key: 'ctrl+a', description: 'Select all' },
    { key: 'esc', description: 'Go back' },
  ]

  const [showShortcuts, setShowShortcuts] = useState(false)
  useInput((input) => {
    if (input === '?') setShowShortcuts((prev) => !prev)
  })

  const items = allAgents.map((agent) => {
    const config = getAgentConfig(agent)
    const isDetected = installedAgents.includes(agent)
    return { label: config.displayName, value: agent, hint: isDetected ? `${symbols.check} detected` : undefined }
  })

  if (loading) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Header />
        <Box marginTop={1}>
          <Text color={colors.accent}>
            <Spinner type="dots" /> Scanning for installed agents...
          </Text>
        </Box>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" paddingX={1} minHeight={20}>
      <Header />

      {showShortcuts ? (
        <>
          <Box flexDirection="column" flexGrow={1} alignItems="center" justifyContent="center">
            <KeyboardShortcutsOverlay
              visible={showShortcuts}
              onDismiss={() => setShowShortcuts(false)}
              shortcuts={agentShortcuts}
            />
          </Box>

          <FooterBar
            hints={[
              { key: 'space', label: 'toggle' },
              { key: 'enter', label: 'confirm', color: colors.success },
              ...(onBack ? [{ key: 'esc', label: 'back', color: colors.warning }] : []),
              { key: '?', label: 'help' },
            ]}
          />
        </>
      ) : (
        <>
          <Box marginBottom={1}>
            <Text bold color={colors.primary}>
              {symbols.diamond} Where do you want to install skills?
            </Text>
          </Box>
          <Box marginBottom={1}>
            <Text color={colors.textDim}>{installedAgents.length} agents detected on this machine</Text>
          </Box>

          <MultiSelectPrompt
            items={items}
            initialSelected={selectedAgents}
            onSubmit={onSelect}
            onCancel={onBack}
            onChange={setSelectedAgents}
            limit={listLimit}
          />
        </>
      )}
    </Box>
  )
}
