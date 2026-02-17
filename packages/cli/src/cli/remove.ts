import chalk from 'chalk'

import { removeSkill } from '../services/installer'
import type { AgentType } from '../types'

interface RemoveCliOptions {
  skill?: string[]
  agent?: string[]
  global?: boolean
  force?: boolean
}

export async function runCliRemove(options: RemoveCliOptions): Promise<void> {
  if (!options.skill || options.skill.length === 0) {
    console.error(chalk.red('❌ --skill is required in CLI mode'))
    console.error(
      chalk.dim('Usage: agent-skills remove --skill <name1> [name2...] [--agent <agents...>] [--global] [--force]'),
    )
    process.exit(1)
  }

  const skillNames = Array.isArray(options.skill) ? options.skill : [options.skill]
  const agents = (options.agent || ['cursor', 'claude-code', 'windsurf']) as AgentType[]

  if (options.force) {
    console.log(chalk.yellow('⚠️  Force mode enabled - bypassing lockfile check'))
  }

  console.log(chalk.blue(`⏳ Removing ${skillNames.length} skill(s) from ${agents.length} agent(s)...`))

  let totalSuccess = 0
  let totalFailed = 0
  let hasLockfileError = false

  for (const skillName of skillNames) {
    const results = await removeSkill(skillName, agents, {
      global: options.global,
      force: options.force,
    })

    const successful = results.filter((r) => r.success)
    const failed = results.filter((r) => !r.success)

    if (successful.length > 0) {
      console.log(chalk.green(`✅ ${skillName}: Removed from ${successful.length} agent(s)`))
      successful.forEach((r) => console.log(chalk.dim(`  • ${r.agent}`)))
      totalSuccess += successful.length
    }

    if (failed.length > 0) {
      console.log(chalk.red(`❌ ${skillName}: Failed to remove from ${failed.length} agent(s)`))
      failed.forEach((r) => console.log(chalk.dim(`  • ${r.agent}: ${r.error}`)))
      totalFailed += failed.length

      if (failed.some((r) => r.error?.includes('lockfile'))) {
        hasLockfileError = true
      }
    }
  }

  console.log(chalk.dim(`\n${totalSuccess} succeeded, ${totalFailed} failed`))

  if (hasLockfileError && !options.force) {
    console.log(chalk.yellow('\n💡 Tip: Use --force to bypass lockfile check'))
  }

  if (totalFailed > 0) {
    process.exit(1)
  }
}
