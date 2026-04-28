import { Box, Text, useInput } from 'ink'
import { useState } from 'react'

import { Header } from '../components/Header'
import { SelectPrompt } from '../components/SelectPrompt'
import { colors, symbols } from '../theme'

interface InstallConfigProps {
  onConfirm: (config: { method: 'copy' | 'symlink'; global: boolean }) => void
  onBack: () => void
  initialMethod?: 'copy' | 'symlink'
  initialGlobal?: boolean
}

export function InstallConfig({
  onConfirm,
  onBack,
  initialMethod = 'copy',
  initialGlobal = false,
}: InstallConfigProps) {
  const [step, setStep] = useState<'method' | 'scope' | 'confirm'>('method')
  const [method, setMethod] = useState<'copy' | 'symlink'>(initialMethod)
  const [isGlobal, setIsGlobal] = useState(initialGlobal)

  if (step === 'method') {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Header />
        <Box marginBottom={1}>
          <Text bold color={colors.primary}>
            {symbols.diamond} Choose installation method:
          </Text>
        </Box>
        <SelectPrompt
          items={[
            { label: 'Copy', value: 'copy', hint: 'independent copies (recommended)' },
            { label: 'Symlink', value: 'symlink', hint: 'shared source (may not work with all agents)' },
          ]}
          onSelect={(val) => {
            setMethod(val as 'copy' | 'symlink')
            setStep('scope')
          }}
          onCancel={onBack}
        />
      </Box>
    )
  }

  if (step === 'scope') {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Header />
        <Box marginBottom={1}>
          <Text bold color={colors.primary}>
            {symbols.diamond} Choose installation scope:
          </Text>
        </Box>
        <SelectPrompt
          items={[
            { label: 'Local', value: false, hint: 'this project only' },
            { label: 'Global', value: true, hint: 'user home directory' },
          ]}
          onSelect={(val) => {
            setIsGlobal(val as boolean)
            setStep('confirm')
          }}
          onCancel={() => setStep('method')}
        />
      </Box>
    )
  }

  return (
    <InstallSummary
      method={method}
      isGlobal={isGlobal}
      onConfirm={() => onConfirm({ method, global: isGlobal })}
      onBack={() => setStep('scope')}
    />
  )
}

function InstallSummary({
  method,
  isGlobal,
  onConfirm,
  onBack,
}: {
  method: string
  isGlobal: boolean
  onConfirm: () => void
  onBack: () => void
}) {
  useInput((input, key) => {
    if (key.return || input === 'y' || input === 'Y') onConfirm()
    if (key.escape || input === 'n' || input === 'N') onBack()
  })

  return (
    <Box flexDirection="column" paddingX={1}>
      <Header />

      <Box flexDirection="column" borderStyle="round" borderColor={colors.accent} paddingX={2} paddingY={1}>
        <Box marginBottom={1}>
          <Text bold color={colors.accent}>
            {symbols.diamond} Ready to install
          </Text>
        </Box>

        <Box>
          <Box width={10}>
            <Text color={colors.textDim}>Method</Text>
          </Box>
          <Text color={colors.text} bold>
            {method === 'copy' ? 'Copy' : 'Symlink'}
          </Text>
          <Text color={colors.textMuted}>
            {'  '}
            {symbols.dot} {method === 'copy' ? 'Recommended' : 'Developer mode'}
          </Text>
        </Box>

        <Box>
          <Box width={10}>
            <Text color={colors.textDim}>Scope</Text>
          </Box>
          <Text color={colors.text} bold>
            {isGlobal ? 'Global' : 'Local'}
          </Text>
          <Text color={colors.textMuted}>
            {'  '}
            {symbols.dot} {isGlobal ? 'User home' : 'This project'}
          </Text>
        </Box>
      </Box>

      <Box marginTop={1} borderStyle="round" borderColor={colors.border} paddingX={1}>
        <Box justifyContent="space-between" width="100%">
          <Text>
            <Text color={colors.success} bold>
              Y
            </Text>
            <Text color={colors.textDim}> / </Text>
            <Text color={colors.success} bold>
              enter
            </Text>
            <Text color={colors.textDim}> confirm</Text>
            <Text color={colors.textDim}> {symbols.dot} </Text>
            <Text color={colors.warning} bold>
              N
            </Text>
            <Text color={colors.textDim}> / </Text>
            <Text color={colors.warning} bold>
              esc
            </Text>
            <Text color={colors.textDim}> back</Text>
          </Text>
        </Box>
      </Box>
    </Box>
  )
}
