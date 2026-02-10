import { Command } from 'commander'
import pc from 'picocolors'

import pkg from '../package.json' with { type: 'json' }

import { installSkills, removeSkill } from './installer'
import { runInteractiveInstall } from './prompts/install'
import { showAvailableSkills } from './prompts/list'
import { runInteractiveRemove } from './prompts/remove'
import { showInstallResults, showRemoveResults } from './prompts/results'
import type { UpdateConfig } from './prompts/utils'
import { clearCache, fetchRegistry, forceDownloadSkill, getCacheDir, getUpdatableSkills, needsUpdate } from './registry'
import { discoverSkillsAsync, ensureSkillAvailable, getSkillByNameAsync } from './skills-provider'
import type { AgentType, InstallOptions, SkillInfo } from './types'
import { withSpinner } from './ui/spinner'
import { logBar } from './ui/styles'

const program = new Command()

program.name('tlc-skills').description('Install TLC Agent Skills to your AI coding agents').version(pkg.version)

function isUpdateConfig(result: InstallOptions | UpdateConfig[]): result is UpdateConfig[] {
  return Array.isArray(result)
}

async function downloadSkills(
  skillNames: string[],
  allSkills: SkillInfo[],
  forceDownload: boolean,
): Promise<SkillInfo[]> {
  const selectedSkills: SkillInfo[] = []

  for (const skillName of skillNames) {
    const skill = allSkills.find((s) => s.name === skillName)
    if (skill) {
      const path = forceDownload ? await forceDownloadSkill(skillName) : await ensureSkillAvailable(skillName)
      if (path) selectedSkills.push({ ...skill, path })
    }
  }

  return selectedSkills
}

program
  .command('install', { isDefault: true })
  .description('Interactive skill installation (default)')
  .option('-g, --global', 'Install globally to user home', false)
  .option('-s, --skill <name>', 'Install a specific skill')
  .option('-a, --agent <agents...>', 'Target specific agents')
  .option('--copy', 'Use copy instead of symlink', false)
  .option('-f, --force', 'Force re-download skills (bypass cache)', false)
  .action(async (options) => {
    if (options.skill || options.agent) {
      await runNonInteractive(options)
    } else {
      const result = await runInteractiveInstall()
      if (!result) return

      const allSkills = await discoverSkillsAsync()

      if (isUpdateConfig(result)) {
        const allResults: Awaited<ReturnType<typeof installSkills>> = []

        for (const config of result) {
          const location = config.global ? 'global' : 'local'
          logBar()
          const skills = await withSpinner(`Downloading ${config.skills.length} skills (${location})...`, () =>
            downloadSkills(config.skills, allSkills, true),
          )

          const installOptions: InstallOptions = {
            skills: config.skills,
            agents: config.agents,
            method: 'symlink',
            global: config.global,
            forceUpdate: true,
            isUpdate: true,
          }

          const results = await installSkills(skills, installOptions)
          allResults.push(...results)
        }

        showInstallResults(allResults, true)
      } else {
        logBar()
        const skills = await withSpinner(`Downloading ${result.skills.length} skills...`, () =>
          downloadSkills(result.skills, allSkills, options.force),
        )

        const results = await installSkills(skills, result)
        showInstallResults(results, result.isUpdate)
      }
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

program
  .command('update')
  .description('Update installed skills to the latest version')
  .option('-s, --skill <name>', 'Update a specific skill')
  .action(async (options) => {
    console.log(pc.blue('⏳ Fetching latest registry...'))
    await fetchRegistry(true)

    if (options.skill) {
      const outdated = await needsUpdate(options.skill)

      if (!outdated) {
        console.log(pc.green(`✅ ${options.skill} is already up to date`))
        return
      }

      console.log(pc.blue(`⏳ Updating ${options.skill}...`))
      const path = await forceDownloadSkill(options.skill)
      if (path) {
        console.log(pc.green(`✅ Updated ${options.skill}`))
      } else {
        console.error(pc.red(`❌ Failed to update ${options.skill}`))
        process.exit(1)
      }
    } else {
      const { readSkillLock } = await import('./lockfile')
      const lock = await readSkillLock()
      const installedNames = Object.keys(lock.skills)

      if (installedNames.length === 0) {
        console.log(pc.yellow('No installed skills found. Run tlc-skills install first.'))
        return
      }

      const { toUpdate, upToDate } = await getUpdatableSkills(installedNames)

      if (toUpdate.length === 0) {
        console.log(pc.green(`✅ All ${upToDate.length} installed skills are up to date`))
        return
      }

      console.log(pc.blue(`⏳ Updating ${toUpdate.length} of ${installedNames.length} skills...`))

      let updated = 0
      let failed = 0

      for (const name of toUpdate) {
        const path = await forceDownloadSkill(name)
        if (path) {
          updated++
        } else {
          failed++
          console.error(pc.red(`  ❌ Failed to update ${name}`))
        }
      }

      console.log(
        pc.green(
          `✅ ${updated} updated, ${upToDate.length} already up to date${failed > 0 ? pc.red(`, ${failed} failed`) : ''}`,
        ),
      )
    }
  })

program
  .command('cache')
  .description('Manage the skills cache')
  .option('--clear', 'Clear all cached skills and registry')
  .option('--path', 'Show cache directory path')
  .action((options) => {
    if (options.clear) {
      clearCache()
      console.log(pc.green('✅ Cache cleared'))
    } else if (options.path) {
      console.log(getCacheDir())
    } else {
      console.log(pc.bold('Cache management:'))
      console.log(`  ${pc.blue('--clear')}  Clear all cached skills and registry`)
      console.log(`  ${pc.blue('--path')}   Show cache directory path`)
      console.log()
      console.log(pc.dim(`Cache location: ${getCacheDir()}`))
    }
  })

async function runNonInteractive(options: {
  skill?: string
  agent?: string[]
  global: boolean
  copy: boolean
  force?: boolean
}) {
  console.log(pc.blue('⏳ Loading skills catalog...'))
  const allSkills = await discoverSkillsAsync()
  let skills = allSkills

  if (options.skill) {
    const skill = await getSkillByNameAsync(options.skill)
    if (!skill) {
      console.error(pc.red(`Skill "${options.skill}" not found.`))
      console.log('Available skills:', allSkills.map((s) => s.name).join(', '))
      process.exit(1)
    }

    console.log(pc.blue(`⏳ ${options.force ? 'Re-downloading' : 'Downloading'} ${options.skill}...`))
    const path = options.force ? await forceDownloadSkill(options.skill) : await ensureSkillAvailable(options.skill)
    if (!path) {
      console.error(pc.red(`Failed to download skill "${options.skill}".`))
      process.exit(1)
    }

    skills = [{ ...skill, path }]
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
