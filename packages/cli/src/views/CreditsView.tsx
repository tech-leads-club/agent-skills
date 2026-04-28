import { Box, Text, useInput, useStdout } from 'ink'
import BigText from 'ink-big-text'
import Gradient from 'ink-gradient'
import type { ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { play, stop } from '../services/audio-player'
import { fetchContributors, fetchRepoStars } from '../services/github-contributors'
import { colors, symbols } from '../theme'
import type { GitHubContributor } from '../types'

interface CreditsViewProps {
  onExit: () => void
}

const BASE_SPEED_MS = 220
const CONTENT_WIDTH = 52
const CRYSTAL_COLORS = ['#1e3a8a', '#3b82f6', '#0ea5e9', '#06b6d4', '#22d3ee']
const HEADER_HEIGHT = 14
const MAX_SPEED_MS = 500
const MIN_SPEED_MS = 60
const SEPARATOR = '─'.repeat(CONTENT_WIDTH - 4)
const SPEED_STEP_MS = 40
const WARM_COLORS = ['#f59e0b', '#ef4444', '#ec4899', '#a855f7']

const RANK_DECORATORS: Record<number, { badge: string; color: string }> = {
  1: { badge: `${symbols.star}${symbols.star}${symbols.star}`, color: '#f59e0b' },
  2: { badge: `${symbols.star}${symbols.star}`, color: '#c0c0c0' },
  3: { badge: symbols.star, color: '#cd7f32' },
}

type CreditLine =
  | { type: 'blank' }
  | { type: 'text'; text: string; color: string; bold?: boolean }
  | { type: 'gradient'; text: string; gradientColors: readonly string[] }
  | { type: 'contributor'; rank: number; login: string; contributions: number }

function buildCreditLines(contributors: GitHubContributor[], stars: number): CreditLine[] {
  const lines: CreditLine[] = []

  lines.push({ type: 'blank' })
  lines.push({ type: 'text', text: 'A Tech Leads Club Production', color: '#94a3b8' })
  lines.push({ type: 'blank' })
  lines.push({ type: 'blank' })

  lines.push({
    type: 'gradient',
    text: `${symbols.sparkle}  C O N T R I B U T O R S  ${symbols.sparkle}`,
    gradientColors: WARM_COLORS,
  })

  lines.push({ type: 'gradient', text: SEPARATOR, gradientColors: CRYSTAL_COLORS })
  lines.push({ type: 'blank' })

  for (let i = 0; i < contributors.length; i++) {
    const c = contributors[i]
    lines.push({ type: 'contributor', rank: i + 1, login: c.login, contributions: c.contributions })
  }

  lines.push({ type: 'blank' })
  lines.push({ type: 'blank' })

  lines.push({ type: 'gradient', text: `${symbols.star}  S T A T S  ${symbols.star}`, gradientColors: WARM_COLORS })
  lines.push({ type: 'gradient', text: SEPARATOR, gradientColors: CRYSTAL_COLORS })
  lines.push({ type: 'blank' })

  if (stars > 0) {
    lines.push({ type: 'text', text: `${symbols.star}  GitHub Stars ····· ${stars}`, color: '#f59e0b', bold: true })
  }

  lines.push({ type: 'text', text: `${symbols.diamond}  Contributors ····· ${contributors.length}`, color: '#06b6d4' })
  const totalContribs = contributors.reduce((sum, c) => sum + c.contributions, 0)
  lines.push({ type: 'text', text: `${symbols.check}  Contributions ···· ${totalContribs}`, color: '#22c55e' })

  lines.push({ type: 'blank' })
  lines.push({ type: 'blank' })

  lines.push({
    type: 'gradient',
    text: `${symbols.sparkle}  S P E C I A L   T H A N K S  ${symbols.sparkle}`,
    gradientColors: WARM_COLORS,
  })

  lines.push({ type: 'gradient', text: SEPARATOR, gradientColors: CRYSTAL_COLORS })
  lines.push({ type: 'blank' })
  lines.push({ type: 'text', text: 'To every contributor, stargazer,', color: '#94a3b8' })
  lines.push({ type: 'text', text: 'and community member who makes', color: '#94a3b8' })
  lines.push({ type: 'text', text: 'this project possible.', color: '#94a3b8' })
  lines.push({ type: 'blank' })
  lines.push({ type: 'text', text: 'Built with \u2665  by the community', color: '#ef4444' })
  lines.push({ type: 'blank' })
  lines.push({ type: 'gradient', text: 'github.com/tech-leads-club/agent-skills', gradientColors: CRYSTAL_COLORS })
  lines.push({ type: 'blank' })
  lines.push({ type: 'blank' })
  lines.push({ type: 'blank' })

  return lines
}

function getAssetPath(): string | null {
  try {
    let dir = dirname(fileURLToPath(import.meta.url))
    for (let i = 0; i < 5; i++) {
      const candidate = join(dir, 'assets', 'chiptune.mp3')
      if (existsSync(candidate)) return candidate
      dir = dirname(dir)
    }
    return null
  } catch {
    return null
  }
}

function ContributorRow({ rank, login, contributions }: { rank: number; login: string; contributions: number }) {
  const decorator = RANK_DECORATORS[rank]
  const nameColor = decorator?.color ?? '#e2e8f0'
  const rankStr = rank.toString().padStart(2)
  const name = `@${login}`
  const contribStr = `${contributions}`
  const badgeSuffix = decorator ? ` ${decorator.badge}` : ''
  const usedLen = 4 + 1 + name.length + badgeSuffix.length + 1 + contribStr.length
  const dotsLen = Math.max(2, CONTENT_WIDTH - 4 - usedLen)
  const dots = '\u00b7'.repeat(dotsLen)

  return (
    <Text>
      <Text color="#64748b">{rankStr}. </Text>
      <Text color={nameColor} bold={!!decorator}>
        {name}
      </Text>
      <Text color={decorator?.color ?? '#94a3b8'}>{badgeSuffix}</Text>
      <Text color="#334155"> {dots} </Text>
      <Text color="#22c55e" bold>
        {contribStr}
      </Text>
    </Text>
  )
}

function CreditLineRenderer({ line }: { line: CreditLine }) {
  switch (line.type) {
    case 'blank':
      return <Text> </Text>
    case 'text':
      return (
        <Text color={line.color} bold={line.bold}>
          {line.text}
        </Text>
      )
    case 'gradient':
      return (
        <Gradient colors={[...line.gradientColors]}>
          <Text>{line.text}</Text>
        </Gradient>
      )
    case 'contributor':
      return <ContributorRow rank={line.rank} login={line.login} contributions={line.contributions} />
  }
}

function SpeedIndicator({ speed, paused }: { speed: number; paused: boolean }) {
  if (paused) {
    return (
      <Text color={colors.warning} bold>
        {' '}
        {symbols.bar}
        {symbols.bar} PAUSED
      </Text>
    )
  }

  const level = Math.round(((MAX_SPEED_MS - speed) / (MAX_SPEED_MS - MIN_SPEED_MS)) * 4) + 1
  const bars = '\u25AE'.repeat(level) + '\u25AF'.repeat(5 - level)
  return <Text color={colors.textMuted}> {bars}</Text>
}

export function CreditsView({ onExit }: CreditsViewProps) {
  const { stdout } = useStdout()
  const termRows = stdout?.rows ?? 24
  const scrollAreaHeight = Math.max(6, termRows - HEADER_HEIGHT - 4)

  const [contributors, setContributors] = useState<GitHubContributor[]>([])
  const [stars, setStars] = useState(0)
  const [loading, setLoading] = useState(true)
  const [scrollOffset, setScrollOffset] = useState(0)
  const [speed, setSpeed] = useState(BASE_SPEED_MS)
  const [paused, setPaused] = useState(false)

  const audioRef = useRef<ChildProcess | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    Promise.all([fetchContributors(), fetchRepoStars()]).then(([c, s]) => {
      setContributors(c)
      setStars(s)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    const assetPath = getAssetPath()
    if (assetPath) audioRef.current = play(assetPath)

    return () => {
      stop(audioRef.current)
    }
  }, [])

  const creditLines = useMemo(() => buildCreditLines(contributors, stars), [contributors, stars])
  const maxOffset = creditLines.length + scrollAreaHeight
  const finished = scrollOffset >= maxOffset

  const advance = useCallback(() => {
    setScrollOffset((prev) => (prev >= maxOffset ? prev : prev + 1))
  }, [maxOffset])

  useEffect(() => {
    if (loading || paused || finished) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
      return
    }

    intervalRef.current = setInterval(advance, speed)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [loading, paused, finished, speed, advance])

  useEffect(() => {
    if (!finished) return
    const timer = setTimeout(() => {
      stop(audioRef.current)
      onExit()
    }, 3000)

    return () => clearTimeout(timer)
  }, [finished, onExit])

  useInput((input, key) => {
    if (key.escape) {
      stop(audioRef.current)
      onExit()
      return
    }

    if (input === ' ') {
      setPaused((p) => !p)
      return
    }

    if (key.upArrow) {
      setSpeed((s) => Math.max(MIN_SPEED_MS, s - SPEED_STEP_MS))
      return
    }

    if (key.downArrow) {
      setSpeed((s) => Math.min(MAX_SPEED_MS, s + SPEED_STEP_MS))
      return
    }
  })

  if (loading) {
    return (
      <Box flexDirection="column" alignItems="center" padding={2}>
        <Text color={colors.accent}>Loading contributors...</Text>
      </Box>
    )
  }

  const blankLine: CreditLine = { type: 'blank' }
  const padTop = Array(scrollAreaHeight).fill(blankLine) as CreditLine[]
  const padBottom = Array(scrollAreaHeight).fill(blankLine) as CreditLine[]
  const allLines = [...padTop, ...creditLines, ...padBottom]
  const visibleSlice = allLines.slice(scrollOffset, scrollOffset + scrollAreaHeight)

  return (
    <Box flexDirection="column" alignItems="center">
      <Box marginBottom={-1}>
        <Gradient colors={['#1e3a8a', '#3b82f6']}>
          <BigText text="TLC" font="tiny" />
        </Gradient>
      </Box>
      <Box>
        <Gradient colors={[...CRYSTAL_COLORS]}>
          <BigText text="AGENT SKILLS" font="block" />
        </Gradient>
      </Box>
      <Box>
        <Gradient colors={[...CRYSTAL_COLORS]}>
          <Text>{'\u2500'.repeat(60)}</Text>
        </Gradient>
      </Box>

      <Box flexDirection="column" alignItems="center" height={scrollAreaHeight} width={CONTENT_WIDTH}>
        {visibleSlice.map((line, i) => (
          <Box key={`cl-${scrollOffset}-${i}`} justifyContent="center">
            <CreditLineRenderer line={line} />
          </Box>
        ))}
      </Box>

      <Box marginTop={1} gap={2}>
        <Text>
          <Text color={colors.accent} bold>
            space
          </Text>
          <Text color={colors.textDim}> pause</Text>
        </Text>
        <Text color={colors.textMuted}>{symbols.dot}</Text>
        <Text>
          <Text color={colors.accent} bold>
            {symbols.arrowUp}
            {symbols.arrowDown}
          </Text>
          <Text color={colors.textDim}> speed</Text>
        </Text>
        <SpeedIndicator speed={speed} paused={paused} />
        <Text color={colors.textMuted}>{symbols.dot}</Text>
        <Text>
          <Text color={colors.warning} bold>
            esc
          </Text>
          <Text color={colors.textDim}> back</Text>
        </Text>
      </Box>
    </Box>
  )
}
