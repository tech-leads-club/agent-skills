import { Command } from 'commander'

import pkg from '../package.json' with { type: 'json' }
import { installSkills, removeSkill } from './installer'
import { runInteractiveInstall } from './prompts/install'
import { showAvailableSkills } from './prompts/list'
import { runInteractiveRemove } from './prompts/remove'
import { showInstallResults, showRemoveResults } from './prompts/results'
import { discoverSkills, getSkillByName } from './skills'
import type { AgentType } from './types'

const program = new Command()

program.name('tlc-skills').description('Install TLC Agent Skills to your AI coding agents').version(pkg.version)

program
  .command('install', { isDefault: true })
  .description('Interactive skill installation (default)')
  .option('-g, --global', 'Install globally to user home', false)
  .option('-s, --skill <name>', 'Install a specific skill')
  .option('-a, --agent <agents...>', 'Target specific agents')
  .option('--copy', 'Use copy instead of symlink', false)
  .action(async (options) => {
    if (options.skill || options.agent) {
      await runNonInteractive(options)
    } else {
      const installOptions = await runInteractiveInstall()
      if (!installOptions) return
      const skills = discoverSkills().filter((s) => installOptions.skills.includes(s.name))
      const results = await installSkills(skills, installOptions)
      showInstallResults(results)
    }
  })

program
  .command('list')
  .alias('ls')
  .description('List available skills')
  .action(async () => {
    await showAvailableSkills()
  })

program
  .command('remove')
  .alias('rm')
  .description('Remove installed skills')
  .option('-g, --global', 'Remove from global installation', false)
  .option('-s, --skill <name>', 'Remove a specific skill')
  .option('-a, --agent <agents...>', 'Target specific agents')
  .action(async (options) => {
    if (options.skill) {
      const agents = (options.agent || ['antigravity', 'claude-code', 'cursor']) as AgentType[]
      const results = await removeSkill(options.skill, agents, { global: options.global })
      showRemoveResults(options.skill, results)
    } else {
      await runInteractiveRemove(options.global)
    }
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

  const results = await installSkills(skills, {
    agents,
    skills: skills.map((s) => s.name),
    method,
    global: options.global,
  })

  showInstallResults(results)
}

program.parse()
