import pc from 'picocolors'

import { logBar, logBarEnd, S_BAR, SYMBOL } from '../ui/styles'

interface InstallationSummaryOptions {
  skills: string[]
  agents: string[]
  method: string
}

export function showInstallationSummary(options: InstallationSummaryOptions): void {
  logBar()
  logBar(pc.blue(pc.bold('📋 Installation Summary')))
  logBar()
  logBar(`${pc.blue(S_BAR)}  ${pc.white(pc.bold('Skills:'))} ${pc.gray(options.skills.join(', '))}`)
  logBar(`${pc.blue(S_BAR)}  ${pc.white(pc.bold('Agents:'))} ${pc.gray(options.agents.join(', '))}`)
  logBar(`${pc.blue(S_BAR)}  ${pc.white(pc.bold('Method:'))} ${pc.cyan(options.method)}`)
  logBar()
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
