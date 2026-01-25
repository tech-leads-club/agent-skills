import { ConfirmPrompt, MultiSelectPrompt, SelectPrompt } from '@clack/core'
import figlet from 'figlet'
import gradient from 'gradient-string'
import pc from 'picocolors'

import { detectInstalledAgents, getAgentConfig, getAllAgentTypes } from './agents'
import { isGloballyInstalled, listInstalledSkills } from './installer'
import { discoverSkills } from './skills'
import type { AgentType, InstallOptions } from './types'
import { checkForUpdates, getCurrentVersion } from './update-check'

export async function runInteractiveInstall(): Promise<InstallOptions | null> {
  initScreen()

  // Check for updates
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

  const skills = discoverSkills()
  if (skills.length === 0) {
    logBarEnd(pc.red('No skills available'))
    return null
  }

  const installedAgents = detectInstalledAgents()
  const allAgents = getAllAgentTypes()
  const targetAgents = installedAgents.length > 0 ? installedAgents : allAgents
  const installedSkills = await getAllInstalledSkillNames(targetAgents)

  // Step 1: Select skills
  const selectedSkills = await blueMultiSelect(
    `Which skills do you want to install? ${pc.gray(`(${skills.length} available)`)}`,
    buildSkillOptions(skills, installedSkills),
  )

  if (isCancelled(selectedSkills)) {
    logCancelled()
    return null
  }

  // Step 2: Select agents
  const selectedAgents = await blueMultiSelect(
    `Where to install? ${pc.gray(`(${selectedSkills.length} skill(s) selected)`)}`,
    buildAgentOptions(allAgents, installedAgents),
    installedAgents.length > 0 ? installedAgents : ['cursor', 'claude-code'],
  )

  if (isCancelled(selectedAgents)) {
    logCancelled()
    return null
  }

  // Step 3: Select method
  const method = await blueSelect(
    'Installation method',
    [
      { value: 'symlink', label: 'Symlink', hint: 'recommended - shared source' },
      { value: 'copy', label: 'Copy', hint: 'independent copies' },
    ],
    'symlink',
  )

  if (isCancelled(method)) {
    logCancelled()
    return null
  }

  // Step 4: Global or local
  const global = await blueConfirm('Install globally? (user home vs this project)', false)

  if (isCancelled(global)) {
    logCancelled()
    return null
  }

  logBar()

  return {
    agents: selectedAgents as AgentType[],
    skills: selectedSkills as string[],
    method: method as 'symlink' | 'copy',
    global: global as boolean,
  }
}

export function showInstallResults(
  results: Array<{
    agent: string
    skill: string
    path: string
    method: string
    success: boolean
    error?: string
  }>,
): void {
  const successful = results.filter((r) => r.success && !r.error)
  const alreadyExists = results.filter((r) => r.success && r.error === 'Already exists')
  const failed = results.filter((r) => !r.success)

  console.log()

  for (const r of successful) {
    console.log(`${SYMBOL} ${pc.white(pc.bold(r.skill))} ${pc.gray('→')} ${pc.white(r.agent)}`)
  }

  for (const r of alreadyExists) {
    console.log(`${pc.gray(SYMBOL)} ${r.skill} → ${r.agent} ${pc.gray('(exists)')}`)
  }

  for (const r of failed) {
    console.log(`${pc.red('✗')} ${r.skill} → ${r.agent}: ${r.error}`)
  }

  const totalAgents = new Set(results.map((r) => r.agent)).size

  console.log()
  logBarEnd(
    `${pc.blue('✓')} ${pc.white(pc.bold(`${successful.length} skill(s)`))} ${pc.white('installed to')} ${pc.white(pc.bold(`${totalAgents} agent(s)`))}`,
  )
}

export async function showAvailableSkills(): Promise<void> {
  initScreen()

  const skills = discoverSkills()

  if (skills.length === 0) {
    logBar(pc.yellow('No skills found'))
    return
  }

  logBar(pc.bold(`${skills.length} skills available:`))
  logBar()

  const allAgents = getAllAgentTypes()
  const installedSkills = await getAllInstalledSkillNames(allAgents)

  for (const skill of skills) {
    const installedBadge = installedSkills.has(skill.name) ? ` ${pc.green('● installed')}` : ''
    logBar(`${pc.blue('◆')} ${pc.bold(skill.name)}${installedBadge}`)
    console.log(`${pc.blue(S_BAR)}    ${pc.dim(pc.gray(skill.description))}`)
  }

  logBar()
  logBarEnd(pc.gray('Run "npx @tech-leads-club/agent-skills" to install'))
}

export async function runInteractiveRemove(global: boolean): Promise<void> {
  initScreen()

  const allAgents = getAllAgentTypes()
  const installedSkills = await getInstalledSkillNames(allAgents, global)

  if (installedSkills.size === 0) {
    logBar(pc.yellow('No skills installed'))
    logBarEnd()
    return
  }

  const skillsArray = Array.from(installedSkills)

  // Step 1: Select skills to remove
  const selectedSkills = await blueMultiSelect(
    `Which skills do you want to remove? ${pc.gray(`(${skillsArray.length} installed)`)}`,
    skillsArray.map((name) => ({ value: name, label: name })),
  )

  if (isCancelled(selectedSkills) || selectedSkills.length === 0) {
    logCancelled()
    return
  }

  // Step 2: Select agents
  const selectedAgents = await blueMultiSelect(
    'Remove from which agents?',
    buildAgentOptions(allAgents).map((opt) => ({ ...opt, hint: undefined })),
    allAgents,
  )

  if (isCancelled(selectedAgents)) {
    logCancelled()
    return
  }

  // Step 3: Confirm
  const confirm = await blueConfirm(
    `Remove ${selectedSkills.length} skill(s) from ${selectedAgents.length} agent(s)?`,
    false,
  )

  if (isCancelled(confirm) || !confirm) {
    logCancelled()
    return
  }

  logBar()

  const { removeSkill } = await import('./installer')

  for (const skillName of selectedSkills) {
    const results = await removeSkill(skillName, selectedAgents as AgentType[], { global })
    showRemoveResults(skillName, results)
  }
}

const S_BAR = '│'
const S_BAR_END = '└'
const S_RADIO_ACTIVE = '●'
const S_RADIO_INACTIVE = '○'
const S_CHECKBOX_ACTIVE = '◼'
const S_CHECKBOX_INACTIVE = '◻'
const SYMBOL = pc.blue('◆')

const crystalGradient = gradient([
  { color: '#1e3a8a', pos: 0 },
  { color: '#3b82f6', pos: 0.3 },
  { color: '#0ea5e9', pos: 0.5 },
  { color: '#06b6d4', pos: 0.7 },
  { color: '#22d3ee', pos: 1 },
])

export function showRemoveResults(
  skillName: string,
  results: Array<{ agent: string; success: boolean; error?: string }>,
): void {
  const successful = results.filter((r) => r.success)
  const failed = results.filter((r) => !r.success)

  if (successful.length > 0) {
    console.log(
      `${SYMBOL} ${pc.white(pc.bold(skillName))} ${pc.gray('removed from')} ${successful.map((r) => r.agent).join(', ')}`,
    )
  }

  for (const r of failed) {
    console.log(`${pc.red('✗')} ${skillName} → ${r.agent}: ${r.error}`)
  }

  if (successful.length > 0 && failed.length === 0) {
    logBarEnd(`${pc.blue('✓')} ${pc.white('Skill removed successfully')}`)
  }
}

async function blueMultiSelect<T>(
  message: string,
  options: Option<T>[],
  initialValues: T[] = [],
): Promise<T[] | symbol> {
  const opt = (option: Option<T>, state: 'active' | 'selected' | 'cancelled' | 'inactive' | 'selected-active') => {
    const isSelected = state === 'selected' || state === 'selected-active'
    const isActive = state === 'active' || state === 'selected-active'
    const checkbox = isSelected ? pc.blue(S_CHECKBOX_ACTIVE) : pc.gray(S_CHECKBOX_INACTIVE)
    const label = isActive ? pc.blue(option.label) : pc.white(option.label)
    const hint = isActive && option.hint ? pc.dim(pc.gray(` (${option.hint})`)) : ''
    return `${checkbox} ${label}${hint}`
  }

  const prompt = new MultiSelectPrompt({
    options,
    initialValues,
    render() {
      const title = `${pc.blue(S_BAR)}\n${SYMBOL} ${pc.white(pc.bold(message))}\n`

      switch (this.state) {
        case 'submit':
          return `${title}${pc.blue(S_BAR)}  ${this.options
            .filter((o) => this.value.includes(o.value))
            .map((o) => pc.blue(String(o.value)))
            .join(pc.gray(', '))}\n${pc.blue(S_BAR)}`
        case 'cancel':
          return `${title}${pc.blue(S_BAR)}  ${pc.strikethrough(pc.gray('cancelled'))}\n${pc.blue(S_BAR)}`
        default:
          return `${title}${this.options
            .map((option, i) => {
              const isSelected = this.value.includes(option.value)
              const isActive = i === this.cursor
              const state =
                isSelected && isActive ? 'selected-active' : isSelected ? 'selected' : isActive ? 'active' : 'inactive'
              return `${pc.blue(S_BAR)}  ${opt(option as Option<T>, state)}`
            })
            .join(
              '\n',
            )}\n${pc.blue(S_BAR)}\n${pc.blue(S_BAR_END)}  ${pc.dim(pc.gray('(↑↓ navigate, space select, enter confirm)'))}`
      }
    },
  })

  return prompt.prompt() as Promise<T[] | symbol>
}

async function blueSelect<T>(message: string, options: Option<T>[], initialValue?: T): Promise<T | symbol> {
  const opt = (option: Option<T>, isActive: boolean) => {
    const radio = isActive ? pc.blue(S_RADIO_ACTIVE) : pc.gray(S_RADIO_INACTIVE)
    const label = isActive ? pc.blue(option.label) : pc.white(option.label)
    const hint = isActive && option.hint ? pc.dim(pc.gray(` - ${option.hint}`)) : ''
    return `${radio} ${label}${hint}`
  }

  const prompt = new SelectPrompt({
    options,
    initialValue,
    render() {
      const title = `${pc.blue(S_BAR)}\n${SYMBOL} ${pc.white(pc.bold(message))}\n`

      switch (this.state) {
        case 'submit':
          return `${title}${pc.blue(S_BAR)}  ${pc.blue(this.options.find((o) => o.value === this.value)?.label)}\n${pc.blue(S_BAR)}`
        case 'cancel':
          return `${title}${pc.blue(S_BAR)}  ${pc.strikethrough(pc.gray('cancelled'))}\n${pc.blue(S_BAR)}`
        default:
          return `${title}${this.options
            .map((option, i) => `${pc.blue(S_BAR)}  ${opt(option as Option<T>, i === this.cursor)}`)
            .join(
              '\n',
            )}\n${pc.blue(S_BAR)}\n${pc.blue(S_BAR_END)}  ${pc.dim(pc.gray('(↑↓ navigate, enter to confirm)'))}`
      }
    },
  })

  return prompt.prompt() as Promise<T | symbol>
}

async function blueConfirm(message: string, initialValue = false): Promise<boolean | symbol> {
  const prompt = new ConfirmPrompt({
    active: 'Yes',
    inactive: 'No',
    initialValue,
    render() {
      const title = `${pc.blue(S_BAR)}\n${SYMBOL} ${pc.white(pc.bold(message))}\n`

      switch (this.state) {
        case 'submit':
          return `${title}${pc.blue(S_BAR)}  ${pc.blue(this.value ? 'Yes' : 'No')}\n${pc.blue(S_BAR)}`
        case 'cancel':
          return `${title}${pc.blue(S_BAR)}  ${pc.strikethrough(pc.gray('cancelled'))}\n${pc.blue(S_BAR)}`
        default:
          return `${title}${pc.blue(S_BAR)}  ${
            this.value
              ? `${pc.blue('● Yes')} ${pc.dim(pc.gray('/'))} ${pc.gray('○')} ${pc.white('No')}`
              : `${pc.gray('○')} ${pc.white('Yes')} ${pc.dim(pc.gray('/'))} ${pc.blue('● No')}`
          }\n${pc.blue(S_BAR)}\n${pc.blue(S_BAR_END)}  ${pc.dim(pc.gray('(←→ to change, enter to confirm)'))}`
      }
    },
  })

  return prompt.prompt() as Promise<boolean | symbol>
}

// Helpers
function generateLogo(): string {
  const asciiArt = figlet.textSync('Tech Leads Club', {
    font: 'Larry 3D',
    horizontalLayout: 'default',
  })

  return `
${crystalGradient.multiline(asciiArt)}
  ${pc.white(pc.bold('Tech Leads Club'))} ${pc.blue('›')} ${pc.bold(pc.blue('Agent Skills'))}
  ${pc.white('Curated skills to power up your AI coding agents')}
`
}

function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : text.slice(0, maxLength - 3) + '...'
}

function logBar(message = ''): void {
  console.log(message ? `${pc.blue(S_BAR)}  ${message}` : pc.blue(S_BAR))
}

function logBarEnd(message = ''): void {
  console.log(`${pc.blue(S_BAR_END)}  ${message}`)
}

function logCancelled(): void {
  logBarEnd(pc.gray('Cancelled'))
}

function isCancelled<T>(value: T | symbol): value is symbol {
  return typeof value === 'symbol'
}

function initScreen(): void {
  console.clear()
  console.log(generateLogo())
  logBar()
}

async function getInstalledSkillNames(agents: AgentType[], global: boolean): Promise<Set<string>> {
  const installed = new Set<string>()
  for (const agent of agents) {
    const skills = await listInstalledSkills(agent, global)
    skills.forEach((skill) => installed.add(skill))
  }
  return installed
}

async function getAllInstalledSkillNames(agents: AgentType[]): Promise<Set<string>> {
  const [globalSkills, localSkills] = await Promise.all([
    getInstalledSkillNames(agents, true),
    getInstalledSkillNames(agents, false),
  ])
  return new Set([...globalSkills, ...localSkills])
}

// Builders
interface Option<T> {
  value: T
  label: string
  hint?: string
}

function buildAgentOptions(agents: AgentType[], detectedAgents: AgentType[] = []): Option<AgentType>[] {
  return agents.map((type) => {
    const config = getAgentConfig(type)
    const isDetected = detectedAgents.includes(type)
    return {
      value: type,
      label: isDetected ? `${config.displayName} ${pc.green('● detected')}` : config.displayName,
      hint: truncate(config.description, 50),
    }
  })
}

function buildSkillOptions(
  skills: Array<{ name: string; description: string }>,
  installedSkills: Set<string>,
): Option<string>[] {
  return skills.map((skill) => {
    const isInstalled = installedSkills.has(skill.name)
    return {
      value: skill.name,
      label: isInstalled ? `${skill.name} ${pc.green('● installed')}` : skill.name,
      hint: truncate(skill.description, 200),
    }
  })
}
