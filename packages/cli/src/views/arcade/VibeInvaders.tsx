import { Box, Text, useInput, useStdout } from 'ink'
import { useCallback, useEffect, useRef, useState } from 'react'

import { colors } from '../../theme'

const MAX_WIDTH = 100
const GAME_HEIGHT = 16
const TICK_MS = 50
const BASE_MOVE_EVERY = 10
const RATE_LIMIT_PENALTY = 30
const SNIPER_MULTIPLIER = 5

const LOSE_MESSAGES = [
  'BANKRUPT. Your burn rate was too high.',
  'DOWN ROUND. Valuation dropped to zero.',
  'RUNWAY EXPIRED. Back to living with parents.',
  'SERVER COSTS > REVENUE. You are cooked.',
  'AUDIT FAILED. Too much tech debt.',
]

const WIN_MESSAGES = [
  'ACQUIRED BY BIG TECH. Golden handcuffs on.',
  'SERIES B SECURED. Keep burning cash!',
  'IPO SUCCESSFUL. Time to buy a yacht.',
  'PROFITABLE? No, but the vibes are great.',
]

const INVADER_ROWS: string[][] = [
  ['AGI_SOON', '100x_DEV', 'LOVABLE', 'HYPE'],
  ['DEEPSEEK', 'GEMINI', 'GPT', 'V0_DEV'],
  ['TAB_SPAM', 'NO_READ', 'TRUST_ME', 'YOLO'],
  ['SLOP', 'SPAGHETTI', 'ANY_TYPE', 'BUG'],
]

interface Position {
  x: number
  y: number
}

interface Invader extends Position {
  label: string
  alive: boolean
  width: number
}

interface GameState {
  player: Position
  playerBullets: Position[]
  enemyBullets: Position[]
  invaders: Invader[]
  score: number
  lives: number
  gameOver: boolean
  won: boolean
  invaderDirection: 1 | -1
  tickCount: number
  flash: boolean
  glitch: boolean
  rateLimited: number
}

function createInvaders(cols: number): Invader[] {
  const invaders: Invader[] = []
  const longestWord = Math.max(...INVADER_ROWS.flat().map((w) => w.length))
  const colSpacing = longestWord + 4
  const totalWidth = INVADER_ROWS[0].length * colSpacing
  const startX = Math.floor((cols - totalWidth) / 2)

  for (let row = 0; row < INVADER_ROWS.length; row++) {
    for (let col = 0; col < INVADER_ROWS[row].length; col++) {
      const label = INVADER_ROWS[row][col]
      invaders.push({
        x: Math.max(0, startX + col * colSpacing),
        y: 1 + row * 2,
        label,
        width: label.length,
        alive: true,
      })
    }
  }

  return invaders
}

interface VibeInvadersProps {
  onExit: () => void
}

export function VibeInvaders({ onExit }: VibeInvadersProps) {
  const { stdout } = useStdout()

  const terminalCols = stdout?.columns ?? 80
  const gameWidth = Math.max(60, Math.min(terminalCols - 4, MAX_WIDTH))
  const finalMessageRef = useRef<string>('')

  const [state, setState] = useState<GameState>(() => ({
    player: { x: Math.floor(gameWidth / 2), y: GAME_HEIGHT - 1 },
    playerBullets: [],
    enemyBullets: [],
    invaders: createInvaders(gameWidth),
    score: 0,
    lives: 5,
    gameOver: false,
    won: false,
    invaderDirection: 1,
    tickCount: 0,
    flash: false,
    glitch: false,
    rateLimited: 0,
  }))

  if ((state.gameOver || state.won) && !finalMessageRef.current) {
    const pool = state.won ? WIN_MESSAGES : LOSE_MESSAGES
    finalMessageRef.current = pool[Math.floor(Math.random() * pool.length)]
  }

  useInput((input, key) => {
    if (state.gameOver || state.won) {
      if (key.return || key.escape) onExit()
      return
    }

    if (key.escape) {
      onExit()
      return
    }

    setState((prev) => {
      let newX = prev.player.x
      if (key.leftArrow) newX = Math.max(0, prev.player.x - 2)
      if (key.rightArrow) newX = Math.min(gameWidth - 1, prev.player.x + 2)

      let newBullets = prev.playerBullets
      let currentRateLimit = prev.rateLimited

      if (input === ' ' && currentRateLimit === 0) {
        if (prev.playerBullets.length >= 2) {
          currentRateLimit = RATE_LIMIT_PENALTY
          newBullets = []
        } else {
          newBullets = [...prev.playerBullets, { x: newX, y: prev.player.y - 1 }]
        }
      }

      return { ...prev, player: { ...prev.player, x: newX }, playerBullets: newBullets, rateLimited: currentRateLimit }
    })
  })

  const tick = useCallback(() => {
    setState((prev) => {
      if (prev.gameOver || prev.won) return prev

      const tick = prev.tickCount + 1
      let score = prev.score
      let lives = prev.lives
      let gameOver: boolean = prev.gameOver
      let flash = false
      let glitch = false
      const rateLimited = prev.rateLimited > 0 ? prev.rateLimited - 1 : 0

      // Logic
      const aliveInvaders = prev.invaders.filter((i) => i.alive)
      const totalInvaders = INVADER_ROWS.flat().length
      const survivalRatio = aliveInvaders.length / totalInvaders
      const moveEvery = Math.max(2, Math.floor(BASE_MOVE_EVERY * survivalRatio) + 1)
      const shootChance = 0.02 + 0.08 * (1 - survivalRatio)

      // Bullets
      let pBullets = prev.playerBullets.map((b) => ({ ...b, y: b.y - 1 })).filter((b) => b.y >= 0)
      let eBullets = prev.enemyBullets.map((b) => ({ ...b, y: b.y + 1 })).filter((b) => b.y < GAME_HEIGHT)

      const invaders = prev.invaders.map((i) => ({ ...i }))

      // Collisions: Player -> Invader
      for (const b of pBullets) {
        if (b.y === -1) continue
        for (const inv of invaders) {
          if (!inv.alive) continue
          if (b.y === inv.y && b.x >= inv.x && b.x < inv.x + inv.width) {
            inv.alive = false
            b.y = -1
            score += 100
            flash = true
            break
          }
        }
      }

      pBullets = pBullets.filter((b) => b.y !== -1)

      // Collisions: Enemy -> Player
      if (eBullets.some((b) => b.x === prev.player.x && b.y === prev.player.y)) {
        lives -= 1
        flash = true
        glitch = true
        eBullets = []
        if (lives <= 0) gameOver = true
      }

      // Win?
      if (invaders.every((i) => !i.alive)) return { ...prev, won: true, score: score + lives * 1000, invaders }

      // Shoot
      if (aliveInvaders.length > 0) {
        const shooters = aliveInvaders.filter((inv) => {
          const inSight = prev.player.x >= inv.x - 1 && prev.player.x <= inv.x + inv.width + 1
          return Math.random() < (inSight ? shootChance * SNIPER_MULTIPLIER : shootChance)
        })

        if (shooters.length > 0) {
          const s = shooters[Math.floor(Math.random() * shooters.length)]
          eBullets.push({ x: s.x + Math.floor(s.width / 2), y: s.y + 1 })
        }
      }

      // Move
      let dir = prev.invaderDirection

      if (tick % moveEvery === 0) {
        const xs = invaders.filter((i) => i.alive).map((i) => i.x)
        const minX = Math.min(...xs)
        const maxX = Math.max(...invaders.filter((i) => i.alive).map((i) => i.x + i.width))
        if (maxX >= gameWidth - 2 && dir === 1) dir = -1
        if (minX <= 0 && dir === -1) dir = 1
        invaders.forEach((i) => i.alive && (i.x += dir))
      }

      // Drop
      if (tick % 45 === 0) {
        invaders.forEach((i) => i.alive && (i.y += 1))
        if (invaders.some((i) => i.alive && i.y >= GAME_HEIGHT - 1)) gameOver = true
      }

      return {
        ...prev,
        playerBullets: pBullets,
        enemyBullets: eBullets,
        invaders,
        score,
        lives,
        gameOver,
        invaderDirection: dir,
        tickCount: tick,
        flash,
        glitch,
        rateLimited,
      }
    })
  }, [gameWidth])

  useEffect(() => {
    const t = setInterval(tick, TICK_MS)
    return () => clearInterval(t)
  }, [tick])

  const renderGrid = () => {
    const rows = Array.from({ length: GAME_HEIGHT }, () => Array(gameWidth).fill(' '))

    state.invaders.forEach((inv) => {
      if (inv.alive) {
        for (let i = 0; i < inv.width; i++) {
          if (inv.x + i < gameWidth && inv.y < GAME_HEIGHT) rows[inv.y][inv.x + i] = state.glitch ? '?' : inv.label[i]
        }
      }
    })

    state.playerBullets.forEach((b) => {
      if (b.x < gameWidth && b.y < GAME_HEIGHT) rows[b.y][b.x] = '$'
    })

    state.enemyBullets.forEach((b) => {
      if (b.x < gameWidth && b.y < GAME_HEIGHT) rows[b.y][b.x] = '*'
    })

    const { x, y } = state.player
    if (x < gameWidth && y < GAME_HEIGHT) rows[y][x] = state.rateLimited > 0 ? 'X' : '^'
    return rows.map((r) => r.join('')).join('\n')
  }

  const statusColor = state.rateLimited > 0 ? colors.error : colors.accent
  const gridColor = state.glitch ? colors.warning : state.flash ? colors.error : colors.success

  return (
    <Box width="100%" alignItems="center" flexDirection="column">
      <Box width={gameWidth + 4} flexDirection="column" alignItems="center">
        <Box width={gameWidth} flexDirection="row" paddingX={1}>
          <Box width="35%">
            <Text color={statusColor} bold>
              {state.rateLimited > 0 ? `LIMIT (${state.rateLimited})` : `$${state.score}k`}
            </Text>
          </Box>
          <Box width="30%" justifyContent="center">
            <Text color={colors.warning} bold>
              VIBE INVADERS
            </Text>
          </Box>
          <Box width="35%" justifyContent="flex-end">
            <Text color={colors.success} bold>
              RUNWAY: {'$'.repeat(state.lives)}
            </Text>
          </Box>
        </Box>

        <Box
          borderStyle="round"
          borderColor={state.rateLimited > 0 ? colors.error : colors.border}
          flexDirection="column"
          width={gameWidth + 2}
          height={GAME_HEIGHT + 2}
        >
          <Text color={state.gameOver ? colors.error : gridColor}>{renderGrid()}</Text>
        </Box>

        <Box
          marginTop={0}
          width={gameWidth + 2}
          justifyContent="center"
          borderStyle="round"
          borderColor={colors.accent}
        >
          {state.gameOver || state.won ? (
            <Text color={state.won ? colors.success : colors.error} bold>
              {finalMessageRef.current} Val: ${state.score}k
            </Text>
          ) : (
            <Box gap={1}>
              <Text color={colors.accent}>←→</Text>
              <Text> move </Text>
              <Text color={colors.accent}>spc</Text>
              <Text> shoot </Text>
              <Text color={colors.accent}>esc</Text>
              <Text> quit</Text>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
