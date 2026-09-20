import type { AgentType } from '@tech-leads-club/core'
import { AGENT_TYPES, detectInstalledAgents } from '@tech-leads-club/core'
import chalk from 'chalk'

import { ports } from '../ports'
import { loadConfig, saveConfig } from '../services/config'

interface AgentsCliOptions {
  add?: string[]
  set?: string[]
  remove?: string[]
  clear?: boolean
  show?: boolean
  auto?: boolean
}

function validateOptions(options: AgentsCliOptions): void {
  const activeOptionsCount = [
    options.add,
    options.set,
    options.remove,
    options.show,
    options.clear,
    options.auto,
  ].filter(Boolean).length

  if (activeOptionsCount > 1) {
    console.error(chalk.red('❌ Only one option can be used at a time'))
    process.exit(1)
  }
}

async function autoDetectAgents(currentAgents: AgentType[]): Promise<void> {
  const detected = detectInstalledAgents(ports)

  if (detected.length === 0) {
    if (currentAgents.length > 0) {
      console.warn(chalk.yellow('⚠️  No supported agents detected. Keeping existing configuration.'))
    } else {
      console.error(chalk.red('❌ No supported agents detected.'))
    }
    process.exit(1)
  }

  await saveConfig({ targetAgents: detected })
  console.log(chalk.green(`✅ Auto-detected and set target agents: ${detected.join(', ')}`))
}

function validateAgents(agents: string[]): AgentType[] {
  const invalidAgents = agents.filter((a) => !AGENT_TYPES.includes(a as AgentType))
  if (invalidAgents.length > 0) {
    console.error(chalk.red(`❌ Unknown agent(s): ${invalidAgents.join(', ')}`))
    console.error(chalk.dim(`   Valid agents: ${AGENT_TYPES.join(', ')}`))
    process.exit(1)
  }
  return agents as AgentType[]
}

async function addAgents(rawAgents: string[], currentAgents: AgentType[]): Promise<void> {
  const validAgents = validateAgents(rawAgents)
  const newAgents = Array.from(new Set([...currentAgents, ...validAgents])) as AgentType[]
  await saveConfig({ targetAgents: newAgents })
  console.log(chalk.green(`✅ Target agents updated with: ${validAgents.join(', ')}`))
}

async function setAgents(rawAgents: string[]): Promise<void> {
  const validAgents = validateAgents(rawAgents)
  await saveConfig({ targetAgents: validAgents })
  console.log(chalk.green(`✅ Target agents set to: ${validAgents.join(', ')}`))
}

async function removeAgents(rawAgents: string[], currentAgents: AgentType[]): Promise<void> {
  const validAgents = validateAgents(rawAgents)

  const removedAgents = currentAgents.filter((a) => validAgents.includes(a))
  if (removedAgents.length === 0) {
    console.warn(chalk.yellow('⚠️  None of the specified agents were in your target list.'))
    console.log(chalk.dim(`   Current target agents: ${currentAgents.join(', ')}`))
    return
  }

  const newAgents = currentAgents.filter((a) => !removedAgents.includes(a))

  await saveConfig({ targetAgents: newAgents })
  console.log(chalk.green(`✅ Target agents removed: ${removedAgents.join(', ')}`))
}

async function showAgents(currentAgents: AgentType[]): Promise<void> {
  console.log(chalk.bold('Target agents:'))
  if (currentAgents.length > 0) {
    console.log(`  ${currentAgents.join(', ')}`)
  } else {
    console.log(chalk.dim('  (None set)'))
  }
}

async function clearAgents(): Promise<void> {
  await saveConfig({ targetAgents: [] })
  console.log(chalk.green('🧹 Target agents cleared'))
}

export async function runCliAgents(options: AgentsCliOptions): Promise<void> {
  validateOptions(options)

  const config = await loadConfig()
  const currentAgents = config.targetAgents || []

  if (options.auto) {
    await autoDetectAgents(currentAgents)
  }

  if (options.add) {
    await addAgents(options.add, currentAgents)
    return
  }

  if (options.set) {
    await setAgents(options.set)
    return
  }

  if (options.remove) {
    await removeAgents(options.remove, currentAgents)
    return
  }

  if (options.show) {
    await showAgents(currentAgents)
    return
  }

  if (options.clear) {
    await clearAgents()
    return
  }

  console.log(chalk.bold('Target agents management'))
  console.log(chalk.dim('Manage the agents that will receive the skills by default when you install them.'))
  console.log(chalk.dim('Let this configuration empty to auto-detect the agents you have installed.'))
  console.log(chalk.dim('You can override this configuration when you install a skill by using the --agent flag.'))
  console.log()
  console.log(
    'Usage: agent-skills agents [--add <agents...>] [--set <agents...>] [--remove <agents...>] [--show] [--clear] [--auto]',
  )
  console.log()
  console.log('Options:')
  console.log(`  ${chalk.blue('--add')}           Add agents to target list`)
  console.log(`  ${chalk.blue('--set')}           Set entire target agents list`)
  console.log(`  ${chalk.blue('--remove')}        Remove agents from target list`)
  console.log(`  ${chalk.blue('--show')}          Show current target agents list`)
  console.log(`  ${chalk.blue('--clear')}         Clear target agents list`)
  console.log(`  ${chalk.blue('--auto')}          Auto-detect installed agents and set them as target`)
}
