import { Box, Text, useInput } from 'ink'
import Spinner from 'ink-spinner'
import { useAtomValue } from 'jotai'
import { useMemo, useState } from 'react'

import { Header } from '../components/Header'
import { MultiSelectPrompt } from '../components/MultiSelectPrompt'
import { SelectPrompt } from '../components/SelectPrompt'
import { useRemover } from '../hooks/useRemover'
import { colors, symbols } from '../theme'
import type { AgentType } from '../types'
import { AgentSelector } from './AgentSelector'

import { deprecatedSkillsAtom } from '../atoms/deprecatedSkills'
import { installedSkillsAtom } from '../atoms/installedSkills'

export function RemoveWizard({ selectedAgents, onExit }: { selectedAgents?: AgentType[]; onExit: () => void }) {
  const [internalAgents, setInternalAgents] = useState<AgentType[]>(selectedAgents || [])
  const { removeMultiple, progress, results } = useRemover()

  const installedSkills = useAtomValue(installedSkillsAtom)
  const deprecatedMap = useAtomValue(deprecatedSkillsAtom)

  const [step, setStep] = useState<'agent-select' | 'select' | 'confirm' | 'removing' | 'done'>(
    selectedAgents ? 'select' : 'agent-select',
  )

  const [selectedToRemove, setSelectedToRemove] = useState<string[]>([])
  const activeAgents = selectedAgents || internalAgents

  const filteredSkills = useMemo(() => {
    const filtered: Record<string, AgentType[]> = {}
    Object.entries(installedSkills).forEach(([skillName, agents]) => {
      const matchingAgents = agents.filter((a: AgentType) => activeAgents.includes(a))
      if (matchingAgents.length > 0) filtered[skillName] = matchingAgents
    })
    return filtered
  }, [installedSkills, activeAgents])

  const skillNames = useMemo(() => Object.keys(filteredSkills), [filteredSkills])

  const selectItems = useMemo(() => {
    return skillNames.map((name) => {
      const isDeprecated = deprecatedMap instanceof Map && deprecatedMap.has(name)
      const agentHint = `${filteredSkills[name].length} agents: ${filteredSkills[name].join(', ')}`
      const hint = isDeprecated ? `${agentHint} ⚠ deprecated` : agentHint
      return { label: name, value: name, hint }
    })
  }, [skillNames, filteredSkills, deprecatedMap])

  useInput((_, key) => {
    if (step === 'done' && (key.return || key.escape)) onExit()
    if (skillNames.length === 0 && key.escape) onExit()
  })

  if (step === 'agent-select') {
    return (
      <AgentSelector
        onSelect={(agents) => {
          setInternalAgents(agents)
          setStep('select')
        }}
        onBack={onExit}
      />
    )
  }

  if (skillNames.length === 0) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Header />
        <Box borderStyle="round" borderColor={colors.warning} paddingX={2} paddingY={1}>
          <Text color={colors.warning}>No skills found to remove for the selected agents.</Text>
        </Box>
        <Box marginTop={1} borderStyle="round" borderColor={colors.border} paddingX={1}>
          <Text>
            <Text color={colors.warning} bold>
              esc
            </Text>
            <Text color={colors.textDim}> exit</Text>
          </Text>
        </Box>
      </Box>
    )
  }

  const handleSelect = (selected: string[]) => {
    if (selected.length === 0) return
    setSelectedToRemove(selected)
    setStep('confirm')
  }

  const executeRemoval = async () => {
    setStep('removing')
    const targets = selectedToRemove.map((name) => ({ name, agents: filteredSkills[name] || [] }))
    await removeMultiple(targets)
    setStep('done')
  }

  if (step === 'select') {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Header />
        <Box marginBottom={1}>
          <Text bold color={colors.error}>
            {symbols.diamond} Select skills to remove:
          </Text>
        </Box>
        <MultiSelectPrompt items={selectItems} onSubmit={handleSelect} onCancel={onExit} />
      </Box>
    )
  }

  if (step === 'confirm') {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Header />

        <Box flexDirection="column" borderStyle="round" borderColor={colors.error} paddingX={2} paddingY={1}>
          <Box marginBottom={1}>
            <Text color={colors.error} bold>
              {symbols.cross} Remove {selectedToRemove.length} skill{selectedToRemove.length > 1 ? 's' : ''}?
            </Text>
          </Box>

          {selectedToRemove.map((s) => (
            <Box key={s} paddingX={1}>
              <Box width={2}>
                <Text color={colors.error}>{symbols.dot}</Text>
              </Box>
              <Text color={colors.textDim}>{s}</Text>
            </Box>
          ))}
        </Box>

        <Box marginTop={1}>
          <SelectPrompt
            items={[
              { label: 'Yes, remove them', value: 'yes' },
              { label: 'No, cancel', value: 'no' },
            ]}
            onSelect={(val) => {
              if (val === 'yes') executeRemoval()
              else setStep('select')
            }}
          />
        </Box>
      </Box>
    )
  }

  if (step === 'removing') {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Header />
        <Box marginTop={1}>
          <Text color={colors.accent}>
            <Spinner type="dots" />{' '}
          </Text>
          <Text>Removing skills...</Text>
        </Box>
        <Box marginTop={1} paddingX={2}>
          <Text color={colors.textDim}>
            {symbols.arrow} {progress.skill} ({progress.current}/{progress.total})
          </Text>
        </Box>
      </Box>
    )
  }

  if (step === 'done') {
    const successCount = results.filter((r) => r.success).length
    const failCount = results.filter((r) => !r.success).length
    const allFailed = successCount === 0

    return (
      <Box flexDirection="column" paddingX={1}>
        <Header />

        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={allFailed ? colors.error : colors.success}
          paddingX={2}
          paddingY={1}
        >
          <Box marginBottom={1}>
            <Text color={allFailed ? colors.error : colors.success} bold>
              {allFailed ? symbols.cross : symbols.check} {allFailed ? 'Removal Failed' : 'Removal Complete'}
            </Text>
          </Box>

          {results.map((res, i) => (
            <Box key={i} paddingX={1}>
              <Box width={2}>
                <Text color={res.success ? colors.success : colors.error}>
                  {res.success ? symbols.check : symbols.cross}
                </Text>
              </Box>
              <Text color={res.success ? colors.text : colors.error}>{res.skill}</Text>
              <Text color={colors.textDim}>
                {' '}
                {symbols.arrow} {res.agent}
              </Text>
              {!res.success && res.error && <Text color={colors.error}> ({res.error})</Text>}
            </Box>
          ))}

          {(successCount > 0 || failCount > 0) && (
            <Box marginTop={1}>
              <Text color={colors.textDim}>
                {successCount > 0 && <Text color={colors.success}>{successCount} succeeded</Text>}
                {successCount > 0 && failCount > 0 && <Text> {symbols.dot} </Text>}
                {failCount > 0 && <Text color={colors.error}>{failCount} failed</Text>}
              </Text>
            </Box>
          )}
        </Box>

        <Box marginTop={1} borderStyle="round" borderColor={colors.border} paddingX={1}>
          <Text>
            <Text color={colors.success} bold>
              enter
            </Text>
            <Text color={colors.textDim}> / </Text>
            <Text color={colors.warning} bold>
              esc
            </Text>
            <Text color={colors.textDim}> exit</Text>
          </Text>
        </Box>
      </Box>
    )
  }

  return null
}
