import { Command } from 'commander'

import { installSkills } from './installer'
import { runInteractiveInstall, showAvailableSkills, showInstallResults } from './prompts'
import { discoverSkills, getSkillByName } from './skills'
import type { AgentType } from './types'

const program = new Command()

program.name('tlc-skills').description('Install TLC Agent Skills to your AI coding agents').version('0.0.1')

program
  .command('install', { isDefault: true })
  .description('Interactive skill installation (default)')
  .option('-g, --global', 'Install globally to user home', false)
  .option('-s, --skill <name>', 'Install a specific skill')
  .option('-a, --agent <agents...>', 'Target specific agents')
  .option('--copy', 'Use copy instead of symlink', false)
  .action(async (options) => {
    if (options.skill || options.agent) {
      // Non-interactive mode
      await runNonInteractive(options)
    } else {
      // Interactive mode
      const installOptions = await runInteractiveInstall()
      if (!installOptions) return
      const skills = discoverSkills().filter((s) => installOptions.skills.includes(s.name))
      const results = installSkills(skills, installOptions)
      showInstallResults(results)
    }
  })

program
  .command('list')
  .alias('ls')
  .description('List available skills')
  .action(() => {
    showAvailableSkills()
  })

async function runNonInteractive(options: { skill?: string; agent?: string[]; global: boolean; copy: boolean }) {
  const allSkills = discoverSkills()
  let skills = allSkills

  if (options.skill) {
    const skill = getSkillByName(options.skill)
    if (!skill) {
      console.error(`Skill "${options.skill}" not found.`)
      console.log('Available skills:', allSkills.map((s) => s.name).join(', '))
      process.exit(1)
    }
    skills = [skill]
  }

  const agents = (options.agent || ['antigravity', 'claude-code', 'cursor']) as AgentType[]
  const method = options.copy ? 'copy' : 'symlink'

  const results = installSkills(skills, {
    agents,
    skills: skills.map((s) => s.name),
    method,
    global: options.global,
  })

  showInstallResults(results)
}

program.parse()
