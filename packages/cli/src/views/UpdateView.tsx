import { Box, Text, useInput } from 'ink'
import Spinner from 'ink-spinner'
import { useAtomValue } from 'jotai'
import { useEffect, useMemo, useState } from 'react'

import { deprecatedSkillsAtom } from '../atoms/deprecatedSkills'
import { installedSkillsAtom } from '../atoms/installedSkills'
import { Header } from '../components/Header'
import { InstallResults } from '../components/InstallResults'
import { MultiSelectPrompt } from '../components/MultiSelectPrompt'
import { useInstaller } from '../hooks/useInstaller'
import { useSkills } from '../hooks/useSkills'
import { getUpdatableSkills } from '../services/registry'
import { colors, symbols } from '../theme'
import type { AgentType, DeprecatedEntry, SkillInfo } from '../types'
import { AgentSelector } from './AgentSelector'

export function UpdateView({ selectedAgents, onExit }: { selectedAgents?: AgentType[]; onExit: () => void }) {
  const [checkingUpdates, setCheckingUpdates] = useState(false)
  const [updateCheckComplete, setUpdateCheckComplete] = useState(false)
  const [installComplete, setInstallComplete] = useState(false)
  const [internalAgents, setInternalAgents] = useState<AgentType[]>(selectedAgents || [])
  const [showAgentSelect, setShowAgentSelect] = useState(!selectedAgents)
  const [updatableSkills, setUpdatableSkills] = useState<SkillInfo[]>([])
  const { install, progress, results, installing } = useInstaller()
  const installedSkills = useAtomValue(installedSkillsAtom)
  const deprecatedMap = useAtomValue(deprecatedSkillsAtom)
  const { skills, loading: loadingSkills } = useSkills()

  const activeAgents = selectedAgents || internalAgents

  const installedList = useMemo(() => {
    if (loadingSkills) return []
    const installedNames = new Set(Object.keys(installedSkills))

    return skills.filter((s) => {
      if (!installedNames.has(s.name)) return false
      const agents = installedSkills[s.name] || []
      return agents.some((a: AgentType) => activeAgents.includes(a))
    })
  }, [installedSkills, skills, loadingSkills, activeAgents])

  const deprecatedInstalled = useMemo(() => {
    if (loadingSkills || !(deprecatedMap instanceof Map) || deprecatedMap.size === 0) return []
    const installedNames = new Set(Object.keys(installedSkills))
    const registryNames = new Set(skills.map((s) => s.name))

    const result: { name: string; entry?: DeprecatedEntry }[] = []

    for (const name of installedNames) {
      if (deprecatedMap.has(name)) result.push({ name, entry: deprecatedMap.get(name) })
      else if (!registryNames.has(name)) result.push({ name })
    }

    return result
  }, [installedSkills, skills, loadingSkills, deprecatedMap])

  useEffect(() => {
    if (installedList.length === 0) {
      setCheckingUpdates(false)
      setUpdateCheckComplete(true)
      return
    }

    setCheckingUpdates(true)
    const checkUpdates = async () => {
      const installedNames = installedList.map((s) => s.name)
      const { toUpdate } = await getUpdatableSkills(installedNames)
      const skillsToUpdate = installedList.filter((s) => toUpdate.includes(s.name))
      setUpdatableSkills(skillsToUpdate)
      setCheckingUpdates(false)
      setUpdateCheckComplete(true)
    }

    checkUpdates()
  }, [installedList])

  useInput((_, key) => {
    if (
      key.escape &&
      !installing &&
      !installComplete &&
      !checkingUpdates &&
      updateCheckComplete &&
      updatableSkills.length === 0
    ) {
      onExit()
    }
  })

  if (showAgentSelect) {
    return (
      <AgentSelector
        onSelect={(agents) => {
          setInternalAgents(agents)
          setShowAgentSelect(false)
        }}
        onBack={onExit}
      />
    )
  }

  const handleUpdate = async (selectedSkills: SkillInfo[]) => {
    if (selectedSkills.length === 0) return

    const involvedAgents = new Set<AgentType>()
    selectedSkills.forEach((s) => {
      const agents = installedSkills[s.name] || []
      agents.forEach((a: AgentType) => {
        if (activeAgents.includes(a)) involvedAgents.add(a)
      })
    })

    await install(selectedSkills, {
      agents: Array.from(involvedAgents),
      method: 'copy',
      global: false,
      skills: selectedSkills.map((s) => s.name),
      isUpdate: true,
    })
    setInstallComplete(true)
  }

  if (installComplete) {
    return (
      <InstallResults results={results} onExit={onExit} title="Skills Updated Successfully" successLabel="updated" />
    )
  }

  if (installing) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Header />
        <Box marginTop={1}>
          <Text color={colors.accent}>
            <Spinner type="dots" />{' '}
          </Text>
          <Text>Updating skills...</Text>
        </Box>
        <Box marginTop={1} paddingX={2}>
          <Text color={colors.textDim}>
            {symbols.arrow} {progress.skill} ({progress.current}/{progress.total})
          </Text>
        </Box>
      </Box>
    )
  }

  if (loadingSkills || checkingUpdates) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Header />
        <Box marginTop={1}>
          <Text color={colors.accent}>
            <Spinner type="dots" /> {checkingUpdates ? 'Checking for updates...' : 'Loading...'}
          </Text>
        </Box>
      </Box>
    )
  }

  if (updateCheckComplete && updatableSkills.length === 0) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Header />
        <Box borderStyle="round" borderColor={colors.success} paddingX={2} paddingY={1}>
          <Text color={colors.success}>{symbols.check} All installed skills are up to date!</Text>
        </Box>

        {deprecatedInstalled.length > 0 && (
          <Box
            flexDirection="column"
            marginTop={1}
            borderStyle="round"
            borderColor={colors.warning}
            paddingX={2}
            paddingY={1}
          >
            <Box marginBottom={1}>
              <Text color={colors.warning} bold>
                {symbols.warning} {deprecatedInstalled.length} deprecated skill
                {deprecatedInstalled.length > 1 ? 's' : ''} detected:
              </Text>
            </Box>
            {deprecatedInstalled.map((d) => (
              <Box key={d.name} flexDirection="column" paddingX={1} marginBottom={1}>
                <Text color={colors.warning}>
                  {symbols.arrow} {d.name}
                </Text>
                {d.entry?.message && <Text color={colors.textDim}> {d.entry.message}</Text>}
                {!d.entry && <Text color={colors.textDim}> No longer available in the registry</Text>}
                {d.entry?.alternatives && d.entry.alternatives.length > 0 && (
                  <Text color={colors.textDim}>
                    {'  '}Try: agent-skills install --skill {d.entry.alternatives.join(', ')}
                  </Text>
                )}
              </Box>
            ))}
            <Text color={colors.textMuted}>Run: agent-skills remove --skill {'<name>'} to clean up</Text>
          </Box>
        )}

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

  return (
    <UpdateSelector
      skills={updatableSkills}
      installedSkills={installedSkills}
      selectedAgents={activeAgents}
      onUpdate={handleUpdate}
      onExit={onExit}
    />
  )
}

function UpdateSelector({
  skills,
  installedSkills,
  selectedAgents,
  onUpdate,
  onExit,
}: {
  skills: SkillInfo[]
  installedSkills: Record<string, AgentType[]>
  selectedAgents: AgentType[]
  onUpdate: (skills: SkillInfo[]) => void
  onExit: () => void
}) {
  const items = skills.map((s) => {
    const allAgents = installedSkills[s.name] || []
    const filteredAgents = allAgents.filter((a) => selectedAgents.includes(a))
    return {
      label: s.name,
      value: s.name,
      hint: `${filteredAgents.length} agent${filteredAgents.length > 1 ? 's' : ''}: ${filteredAgents.join(', ')}`,
    }
  })

  const allValues = skills.map((s) => s.name)

  const handleSubmit = (selectedNames: string[]) => {
    const selectedSkills = skills.filter((s) => selectedNames.includes(s.name))
    onUpdate(selectedSkills)
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Header />
      <Box marginBottom={1}>
        <Text bold color={colors.primary}>
          {symbols.diamond} Select skills to update:
        </Text>
      </Box>
      <Box marginBottom={1}>
        <Text color={colors.textDim}>
          {skills.length} installed skill{skills.length > 1 ? 's' : ''} found {symbols.dot} all pre-selected
        </Text>
      </Box>
      <MultiSelectPrompt items={items} initialSelected={allValues} onSubmit={handleSubmit} onCancel={onExit} />
    </Box>
  )
}
