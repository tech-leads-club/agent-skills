import { Box, Text, useInput } from 'ink'

import { Header } from '../components/Header'
import { SelectPrompt } from '../components/SelectPrompt'
import { colors, symbols } from '../theme'

interface ActionSelectorProps {
  onSelect: (action: 'install' | 'update' | 'remove') => void
  onBack?: () => void
  onCredits?: () => void
}

export function ActionSelector({ onSelect, onBack, onCredits }: ActionSelectorProps) {
  const items = [
    { label: 'Install new skills', value: 'install' as const, hint: 'browse and select skills to install' },
    { label: 'Update existing skills', value: 'update' as const, hint: 'check for content changes' },
    { label: 'Remove installed skills', value: 'remove' as const, hint: 'uninstall skills from agents' },
  ]

  useInput((input) => {
    if (input === 'c' && onCredits) onCredits()
  })

  const creditsHint = (
    <Text>
      <Text color={colors.accent} bold>
        c
      </Text>
      <Text color={colors.textDim}> credits</Text>
    </Text>
  )

  return (
    <Box flexDirection="column" paddingX={1}>
      <Header />
      <Box marginBottom={1}>
        <Text bold color={colors.primary}>
          {symbols.diamond} What would you like to do?
        </Text>
      </Box>

      <SelectPrompt items={items} onSelect={onSelect} onCancel={onBack} footerRight={creditsHint} />
    </Box>
  )
}
