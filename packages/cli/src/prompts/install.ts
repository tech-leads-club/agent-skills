import pc from 'picocolors'

import { detectInstalledAgents, getAllAgentTypes } from '../agents'
import { groupSkillsByCategory } from '../categories'
import { isGloballyInstalled } from '../installer'
import { discoverSkills } from '../skills'
import type { AgentType, InstallOptions } from '../types'
import { truncate } from '../ui/formatting'
import {
  blueConfirm,
  blueGroupMultiSelect,
  blueMultiSelectWithBack,
  blueSelectWithBack,
  isCancelled,
} from '../ui/input'
import { initScreen } from '../ui/screen'
import { logBar, logBarEnd, logCancelled } from '../ui/styles'
import { checkForUpdates, getCurrentVersion } from '../update-check'
import { showInstallationSummary } from './results'
import { buildAgentOptions, getAllInstalledSkillNames } from './utils'

type WizardState = {
  skills: string[]
  agents: AgentType[]
  method: 'symlink' | 'copy'
  global: boolean
}

export async function runInteractiveInstall(): Promise<InstallOptions | null> {
  initScreen()
  await checkEnvironment()

  const allSkills = discoverSkills()

  if (allSkills.length === 0) {
    logBarEnd(pc.red('No skills available'))
    return null
  }

  const installedAgents = detectInstalledAgents()
  const allAgents = getAllAgentTypes()
  const targetAgents = installedAgents.length > 0 ? installedAgents : allAgents
  const installedSkills = await getAllInstalledSkillNames(targetAgents)

  const state: WizardState = {
    skills: [],
    agents: installedAgents.length > 0 ? installedAgents : (['cursor', 'claude-code'] as AgentType[]),
    method: 'symlink',
    global: false,
  }

  let currentStep = 1
  const totalSteps = 3

  while (currentStep <= totalSteps) {
    const stepIndicator = pc.gray(`[${currentStep}/${totalSteps}]`)
    const allowBack = currentStep > 1

    switch (currentStep) {
      case 1: {
        const result = await selectSkillsUnifiedStep({
          allSkills,
          installedSkills,
          stepIndicator,
        })

        if (result === null) return null

        state.skills = result
        currentStep++
        break
      }

      case 2: {
        const result = await selectAgentsStep({
          allAgents,
          installedAgents,
          currentAgents: state.agents,
          stepIndicator,
          allowBack,
        })

        if (result === Symbol.for('back')) {
          currentStep--
          break
        }

        if (result === null) return null

        state.agents = result as AgentType[]
        currentStep++
        break
      }

      case 3: {
        const result = await configureInstallationStep({
          state,
          stepIndicator,
          allowBack,
        })

        if (result === Symbol.for('back')) {
          state.method = 'symlink'
          currentStep--
          break
        }

        if (result === null) return null
        if (result === false) {
          currentStep = 1
          break
        }

        return result as InstallOptions
      }
    }
  }

  return null
}

async function checkEnvironment() {
  const currentVersion = getCurrentVersion()
  const latestVersion = await checkForUpdates(currentVersion)

  if (latestVersion) {
    logBar(
      `${pc.yellow('⚠')}  ${pc.yellow('Update available:')} ${pc.gray(currentVersion)} → ${pc.green(latestVersion)}`,
    )
    logBar(`   ${pc.gray('Run: npm update -g @tech-leads-club/agent-skills')}`)
    logBar()
  } else if (!isGloballyInstalled()) {
    logBar(`${pc.yellow('⚠')}  ${pc.yellow('Not installed globally')}`)
    logBar(`   ${pc.yellow("Skills won't auto-update. Install globally:")}`)
    logBar(`   ${pc.yellow('npm i -g @tech-leads-club/agent-skills')}`)
    logBar()
  }
}

interface SelectSkillsUnifiedProps {
  allSkills: ReturnType<typeof discoverSkills>
  installedSkills: Set<string>
  stepIndicator: string
  initialCursor?: number
}

async function selectSkillsUnifiedStep({
  allSkills,
  installedSkills,
  stepIndicator,
  initialCursor = 0,
}: SelectSkillsUnifiedProps): Promise<string[] | null> {
  const groupedSkills = groupSkillsByCategory(allSkills)
  const options: Record<string, { value: string; label: string; hint?: string }[]> = {}

  for (const [category, skills] of groupedSkills.entries()) {
    options[category.name] = skills.map((skill) => {
      const isInstalled = installedSkills.has(skill.name)
      return {
        value: skill.name,
        label: isInstalled ? `${skill.name} ${pc.green('● installed')}` : skill.name,
        hint: truncate(skill.description, 150),
      }
    })
  }

  const result = await blueGroupMultiSelect(
    `${stepIndicator} Select skills to install`,
    options,
    [],
    false,
    initialCursor,
  )
  const { value: selectedSkills, cursor: finalCursor } = result

  if (selectedSkills === Symbol.for('back')) return null

  if (isCancelled(selectedSkills)) {
    logCancelled()
    return null
  }

  const validSkills = selectedSkills as string[]

  if (validSkills.length === 0) {
    logBar(pc.yellow('⚠ Please select at least one skill'))
    return selectSkillsUnifiedStep({ allSkills, installedSkills, stepIndicator, initialCursor: finalCursor })
  }

  return validSkills
}

interface SelectAgentsProps {
  allAgents: AgentType[]
  installedAgents: AgentType[]
  currentAgents: AgentType[]
  stepIndicator: string
  allowBack: boolean
  initialCursor?: number
}

async function selectAgentsStep({
  allAgents,
  installedAgents,
  currentAgents,
  stepIndicator,
  allowBack,
  initialCursor = 0,
}: SelectAgentsProps): Promise<AgentType[] | symbol | null> {
  const agentOptions = buildAgentOptions(allAgents, installedAgents)

  const result = await blueMultiSelectWithBack(
    `${stepIndicator} Where to install?`,
    agentOptions,
    currentAgents,
    allowBack,
    initialCursor,
  )

  const { value: selectedAgents, cursor: finalCursor } = result

  if (selectedAgents === Symbol.for('back')) return Symbol.for('back')

  if (isCancelled(selectedAgents)) {
    logCancelled()
    return null
  }

  const validAgents = selectedAgents as AgentType[]

  if (validAgents.length === 0) {
    logBar(pc.yellow('⚠ Please select at least one agent'))
    return selectAgentsStep({
      allAgents,
      installedAgents,
      currentAgents: [], // Clear selection
      stepIndicator,
      allowBack,
      initialCursor: finalCursor, // Maintain cursor position
    })
  }

  return validAgents
}

interface ConfigureProps {
  state: WizardState
  stepIndicator: string
  allowBack: boolean
}

async function configureInstallationStep({
  state,
  stepIndicator,
  allowBack,
}: ConfigureProps): Promise<InstallOptions | symbol | null | false> {
  const methodOptions = [
    { value: 'symlink', label: 'Symlink', hint: 'shared source (recommended)' },
    { value: 'copy', label: 'Copy', hint: 'independent copies' },
  ]

  const method = await blueSelectWithBack(
    `${stepIndicator} Installation method`,
    methodOptions,
    state.method,
    allowBack,
  )

  if (method === Symbol.for('back')) return Symbol.for('back')

  if (isCancelled(method)) {
    logCancelled()
    return null
  }

  state.method = method as 'symlink' | 'copy'
  showInstallationSummary(state)
  const scopeResult = await selectScope(state)
  if (scopeResult === Symbol.for('back')) return configureInstallationStep({ state, stepIndicator, allowBack })
  if (scopeResult === null) return null
  state.global = scopeResult === 'global'
  const confirm = await blueConfirm(pc.white('Proceed with installation?'), true)

  if (isCancelled(confirm)) {
    logCancelled()
    return null
  }

  if (!confirm) return false
  logBar()

  return { agents: state.agents, skills: state.skills, method: state.method, global: state.global }
}

async function selectScope(state: WizardState): Promise<'local' | 'global' | symbol | null> {
  const scopeOptions = [
    { value: 'local', label: 'Local', hint: 'this project only' },
    { value: 'global', label: 'Global', hint: 'user home directory' },
  ]

  const scope = await blueSelectWithBack('Installation scope', scopeOptions, state.global ? 'global' : 'local', true)
  if (scope === Symbol.for('back')) return Symbol.for('back')
  if (isCancelled(scope)) return null
  return scope as 'local' | 'global'
}
