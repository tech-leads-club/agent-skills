import chalk from 'chalk'
import { Box, Text, useInput, useStdout } from 'ink'
import Spinner from 'ink-spinner'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useSkillContent } from '../hooks/useSkillContent'
import { getColorForCategory } from '../services/category-colors'
import { parseMarkdown, type MarkdownToken } from '../services/markdown-parser'
import { colors, symbols } from '../theme'
import type { SkillInfo } from '../types'

export interface SkillDetailPanelProps {
  skill: SkillInfo | null
  expanded?: boolean
  onClose: () => void
  onToggleExpand?: () => void
}

const FIXED_HEADER_LINES = 6
const BORDER_LINES = 2
const INDICATOR_LINES = 2

const fmt = {
  h1: (s: string) => chalk.hex(colors.primary).bold(s),
  h2: (s: string) => chalk.hex(colors.primaryLight).bold(s),
  h3: (s: string) => chalk.hex(colors.accent).bold(s),
  text: (s: string) => chalk.hex(colors.textDim)(s),
  muted: (s: string) => chalk.hex(colors.textMuted)(s),
  code: (s: string) => chalk.hex(colors.accent)(s),
  border: (s: string) => chalk.hex(colors.border)(s),
  bold: (s: string) => chalk.hex(colors.text).bold(s),
  dim: (s: string) => chalk.dim(s),
  indicator: (s: string) => chalk.hex(colors.textDim)(s),
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, (_, t) => fmt.bold(t))
    .replace(/\*(.+?)\*/g, (_, t) => fmt.dim(t))
    .replace(/`(.+?)`/g, (_, t) => fmt.code(t))
}

function tokensToLines(tokens: MarkdownToken[]): string[] {
  const lines: string[] = []
  for (const token of tokens) {
    switch (token.type) {
      case 'heading': {
        const sym = token.level === 1 ? symbols.diamond : token.level === 2 ? symbols.arrow : symbols.dot
        const colorFn = token.level === 1 ? fmt.h1 : token.level === 2 ? fmt.h2 : fmt.h3
        if (token.level === 1 && lines.length > 0) lines.push('')
        lines.push(colorFn(`${sym} ${token.text}`))
        break
      }
      case 'paragraph':
        lines.push(fmt.text(formatInline(token.text)))
        break
      case 'list-item': {
        const indent = '  '.repeat(token.indent)
        lines.push(`${indent}${fmt.muted(symbols.bullet)} ${fmt.text(formatInline(token.text))}`)
        break
      }
      case 'code-block':
        if (token.language) lines.push(fmt.dim(`  ${token.language}`))
        for (const line of token.lines) {
          lines.push(`  ${fmt.border(symbols.bar)} ${fmt.code(line)}`)
        }
        break
      case 'hr':
        lines.push(fmt.border('─'.repeat(30)))
        break
      case 'blank':
        lines.push('')
        break
    }
  }
  return lines
}

const MetadataHeader = React.memo(
  ({ skill, metadata }: { skill: SkillInfo; metadata: { author?: string; files: string[] } | null }) => {
    const categoryColor = getColorForCategory(skill.category ?? 'default')
    const author = metadata?.author ? ` ${symbols.dot} @${metadata.author}` : ''
    const files = metadata?.files?.length
      ? ` ${symbols.dot} ${metadata.files.length} file${metadata.files.length !== 1 ? 's' : ''}`
      : ''

    return (
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color={colors.text}>
          {symbols.sparkle} {skill.name}
        </Text>
        <Text>
          <Text color={categoryColor} bold>
            {skill.category}
          </Text>
          <Text color={colors.textDim}>
            {author}
            {files}
          </Text>
        </Text>
        <Text color={colors.textDim} wrap="truncate">
          {skill.description}
        </Text>
      </Box>
    )
  },
)
MetadataHeader.displayName = 'MetadataHeader'

export const SkillDetailPanel = React.memo(
  ({ skill, expanded = false, onClose, onToggleExpand }: SkillDetailPanelProps) => {
    const { metadata, content, loading, error } = useSkillContent(skill?.name ?? null)
    const { stdout } = useStdout()
    const [scrollOffset, setScrollOffset] = useState(0)

    const terminalRows = stdout?.rows ?? 24
    const formattedLines = useMemo(() => (content ? tokensToLines(parseMarkdown(content)) : []), [content])

    const containerHeight = Math.max(10, terminalRows - 17)
    const scrollAreaHeight = Math.max(3, containerHeight - FIXED_HEADER_LINES - BORDER_LINES)
    const contentVisibleLines = Math.max(1, scrollAreaHeight - INDICATOR_LINES)

    const maxScroll = Math.max(0, formattedLines.length - contentVisibleLines)
    const canScroll = maxScroll > 0

    const scrollPercent = canScroll
      ? Math.round(((scrollOffset + contentVisibleLines) / formattedLines.length) * 100)
      : 100

    const maxScrollRef = useRef(maxScroll)
    maxScrollRef.current = maxScroll
    const onCloseRef = useRef(onClose)
    onCloseRef.current = onClose
    const onToggleExpandRef = useRef(onToggleExpand)
    onToggleExpandRef.current = onToggleExpand

    const handleInput = useCallback(
      (
        input: string,
        key: { upArrow: boolean; downArrow: boolean; escape: boolean; tab: boolean; leftArrow: boolean },
      ) => {
        if (key.upArrow) {
          setScrollOffset((prev) => Math.max(0, prev - 1))
        } else if (key.downArrow) {
          setScrollOffset((prev) => Math.min(maxScrollRef.current, prev + 1))
        } else if (input === 'f') {
          onToggleExpandRef.current?.()
        } else if (key.escape || key.tab || key.leftArrow) {
          onCloseRef.current()
        }
      },
      [],
    )

    useInput(handleInput)

    useEffect(() => {
      setScrollOffset(0)
    }, [skill?.name])

    if (!skill) return null

    const hasAbove = scrollOffset > 0
    const hasMore = scrollOffset + contentVisibleLines < formattedLines.length
    const visibleSlice = formattedLines.slice(scrollOffset, scrollOffset + contentVisibleLines)

    return (
      <Box flexDirection="column" borderStyle="round" borderColor={colors.accent} paddingX={1} flexGrow={1}>
        <Box>
          <Text bold color={colors.accent}>
            {symbols.info} Skill Details
          </Text>
          <Box flexGrow={1} />
          <Text color={colors.textMuted}>
            {canScroll && (
              <Text color={colors.textDim}>
                {scrollPercent}% {symbols.dot}{' '}
              </Text>
            )}
            <Text color={colors.accent} bold>
              ↑↓
            </Text>{' '}
            scroll {symbols.dot}{' '}
            <Text color={colors.accent} bold>
              f
            </Text>{' '}
            {expanded ? 'compact' : 'expand'} {symbols.dot}{' '}
            <Text color={colors.accent} bold>
              Esc
            </Text>{' '}
            close
          </Text>
        </Box>

        <Text color={colors.border} wrap="truncate">
          {'─'.repeat(200)}
        </Text>

        {loading ? (
          <Box alignItems="center" justifyContent="center" flexGrow={1}>
            <Text color={colors.accent}>
              <Spinner type="dots" /> Loading…
            </Text>
          </Box>
        ) : error ? (
          <Box alignItems="center" justifyContent="center" flexGrow={1}>
            <Text color={colors.error}>
              {symbols.cross} {error}
            </Text>
          </Box>
        ) : (
          <>
            <MetadataHeader skill={skill} metadata={metadata} />

            <Box flexDirection="column" height={scrollAreaHeight} overflowY="hidden">
              {hasAbove && (
                <Text color={colors.textDim}>{`       ${symbols.arrowUp} ${symbols.arrowUp} ${symbols.arrowUp}`}</Text>
              )}
              <Text>{visibleSlice.join('\n')}</Text>
              {hasMore && (
                <Text color={colors.textDim}>
                  {`       ${symbols.arrowDown} ${symbols.arrowDown} ${symbols.arrowDown}`}
                </Text>
              )}
            </Box>
          </>
        )}
      </Box>
    )
  },
)

SkillDetailPanel.displayName = 'SkillDetailPanel'
