import pc from 'picocolors'

import { detectInstalledAgents, getAllAgentTypes } from '../agents'
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
import { buildAgentOptions, getAllInstalledSkillNames } from './utils'

type WizardState = {
  skills: string[]
  agents: AgentType[]
  method: 'symlink' | 'copy'
  global: boolean
}

type ActionType = 'install' | 'update' | 'both'

const WIZARD_STEPS = {
  SKILLS: 1,
  AGENTS: 2,
  CONFIG: 3,
} as const

const TOTAL_STEPS = Object.keys(WIZARD_STEPS).length

export async function runInteractiveInstall(): Promise<InstallOptions | null> {
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
    const earlyResult = await handleExistingSkills(installedSkills, [...installedAgents, ...allAgents])
    if (earlyResult !== undefined) return earlyResult
  }

  return runWizard({
    allSkills,
    allAgents,
    installedAgents,
    installedSkills,
    shouldForceUpdate: installedSkills.size > 0,
    preselectedSkills: installedSkills.size > 0 ? Array.from(installedSkills) : [],
  })
}

interface WizardParams {
  allSkills: SkillInfo[]
  allAgents: AgentType[]
  installedAgents: AgentType[]
  installedSkills: Set<string>
  shouldForceUpdate: boolean
  preselectedSkills: string[]
}

async function handleExistingSkills(
  installedSkills: Set<string>,
  fallbackAgents: AgentType[],
): Promise<InstallOptions | null | undefined> {
  const action = await selectAction(installedSkills.size)
  if (action === null) return null
  if (action === 'install' || action === 'both') return undefined

  const preselectedSkills = Array.from(installedSkills)
  const defaultAgents: AgentType[] = fallbackAgents.length > 0 ? fallbackAgents : ['cursor', 'claude-code']

  showUpdatePreview(preselectedSkills)

  const confirm = await blueConfirm('Proceed with update?', true)
  if (isCancelled(confirm) || !confirm) {
    logCancelled()
    return null
  }

  return {
    skills: preselectedSkills,
    agents: defaultAgents,
    method: 'symlink',
    global: false,
    forceUpdate: true,
  }
}

async function selectAction(installedCount: number): Promise<ActionType | null> {
  const options = [
    { value: 'install' as const, label: 'Install new skills', hint: 'browse and install new skills' },
    {
      value: 'update' as const,
      label: `Update installed skills (${installedCount})`,
      hint: 're-download latest versions',
    },
    { value: 'both' as const, label: 'Install new + Update existing', hint: 'do both at once' },
  ]

  const result = await blueSelectWithBack<ActionType>('What would you like to do?', options, 'install', false)

  if (isCancelled(result)) {
    logCancelled()
    return null
  }

  return result as ActionType
}

function showUpdatePreview(skills: string[]): void {
  logBar(pc.cyan(`Will update ${skills.length} installed skills:`))
  skills.slice(0, 5).forEach((skill) => logBar(pc.gray(`  • ${skill}`)))
  if (skills.length > 5) logBar(pc.gray(`  ... and ${skills.length - 5} more`))
  logBar()
}

async function runWizard(params: WizardParams): Promise<InstallOptions | null> {
  const { allSkills, allAgents, installedAgents, installedSkills, shouldForceUpdate, preselectedSkills } = params

  const state: WizardState = {
    skills: preselectedSkills,
    agents: installedAgents.length > 0 ? installedAgents : (['cursor', 'claude-code'] as AgentType[]),
    method: 'symlink',
    global: false,
  }

  let currentStep = WIZARD_STEPS.SKILLS

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
      if (currentStep === WIZARD_STEPS.CONFIG - 1) state.method = 'symlink'
      continue
    }
    if (stepResult === 'restart') {
      currentStep = WIZARD_STEPS.SKILLS
      continue
    }
    if (typeof stepResult === 'object') {
      if (shouldForceUpdate) stepResult.forceUpdate = true
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
    [WIZARD_STEPS.SKILLS]: () => handleSkillsStep(ctx, stepIndicator),
    [WIZARD_STEPS.AGENTS]: () => handleAgentsStep(ctx, stepIndicator, allowBack),
    [WIZARD_STEPS.CONFIG]: () => handleConfigStep(ctx, stepIndicator, allowBack),
  }

  return stepHandlers[ctx.step]()
}

async function handleSkillsStep(ctx: StepContext, stepIndicator: string): Promise<StepResult> {
  const result = await selectSkillsUnifiedStep({
    allSkills: ctx.allSkills,
    installedSkills: ctx.installedSkills,
    stepIndicator,
    initialValues: ctx.preselectedSkills,
  })

  if (result === null) return 'cancelled'
  ctx.state.skills = result
  return 'next'
}

async function handleAgentsStep(ctx: StepContext, stepIndicator: string, allowBack: boolean): Promise<StepResult> {
  const result = await selectAgentsStep({
    allAgents: ctx.allAgents,
    installedAgents: ctx.installedAgents,
    currentAgents: ctx.state.agents,
    stepIndicator,
    allowBack,
  })

  if (result === Symbol.for('back')) return 'back'
  if (result === null) return 'cancelled'

  ctx.state.agents = result as AgentType[]
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
    logBar(
      `${pc.yellow('⚠')}  ${pc.yellow('Update available:')} ${pc.gray(currentVersion)} → ${pc.green(latestVersion)}`,
    )
    logBar(`   ${pc.gray('Run: npm update -g @tech-leads-club/agent-skills')}`)
    logBar()
    return
  }

  if (!isGloballyInstalled()) {
    logBar(`${pc.yellow('⚠')}  ${pc.yellow('Not installed globally')}`)
    logBar(`   ${pc.yellow("Skills won't auto-update. Install globally:")}`)
    logBar(`   ${pc.yellow('npm i -g @tech-leads-club/agent-skills')}`)
    logBar()
  }
}

interface SelectSkillsUnifiedProps {
  allSkills: SkillInfo[]
  installedSkills: Set<string>
  stepIndicator: string
  initialCursor?: number
  initialValues?: string[]
}

async function selectSkillsUnifiedStep({
  allSkills,
  installedSkills,
  stepIndicator,
  initialCursor = 0,
  initialValues = [],
}: SelectSkillsUnifiedProps): Promise<string[] | null> {
  const groupedSkills = groupSkillsByCategory(allSkills)
  const options = buildSkillOptions(groupedSkills, installedSkills, initialValues)

  const result = await blueGroupMultiSelect(
    `${stepIndicator} Select skills to install`,
    options,
    initialValues,
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

function buildSkillOptions(
  groupedSkills: Map<{ name: string }, SkillInfo[]>,
  installedSkills: Set<string>,
  initialValues: string[],
): Record<string, { value: string; label: string; hint?: string }[]> {
  const options: Record<string, { value: string; label: string; hint?: string }[]> = {}

  for (const [category, skills] of groupedSkills.entries()) {
    options[category.name] = skills.map((skill) => {
      const isInstalled = installedSkills.has(skill.name)
      const isPreselected = initialValues.includes(skill.name)
      const badge = isInstalled ? (isPreselected ? pc.yellow('● will update') : pc.green('● installed')) : ''

      return {
        value: skill.name,
        label: badge ? `${skill.name} ${badge}` : skill.name,
        hint: truncate(skill.description, 150),
      }
    })
  }

  return options
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
  { value: 'symlink' as const, label: 'Symlink', hint: 'shared source (recommended)' },
  { value: 'copy' as const, label: 'Copy', hint: 'independent copies' },
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
