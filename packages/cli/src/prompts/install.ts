import pc from 'picocolors'

import { detectInstalledAgents, getAgentConfig, getAllAgentTypes } from '../agents'
import { groupSkillsByCategory } from '../categories'
import { isGloballyInstalled } from '../installer'
import { discoverSkillsAsync } from '../skills-provider'
import type { AgentType, InstallOptions, SkillInfo } from '../types'
import { truncate } from '../ui/formatting'
import {
  blueConfirm,
  blueGroupMultiSelect,
  blueMultiSelectWithBack,
  blueSelectWithBack,
  isCancelled,
} from '../ui/input'
import { initScreen } from '../ui/screen'
import { withSpinner } from '../ui/spinner'
import { logBar, logBarEnd, logCancelled } from '../ui/styles'
import { checkForUpdates, getCurrentVersion } from '../update-check'
import { showInstallationSummary } from './results'
import {
  buildAgentOptions,
  getAllInstalledSkillNames,
  getInstalledSkillsForAgents,
  getSmartUpdateConfigs,
  type UpdateConfig,
} from './utils'

type WizardState = {
  skills: string[]
  agents: AgentType[]
  method: 'symlink' | 'copy'
  global: boolean
}

type ActionType = 'install' | 'update'

const WIZARD_STEPS = {
  AGENTS: 1,
  SKILLS: 2,
  CONFIG: 3,
} as const

const TOTAL_STEPS = Object.keys(WIZARD_STEPS).length

export async function runInteractiveInstall(): Promise<InstallOptions | UpdateConfig[] | null> {
  initScreen()
  await checkEnvironment()

  const allSkills = await withSpinner('Loading skills catalog...', discoverSkillsAsync)

  if (allSkills.length === 0) {
    logBarEnd(pc.red('No skills available. Check your internet connection.'))
    return null
  }

  const installedAgents = detectInstalledAgents()
  const allAgents = getAllAgentTypes()
  const targetAgents = installedAgents.length > 0 ? installedAgents : allAgents
  const installedSkills = await getAllInstalledSkillNames(targetAgents)

  if (installedSkills.size > 0) {
    const earlyResult = await handleExistingSkills(installedSkills, targetAgents)
    if (earlyResult !== undefined) return earlyResult as InstallOptions | UpdateConfig[] | null
  }

  // Filter to only include skills that exist in the skills-registry
  const catalogSkillNames = new Set(allSkills.map((s) => s.name))
  const validInstalledSkills = new Set([...installedSkills].filter((s) => catalogSkillNames.has(s)))

  return runWizard({
    allSkills,
    allAgents,
    installedAgents,
    installedSkills: validInstalledSkills,
    preselectedSkills: [],
  })
}

interface WizardParams {
  allSkills: SkillInfo[]
  allAgents: AgentType[]
  installedAgents: AgentType[]
  installedSkills: Set<string>
  shouldForceUpdate?: boolean
  preselectedSkills: string[]
}

async function handleExistingSkills(
  installedSkills: Set<string>,
  allAgents: AgentType[],
): Promise<InstallOptions | UpdateConfig[] | null | undefined> {
  const action = await selectAction()
  if (action === null) return null
  if (action === 'install') return undefined

  logBar(pc.blue('⏳ Checking for updates...'))
  const { configs, toUpdate, upToDate } = await getSmartUpdateConfigs(allAgents)

  if (configs.length === 0) {
    if (upToDate.length > 0) {
      logBarEnd(pc.green(`✅ All ${upToDate.length} installed skills are already up to date`))
    } else {
      logBarEnd(pc.yellow('No agents found with installed skills.'))
    }
    return null
  }

  showUpdatePreview(toUpdate, upToDate)

  const confirm = await blueConfirm('Proceed with update?', true)
  if (isCancelled(confirm) || !confirm) {
    logCancelled()
    return null
  }

  return configs
}

async function selectAction(): Promise<ActionType | null> {
  const options = [
    { value: 'install' as const, label: 'Install skills', hint: 'browse and select skills to install' },
    {
      value: 'update' as const,
      label: 'Update installed skills',
      hint: 'check for content changes',
    },
  ]

  const result = await blueSelectWithBack<ActionType>('What would you like to do?', options, 'install', false)

  if (isCancelled(result)) {
    logCancelled()
    return null
  }

  return result as ActionType
}

function showUpdatePreview(toUpdate: string[], upToDate: string[]): void {
  logBar(pc.cyan(`${toUpdate.length} skill${toUpdate.length === 1 ? '' : 's'} with updates available:`))
  toUpdate.forEach((skill) => logBar(pc.white(`  ↑ ${skill}`)))
  if (upToDate.length > 0) {
    logBar(pc.gray(`  ${upToDate.length} skill${upToDate.length === 1 ? '' : 's'} already up to date`))
  }
  logBar()
}

async function runWizard(params: WizardParams): Promise<InstallOptions | null> {
  const { allSkills, allAgents, installedAgents, installedSkills, preselectedSkills } = params

  const state: WizardState = {
    skills: preselectedSkills,
    agents: installedAgents.length > 0 ? installedAgents : (['cursor', 'claude-code'] as AgentType[]),
    method: 'copy',
    global: false,
  }

  let currentStep = WIZARD_STEPS.AGENTS

  while (currentStep <= TOTAL_STEPS) {
    const stepResult = await executeStep({
      step: currentStep,
      state,
      allSkills,
      allAgents,
      installedAgents,
      installedSkills,
      preselectedSkills,
    })

    if (stepResult === 'cancelled') return null

    if (stepResult === 'back') {
      currentStep--
      if (currentStep === WIZARD_STEPS.CONFIG - 1) state.method = 'copy'
      continue
    }

    if (stepResult === 'restart') {
      currentStep = WIZARD_STEPS.AGENTS
      continue
    }

    if (typeof stepResult === 'object') {
      return stepResult
    }

    currentStep++
  }

  return null
}

type StepResult = 'cancelled' | 'back' | 'restart' | InstallOptions | 'next'

interface StepContext {
  step: number
  state: WizardState
  allSkills: SkillInfo[]
  allAgents: AgentType[]
  installedAgents: AgentType[]
  installedSkills: Set<string>
  preselectedSkills: string[]
}

async function executeStep(ctx: StepContext): Promise<StepResult> {
  const stepIndicator = pc.gray(`[${ctx.step}/${TOTAL_STEPS}]`)
  const allowBack = ctx.step > 1

  const stepHandlers: Record<number, () => Promise<StepResult>> = {
    [WIZARD_STEPS.AGENTS]: () => handleAgentsStep(ctx, stepIndicator),
    [WIZARD_STEPS.SKILLS]: () => handleSkillsStep(ctx, stepIndicator, allowBack),
    [WIZARD_STEPS.CONFIG]: () => handleConfigStep(ctx, stepIndicator, allowBack),
  }

  return stepHandlers[ctx.step]()
}

async function handleAgentsStep(ctx: StepContext, stepIndicator: string): Promise<StepResult> {
  const result = await selectAgentsStep({
    allAgents: ctx.allAgents,
    installedAgents: ctx.installedAgents,
    currentAgents: ctx.state.agents,
    stepIndicator,
    allowBack: false,
  })
  if (result === null) return 'cancelled'
  ctx.state.agents = result as AgentType[]
  return 'next'
}

async function handleSkillsStep(ctx: StepContext, stepIndicator: string, allowBack: boolean): Promise<StepResult> {
  const installedSkillsForAgents = await getInstalledSkillsForAgents(ctx.state.agents, ctx.allSkills)

  const result = await selectSkillsUnifiedStep({
    allSkills: ctx.allSkills,
    selectedAgents: ctx.state.agents,
    installedSkillsMap: installedSkillsForAgents,
    stepIndicator,
    initialValues: ctx.preselectedSkills,
    allowBack,
  })

  if (result === Symbol.for('back')) return 'back'
  if (result === null) return 'cancelled'
  ctx.state.skills = result as string[]
  return 'next'
}

async function handleConfigStep(ctx: StepContext, stepIndicator: string, allowBack: boolean): Promise<StepResult> {
  const result = await configureInstallationStep({
    state: ctx.state,
    stepIndicator,
    allowBack,
  })
  if (result === Symbol.for('back')) return 'back'
  if (result === null) return 'cancelled'
  if (result === false) return 'restart'
  return result as InstallOptions
}

async function checkEnvironment(): Promise<void> {
  const currentVersion = getCurrentVersion()
  const latestVersion = await checkForUpdates(currentVersion)

  if (latestVersion) {
    console.log(
      `${pc.yellow('⚠')}  ${pc.yellow('Update available:')} ${pc.gray(currentVersion)} → ${pc.green(latestVersion)}`,
    )
    console.log(`   ${pc.gray('Run: npm update -g @tech-leads-club/agent-skills')}`)
    console.log()
    return
  }

  if (!isGloballyInstalled()) {
    console.log(`${pc.yellow('💡')}  ${pc.yellow('Tip: Install globally for easier access:')}`)
    console.log(`    ${pc.yellow('npm i -g @tech-leads-club/agent-skills')}`)
    console.log()
  }
}

interface SelectSkillsUnifiedProps {
  allSkills: SkillInfo[]
  selectedAgents: AgentType[]
  installedSkillsMap: Map<string, AgentType[]>
  stepIndicator: string
  initialCursor?: number
  initialValues?: string[]
  allowBack?: boolean
}

async function selectSkillsUnifiedStep({
  allSkills,
  selectedAgents,
  installedSkillsMap,
  stepIndicator,
  initialCursor = 0,
  initialValues = [],
  allowBack = false,
}: SelectSkillsUnifiedProps): Promise<string[] | symbol | null> {
  const groupedSkills = groupSkillsByCategory(allSkills)
  const options = buildSkillOptions(groupedSkills, selectedAgents, installedSkillsMap)

  const result = await blueGroupMultiSelect(
    `${stepIndicator} Select skills to install`,
    options,
    initialValues,
    allowBack,
    initialCursor,
  )

  const { value: selectedSkills, cursor: finalCursor } = result

  if (selectedSkills === Symbol.for('back')) return Symbol.for('back')
  if (isCancelled(selectedSkills)) {
    logCancelled()
    return null
  }

  const validSkills = selectedSkills as string[]

  if (validSkills.length === 0) {
    logBar(pc.yellow('⚠ Please select at least one skill'))
    return selectSkillsUnifiedStep({
      allSkills,
      selectedAgents,
      installedSkillsMap,
      stepIndicator,
      initialCursor: finalCursor,
      allowBack,
    })
  }

  return validSkills
}

function buildSkillOptions(
  groupedSkills: Map<{ name: string }, SkillInfo[]>,
  selectedAgents: AgentType[],
  installedSkillsMap: Map<string, AgentType[]>,
): Record<string, { value: string; label: string; hint?: string }[]> {
  const options: Record<string, { value: string; label: string; hint?: string }[]> = {}

  for (const [category, skills] of groupedSkills.entries()) {
    options[category.name] = skills.map((skill) => {
      const installedInAgents = installedSkillsMap.get(skill.name) || []
      const badge = buildInstallBadge(installedInAgents, selectedAgents)

      return {
        value: skill.name,
        label: badge ? `${skill.name} ${badge}` : skill.name,
        hint: truncate(skill.description, 150),
      }
    })
  }

  return options
}

function buildInstallBadge(installedInAgents: AgentType[], selectedAgents: AgentType[]): string {
  if (installedInAgents.length === 0) return ''
  const agentNames = installedInAgents.map((a) => getAgentConfig(a).displayName)

  if (installedInAgents.length === selectedAgents.length) {
    return pc.green('✓ installed')
  } else {
    const agentList = agentNames.join(', ')
    return pc.green(`✓ ${agentList}`)
  }
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
      currentAgents: [],
      stepIndicator,
      allowBack,
      initialCursor: finalCursor,
    })
  }

  return validAgents
}

interface ConfigureProps {
  state: WizardState
  stepIndicator: string
  allowBack: boolean
}

const METHOD_OPTIONS = [
  { value: 'copy' as const, label: 'Copy', hint: 'independent copies (recommended)' },
  { value: 'symlink' as const, label: 'Symlink', hint: 'shared source (may not work with all agents)' },
]

const SCOPE_OPTIONS = [
  { value: 'local' as const, label: 'Local', hint: 'this project only' },
  { value: 'global' as const, label: 'Global', hint: 'user home directory' },
]

async function configureInstallationStep({
  state,
  stepIndicator,
  allowBack,
}: ConfigureProps): Promise<InstallOptions | symbol | null | false> {
  const method = await blueSelectWithBack(
    `${stepIndicator} Installation method`,
    METHOD_OPTIONS,
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

  const scope = await selectScope(state.global)
  if (scope === Symbol.for('back')) return configureInstallationStep({ state, stepIndicator, allowBack })
  if (scope === null) return null

  state.global = scope === 'global'

  const confirm = await blueConfirm(pc.white('Proceed with installation?'), true)

  if (isCancelled(confirm)) {
    logCancelled()
    return null
  }

  if (!confirm) return false
  logBar()

  return { agents: state.agents, skills: state.skills, method: state.method, global: state.global }
}

async function selectScope(isGlobal: boolean): Promise<'local' | 'global' | symbol | null> {
  const scope = await blueSelectWithBack('Installation scope', SCOPE_OPTIONS, isGlobal ? 'global' : 'local', true)
  if (scope === Symbol.for('back')) return Symbol.for('back')
  if (isCancelled(scope)) return null
  return scope as 'local' | 'global'
}
