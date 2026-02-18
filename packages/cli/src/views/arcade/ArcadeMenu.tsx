import { Box, Text } from 'ink'
import BigText from 'ink-big-text'
import Gradient from 'ink-gradient'
import { useEffect, useState } from 'react'

import { FooterBar } from '../../components/FooterBar'
import { SelectPrompt } from '../../components/SelectPrompt'
import { colors, symbols } from '../../theme'
import { VibeInvaders } from './VibeInvaders'

type ArcadeScreen = 'menu' | 'invaders'

interface ArcadeMenuProps {
  onExit: () => void
}

const menuItems = [
  { label: 'Vibe Invaders', value: 'invaders' as const, hint: 'Fight vibe-coding!' },
  { label: 'Back', value: 'back' as const, hint: 'Return to CLI' },
]

const SCANLINE = '\u2591'.repeat(56)

export function ArcadeMenu({ onExit }: ArcadeMenuProps) {
  const [screen, setScreen] = useState<ArcadeScreen>('menu')
  const [blinkVisible, setBlinkVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => setBlinkVisible((v) => !v), 600)
    return () => clearInterval(interval)
  }, [])

  const handleSelect = (value: 'invaders' | 'back') => {
    if (value === 'back') {
      onExit()
      return
    }

    setScreen(value)
  }

  if (screen === 'invaders') return <VibeInvaders onExit={() => setScreen('menu')} />

  return (
    <Box flexDirection="column" alignItems="center">
      <Box marginBottom={0}>
        <Gradient name="cristal">
          <Text>{SCANLINE}</Text>
        </Gradient>
      </Box>

      <Box marginBottom={0}>
        <Gradient name="pastel">
          <BigText text="ARCADE" font="chrome" />
        </Gradient>
      </Box>

      <Box marginBottom={0}>
        <Gradient name="cristal">
          <Text>{SCANLINE}</Text>
        </Gradient>
      </Box>

      <Box marginBottom={1} marginTop={1}>
        <Text color={blinkVisible ? colors.warning : colors.bg} bold>
          {symbols.sparkle} SECRET UNLOCKED {symbols.sparkle}
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text color={colors.textDim}>
          {symbols.diamond} Choose your adventure {symbols.diamond}
        </Text>
      </Box>

      <Box width={50}>
        <SelectPrompt items={menuItems} onSelect={handleSelect} onCancel={onExit} hideFooter />
      </Box>

      <FooterBar
        hints={[
          { key: '\u2191\u2193', label: 'navigate' },
          { key: '\u23CE', label: 'select' },
          { key: 'esc', label: 'back', color: colors.warning },
        ]}
      />
    </Box>
  )
}
