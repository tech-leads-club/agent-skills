import { ConfirmPrompt, MultiSelectPrompt, SelectPrompt } from '@clack/core'
import figlet from 'figlet'
import gradient from 'gradient-string'
import pc from 'picocolors'

import { detectInstalledAgents, getAgentConfig, getAllAgentTypes } from './agents'
import { isGloballyInstalled, listInstalledSkills } from './installer'
import { discoverSkills } from './skills'
import type { AgentType, InstallOptions } from './types'
import { checkForUpdates, getCurrentVersion } from './update-check'

const S_BAR = '│'
const S_BAR_END = '└'
const S_RADIO_ACTIVE = '●'
const S_RADIO_INACTIVE = '○'
const S_CHECKBOX_ACTIVE = '◼'
const S_CHECKBOX_INACTIVE = '◻'

const symbol = pc.blue('◆')

const cristalGradient = gradient([
  { color: '#1e3a8a', pos: 0 },
  { color: '#3b82f6', pos: 0.3 },
  { color: '#0ea5e9', pos: 0.5 },
  { color: '#06b6d4', pos: 0.7 },
  { color: '#22d3ee', pos: 1 },
])

function generateLogo(): string {
  const asciiArt = figlet.textSync('Tech Leads Club', {
    font: 'Larry 3D',
    horizontalLayout: 'default',
  })

  return `
${cristalGradient.multiline(asciiArt)}
  ${pc.white(pc.bold('Tech Leads Club'))} ${pc.blue('›')} ${pc.bold(pc.blue('Agent Skills'))}
  ${pc.white('Curated skills to power up your AI coding agents')}
`
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

function getInstalledSkillNames(agents: AgentType[], global: boolean): Set<string> {
  const installed = new Set<string>()
  for (const agent of agents) {
    const skills = listInstalledSkills(agent, global)
    for (const skill of skills) {
      installed.add(skill)
    }
  }
  return installed
}

interface Option<T> {
  value: T
  label: string
  hint?: string
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
      const title = `${pc.blue(S_BAR)}\n${pc.blue(symbol)} ${pc.white(pc.bold(message))}\n`

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
      const title = `${pc.blue(S_BAR)}\n${pc.blue(symbol)} ${pc.white(pc.bold(message))}\n`

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
      const title = `${pc.blue(S_BAR)}\n${pc.blue(symbol)} ${pc.white(pc.bold(message))}\n`

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

export async function runInteractiveInstall(): Promise<InstallOptions | null> {
  console.clear()
  console.log(generateLogo())
  console.log(`${pc.blue(S_BAR)}`)

  const currentVersion = getCurrentVersion()
  const latestVersion = await checkForUpdates(currentVersion)

  if (latestVersion) {
    console.log(
      `${pc.blue(S_BAR)}  ${pc.yellow('⚠')}  ${pc.yellow('Update available:')} ${pc.gray(currentVersion)} → ${pc.green(latestVersion)}`,
    )
    console.log(`${pc.blue(S_BAR)}     ${pc.gray('Run: npm update -g @tech-leads-club/agent-skills')}`)
    console.log(`${pc.blue(S_BAR)}`)
  } else if (!isGloballyInstalled()) {
    console.log(`${pc.blue(S_BAR)}  ${pc.yellow('⚠')}  ${pc.yellow('Not installed globally')}`)
    console.log(`${pc.blue(S_BAR)}     ${pc.yellow("Skills won't auto-update. Install globally:")}`)
    console.log(`${pc.blue(S_BAR)}     ${pc.yellow('npm i -g @tech-leads-club/agent-skills')}`)
    console.log(`${pc.blue(S_BAR)}`)
  }

  const skills = discoverSkills()
  if (skills.length === 0) {
    console.log(`${pc.blue(S_BAR_END)}  ${pc.red('No skills available')}`)
    return null
  }

  const installedAgents = detectInstalledAgents()
  const allAgents = getAllAgentTypes()

  if (installedAgents.length > 0) {
    const agentNames = installedAgents
      .slice(0, 5)
      .map((a) => getAgentConfig(a).displayName)
      .join(', ')
    const more = installedAgents.length > 5 ? ` +${installedAgents.length - 5} more` : ''
    console.log(
      `${pc.blue(S_BAR)}  ${pc.blue('●')} ${pc.white('Detected:')} ${pc.white(pc.bold(agentNames))}${pc.white(more)}`,
    )
    console.log(`${pc.blue(S_BAR)}`)
  }

  const installedGlobal = getInstalledSkillNames(installedAgents.length > 0 ? installedAgents : allAgents, true)
  const installedLocal = getInstalledSkillNames(installedAgents.length > 0 ? installedAgents : allAgents, false)
  const installedSkills = new Set([...installedGlobal, ...installedLocal])

  // Step 1
  const selectedSkills = await blueMultiSelect(
    `Which skills do you want to install? ${pc.gray(`(${skills.length} available)`)}`,
    skills.map((skill) => {
      const isInstalled = installedSkills.has(skill.name)
      return {
        value: skill.name,
        label: isInstalled ? `${skill.name} ${pc.green('● installed')}` : skill.name,
        hint: truncate(skill.description, 200),
      }
    }),
  )

  if (typeof selectedSkills === 'symbol') {
    console.log(`${pc.blue(S_BAR_END)}  ${pc.gray('Cancelled')}`)
    return null
  }

  // Step 2
  const selectedAgents = await blueMultiSelect(
    `Where to install? ${pc.gray(`(${selectedSkills.length} skill(s) selected)`)}`,
    allAgents.map((type) => {
      const config = getAgentConfig(type)
      const isInstalled = installedAgents.includes(type)
      return {
        value: type,
        label: isInstalled ? `${config.displayName} ${pc.green('● detected')}` : config.displayName,
        hint: truncate(config.description, 50),
      }
    }),
    installedAgents.length > 0 ? installedAgents : ['cursor', 'claude-code'],
  )

  if (typeof selectedAgents === 'symbol') {
    console.log(`${pc.blue(S_BAR_END)}  ${pc.gray('Cancelled')}`)
    return null
  }

  // Step 3
  const method = await blueSelect(
    'Installation method',
    [
      { value: 'symlink', label: 'Symlink', hint: 'recommended - shared source' },
      { value: 'copy', label: 'Copy', hint: 'independent copies' },
    ],
    'symlink',
  )

  if (typeof method === 'symbol') {
    console.log(`${pc.blue(S_BAR_END)}  ${pc.gray('Cancelled')}`)
    return null
  }

  // Step 4
  const global = await blueConfirm('Install globally? (user home vs this project)', false)

  if (typeof global === 'symbol') {
    console.log(`${pc.blue(S_BAR_END)}  ${pc.gray('Cancelled')}`)
    return null
  }

  console.log(`${pc.blue(S_BAR)}`)

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
) {
  const successful = results.filter((r) => r.success && !r.error)
  const alreadyExists = results.filter((r) => r.success && r.error === 'Already exists')
  const failed = results.filter((r) => !r.success)

  console.log()

  if (successful.length > 0) {
    for (const r of successful) {
      console.log(`${pc.blue(symbol)} ${pc.white(pc.bold(r.skill))} ${pc.gray('→')} ${pc.white(r.agent)}`)
    }
  }

  if (alreadyExists.length > 0) {
    for (const r of alreadyExists) {
      console.log(`${pc.gray(symbol)} ${r.skill} → ${r.agent} ${pc.gray('(exists)')}`)
    }
  }

  if (failed.length > 0) {
    for (const r of failed) {
      console.log(`${pc.red('✗')} ${r.skill} → ${r.agent}: ${r.error}`)
    }
  }

  const totalAgents = new Set(results.map((r) => r.agent)).size

  console.log()
  console.log(
    `${pc.blue(S_BAR_END)}  ${pc.blue('✓')} ${pc.white(pc.bold(`${successful.length} skill(s)`))} ${pc.white('installed to')} ${pc.white(pc.bold(`${totalAgents} agent(s)`))}`,
  )
}

export function showAvailableSkills() {
  const skills = discoverSkills()

  console.clear()
  console.log(generateLogo())

  if (skills.length === 0) {
    console.log(`${pc.blue(S_BAR)}  ${pc.yellow('No skills found')}`)
    return
  }

  console.log(`${pc.blue(S_BAR)}`)
  console.log(`${pc.blue(S_BAR)}  ${pc.bold(`${skills.length} skills available:`)}`)
  console.log(`${pc.blue(S_BAR)}`)

  const allAgents = getAllAgentTypes()
  const installedGlobal = getInstalledSkillNames(allAgents, true)
  const installedLocal = getInstalledSkillNames(allAgents, false)
  const installedSkills = new Set([...installedGlobal, ...installedLocal])

  for (const skill of skills) {
    const isInstalled = installedSkills.has(skill.name)
    const installedBadge = isInstalled ? ` ${pc.green('● installed')}` : ''
    console.log(`${pc.blue(S_BAR)}  ${pc.blue('◆')} ${pc.bold(skill.name)}${installedBadge}`)
    console.log(`${pc.blue(S_BAR)}    ${pc.dim(pc.gray(skill.description))}`)
  }

  console.log(`${pc.blue(S_BAR)}`)
  console.log(`${pc.blue(S_BAR_END)}  ${pc.gray('Run "npx @tech-leads-club/agent-skills" to install')}`)
}
