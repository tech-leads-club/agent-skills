import { Box, Text, useInput } from 'ink'
import Spinner from 'ink-spinner'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useMemo, useState } from 'react'

import { installedSkillsAtom, installedSkillsRefreshAtom } from '../atoms/installedSkills'
import { selectedAgentsAtom, selectedSkillsAtom } from '../atoms/wizard'
import { Header } from '../components/Header'
import { InstallResults } from '../components/InstallResults'
import { useInstaller } from '../hooks/useInstaller'
import { useSkills } from '../hooks/useSkills'
import { useWizardStep } from '../hooks/useWizardStep'
import { colors, symbols } from '../theme'
import type { AgentType, SkillInfo } from '../types'
import { ActionSelector } from './ActionSelector'
import { AgentSelector } from './AgentSelector'
import { CreditsView } from './CreditsView'
import { InstallConfig } from './InstallConfig'
import { RemoveWizard } from './RemoveWizard'
import { SkillBrowser } from './SkillBrowser'
import { UpdateView } from './UpdateView'

export function InstallWizard({ onExit }: { onExit: () => void }) {
  const { step, next, back } = useWizardStep(5)
  const [selectedAgents, setSelectedAgents] = useAtom(selectedAgentsAtom)
  const [selectedSkills, setSelectedSkills] = useAtom(selectedSkillsAtom)
  const refreshInstalledSkills = useSetAtom(installedSkillsRefreshAtom)
  const installedSkills = useAtomValue(installedSkillsAtom)
  const [action, setAction] = useState<'install' | 'update' | 'remove'>('install')
  const [showCredits, setShowCredits] = useState(false)
  const [showUpdate, setShowUpdate] = useState(false)
  const [showRemove, setShowRemove] = useState(false)
  const [installConfig, setInstallConfig] = useState<{ method: 'copy' | 'symlink'; global: boolean }>({
    method: 'copy',
    global: false,
  })

  const { skills } = useSkills()
  const { install, progress, results, installing } = useInstaller()
  const [installStarted, setInstallStarted] = useState(false)
  const [installComplete, setInstallComplete] = useState(false)

  const handleAgentSelect = (agents: AgentType[]) => {
    if (agents.length === 0) return
    setSelectedAgents(agents)
    next()
  }

  const handleActionSelect = (act: 'install' | 'update' | 'remove') => {
    setAction(act)

    if (act === 'update') {
      setShowUpdate(true)
      return
    }

    if (act === 'remove') {
      setShowRemove(true)
      return
    }

    next()
  }

  const handleSkillSelect = (skills: SkillInfo[]) => {
    if (skills.length === 0) return
    setSelectedSkills(skills)
    next()
  }

  const handleConfigConfirm = (config: { method: 'copy' | 'symlink'; global: boolean }) => {
    setInstallConfig(config)
    next()
  }

  const visibleSkills = useMemo(() => {
    if (action === 'install') return undefined
    const installedOnSelected = new Set<string>()
    Object.entries(installedSkills).forEach(([skillName, agents]) => {
      if (agents.some((a) => selectedAgents.includes(a))) installedOnSelected.add(skillName)
    })
    return skills.filter((s) => installedOnSelected.has(s.name))
  }, [action, installedSkills, skills, selectedAgents])

  useEffect(() => {
    const runInstall = async () => {
      if (step === 5 && !installStarted && !installComplete) {
        setInstallStarted(true)
        await install(selectedSkills, {
          agents: selectedAgents,
          skills: selectedSkills.map((s) => s.name),
          method: installConfig.method,
          global: installConfig.global,
        })
        setInstallComplete(true)
        refreshInstalledSkills((prev) => prev + 1)
      }
    }
    runInstall()
  }, [step, installStarted, installComplete, install, selectedSkills, selectedAgents, refreshInstalledSkills])

  if (step === 5) {
    if (installComplete) {
      return <InstallResults results={results} onExit={onExit} title="Installation Complete" successLabel="installed" />
    }

    return (
      <Box flexDirection="column" paddingX={1}>
        <Header />
        <Box marginTop={1}>
          <Text color={colors.accent}>
            <Spinner type="dots" />{' '}
          </Text>
          <Text>
            Installing {selectedSkills.length} skills to {selectedAgents.length} agents...
          </Text>
        </Box>
        {installing && (
          <Box marginTop={1} paddingX={2}>
            <Text color={colors.textDim}>
              {symbols.arrow} {progress.skill} ({progress.current}/{progress.total})
            </Text>
          </Box>
        )}
      </Box>
    )
  }

  if (showUpdate) return <UpdateView selectedAgents={selectedAgents} onExit={() => setShowUpdate(false)} />
  if (showRemove) return <RemoveWizard selectedAgents={selectedAgents} onExit={() => setShowRemove(false)} />
  if (showCredits) return <CreditsView onExit={() => setShowCredits(false)} />

  return (
    <Box flexDirection="column">
      {step === 1 && <AgentSelector onSelect={handleAgentSelect} onBack={onExit} />}

      {step === 2 && (
        <ActionSelector onSelect={handleActionSelect} onBack={back} onCredits={() => setShowCredits(true)} />
      )}

      {step === 3 && (action === 'install' || (visibleSkills && visibleSkills.length > 0)) && (
        <SkillBrowser onInstall={handleSkillSelect} onExit={back} overrideSkills={visibleSkills} />
      )}

      {step === 3 && action === 'update' && visibleSkills && visibleSkills.length === 0 && (
        <UpToDateMessage onBack={back} />
      )}

      {step === 4 && (
        <InstallConfig onConfirm={handleConfigConfirm} onBack={back} initialMethod="copy" initialGlobal={false} />
      )}
    </Box>
  )
}

function UpToDateMessage({ onBack }: { onBack: () => void }) {
  useInput((input, key) => {
    if (key.escape || input === 'b' || key.backspace) onBack()
  })

  return (
    <Box flexDirection="column" paddingX={1}>
      <Header />

      <Box borderColor={colors.success} borderStyle="round" paddingX={2} paddingY={1}>
        <Text color={colors.success} bold>
          {symbols.check} All skills are up to date on selected agents
        </Text>
      </Box>

      <Box marginTop={1} borderStyle="round" borderColor={colors.border} paddingX={1}>
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
