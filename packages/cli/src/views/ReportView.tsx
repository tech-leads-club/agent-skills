import { Box, Text, useInput } from 'ink'
import Spinner from 'ink-spinner'
import { useCallback, useState } from 'react'

import { Header } from '../components/Header'
import {
  AgentOverviewSection,
  McpServersSection,
  RecommendationsSection,
  ReportHeader,
  SectionContainer,
  SkillsInventorySection,
  TokenCostSection,
} from '../components/report'
import { useReport } from '../hooks/useReport'
import { colors } from '../theme'
import { symbols } from '../theme/symbols'

const SECTIONS = [
  'Agent Overview',
  'Skills Inventory',
  'Token Cost Analysis',
  'MCP Servers',
  'Recommendations',
] as const

interface Props {
  onExit: () => void
}

export function ReportView({ onExit }: Props) {
  const { report, loading, error } = useReport()
  const [focusedSection, setFocusedSection] = useState(0)
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set())

  const toggleSection = useCallback(
    (idx: number) => {
      setExpandedSections((prev) => {
        const next = new Set(prev)
        if (next.has(idx)) {
          next.delete(idx)
        } else {
          next.add(idx)
        }
        return next
      })
    },
    [],
  )

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      onExit()
      return
    }

    if (key.upArrow) {
      setFocusedSection((prev) => Math.max(0, prev - 1))
    } else if (key.downArrow) {
      setFocusedSection((prev) => Math.min(SECTIONS.length - 1, prev + 1))
    } else if (key.return) {
      toggleSection(focusedSection)
    }
  })

  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header
          notification={
            <Text color={colors.accent}>
              <Spinner type="dots" /> Scanning AI integrations...
            </Text>
          }
        />
      </Box>
    )
  }

  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header />
        <Text color={colors.error}>
          {symbols.cross} Failed to generate report: {error}
        </Text>
      </Box>
    )
  }

  if (!report) return null

  return (
    <Box flexDirection="column" padding={1}>
      <Header
        notification={
          <Text color={colors.accent} bold>
            Audit Report
          </Text>
        }
      />

      <ReportHeader summary={report.summary} />

      <SectionContainer
        title={SECTIONS[0]}
        count={report.agents.length}
        expanded={expandedSections.has(0)}
        focused={focusedSection === 0}
      >
        <AgentOverviewSection agents={report.agents} />
      </SectionContainer>

      <SectionContainer
        title={SECTIONS[1]}
        count={report.skills.filter((s) => s.physicallyPresent).length}
        expanded={expandedSections.has(1)}
        focused={focusedSection === 1}
      >
        <SkillsInventorySection skills={report.skills} tokenEstimates={report.tokenEstimates} />
      </SectionContainer>

      <SectionContainer
        title={SECTIONS[2]}
        count={report.tokenEstimates.length}
        expanded={expandedSections.has(2)}
        focused={focusedSection === 2}
      >
        <TokenCostSection tokenEstimates={report.tokenEstimates} costEstimates={report.costEstimates} summary={report.summary} />
      </SectionContainer>

      <SectionContainer
        title={SECTIONS[3]}
        count={report.mcpServers.length}
        expanded={expandedSections.has(3)}
        focused={focusedSection === 3}
      >
        <McpServersSection servers={report.mcpServers} conflicts={report.mcpConflicts} />
      </SectionContainer>

      <SectionContainer
        title={SECTIONS[4]}
        count={report.recommendations.length}
        expanded={expandedSections.has(4)}
        focused={focusedSection === 4}
      >
        <RecommendationsSection recommendations={report.recommendations} />
      </SectionContainer>

      <Box marginTop={1}>
        <Text color={colors.textMuted}>
          {symbols.arrowUp}/{symbols.arrowDown} navigate {symbols.dot} enter expand/collapse {symbols.dot} q quit
        </Text>
      </Box>
    </Box>
  )
}
