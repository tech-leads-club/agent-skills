import chalk from 'chalk'
import {
  fetchRegistry,
  getDeprecatedMap,
  getRemoteSkills,
  getUpdatableSkills,
  needsUpdate,
  readSkillLock,
  updateSkills,
} from '@tech-leads-club/core'

import { ports } from '../ports'

interface UpdateCliOptions {
  skill?: string
}

export async function runCliUpdate(options: UpdateCliOptions): Promise<void> {
  console.log(chalk.blue('⏳ Fetching latest registry...'))
  await fetchRegistry(ports, true)

  if (options.skill) {
    const outdated = await needsUpdate(ports, options.skill)
    if (!outdated) {
      console.log(chalk.green(`✅ ${options.skill} is already up to date`))
      return
    }

    console.log(chalk.blue(`⏳ Updating ${options.skill}...`))
    const results = await updateSkills(ports, [options.skill])

    if (results.length === 0) {
      // Skill was in the registry and its cache was refreshed, but it was not
      // recorded in any lockfile — nothing to reinstall.
      console.log(chalk.green(`✅ Cache updated for ${options.skill} (not installed in any agent)`))
      return
    }

    const failed = results.filter((r) => !r.success)
    if (failed.length === 0) {
      console.log(chalk.green(`✅ Updated ${options.skill}`))
    } else {
      failed.forEach((r) => console.error(chalk.red(`  ❌ ${r.skill} → ${r.agent}: ${r.error}`)))
      process.exit(1)
    }
  } else {
    const lock = await readSkillLock(ports)
    const installedNames = Object.keys(lock.skills)

    if (installedNames.length === 0) {
      console.log(chalk.yellow('No installed skills found. Run agent-skills install first.'))
      return
    }

    const { toUpdate, upToDate } = await getUpdatableSkills(ports, installedNames)

    if (toUpdate.length === 0) {
      console.log(chalk.green(`✅ All ${upToDate.length} installed skills are up to date`))
    } else {
      console.log(chalk.blue(`⏳ Updating ${toUpdate.length} of ${installedNames.length} skills...`))

      const results = await updateSkills(ports, toUpdate)
      const successSkills = new Set(results.filter((r) => r.success).map((r) => r.skill))
      const failedResults = results.filter((r) => !r.success)

      // Skills with no lockfile entry get treated as cache-only updates (success)
      const noLockfileSkills = toUpdate.filter((name) => !results.some((r) => r.skill === name))
      const updated = successSkills.size + noLockfileSkills.length
      const failed = failedResults.length

      console.log(
        chalk.green(
          `✅ ${updated} updated, ${upToDate.length} already up to date${failed > 0 ? chalk.red(`, ${failed} failed`) : ''}`,
        ),
      )

      if (failed > 0) {
        failedResults.forEach((r) => console.error(chalk.red(`  ❌ ${r.skill} → ${r.agent}: ${r.error}`)))
      }
    }

    // Check for deprecated/orphaned skills
    const deprecatedMap = await getDeprecatedMap(ports)
    const remoteSkills = await getRemoteSkills(ports)
    const registryNames = new Set(remoteSkills.map((s) => s.name))

    const deprecated = installedNames.filter((name) => deprecatedMap.has(name) || !registryNames.has(name))

    if (deprecated.length > 0) {
      console.log('')
      console.log(chalk.yellow(`⚠  ${deprecated.length} deprecated skill${deprecated.length > 1 ? 's' : ''} detected:`))

      const renderers: Record<
        'withEntry' | 'noEntry',
        (name: string, entry?: { message: string; alternatives?: string[] }) => void
      > = {
        withEntry: (name, entry) => {
          console.log(chalk.yellow(`  › ${name} — ${entry!.message}`))
          if (entry!.alternatives?.length) {
            console.log(chalk.dim(`    Try: agent-skills install --skill ${entry!.alternatives.join(', ')}`))
          }
        },
        noEntry: (name) => {
          console.log(chalk.yellow(`  › ${name} — no longer available in the registry`))
        },
      }

      deprecated.forEach((name) => {
        const entry = deprecatedMap.get(name)
        const rendererKey = entry ? 'withEntry' : 'noEntry'
        renderers[rendererKey](name, entry)
      })

      console.log(chalk.dim(`  Run: agent-skills remove --skill <name> to clean up`))
    }
  }
}
