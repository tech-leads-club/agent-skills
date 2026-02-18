import chalk from 'chalk'
import { fetchRegistry, forceDownloadSkill, getUpdatableSkills, needsUpdate } from '../services/registry'

interface UpdateCliOptions {
  skill?: string
}

export async function runCliUpdate(options: UpdateCliOptions): Promise<void> {
  console.log(chalk.blue('⏳ Fetching latest registry...'))
  await fetchRegistry(true)

  if (options.skill) {
    const outdated = await needsUpdate(options.skill)
    if (!outdated) {
      console.log(chalk.green(`✅ ${options.skill} is already up to date`))
      return
    }

    console.log(chalk.blue(`⏳ Updating ${options.skill}...`))
    const path = await forceDownloadSkill(options.skill)

    if (path) {
      console.log(chalk.green(`✅ Updated ${options.skill}`))
    } else {
      console.error(chalk.red(`❌ Failed to update ${options.skill}`))
      process.exit(1)
    }
  } else {
    const { readSkillLock } = await import('../services/lockfile')
    const lock = await readSkillLock()
    const installedNames = Object.keys(lock.skills)

    if (installedNames.length === 0) {
      console.log(chalk.yellow('No installed skills found. Run agent-skills install first.'))
      return
    }

    const { toUpdate, upToDate } = await getUpdatableSkills(installedNames)

    if (toUpdate.length === 0) {
      console.log(chalk.green(`✅ All ${upToDate.length} installed skills are up to date`))
      return
    }

    console.log(chalk.blue(`⏳ Updating ${toUpdate.length} of ${installedNames.length} skills...`))
    let updated = 0
    let failed = 0

    for (const name of toUpdate) {
      const path = await forceDownloadSkill(name)
      if (path) {
        updated++
      } else {
        failed++
        console.error(chalk.red(`  ❌ Failed to update ${name}`))
      }
    }

    console.log(
      chalk.green(
        `✅ ${updated} updated, ${upToDate.length} already up to date${failed > 0 ? chalk.red(`, ${failed} failed`) : ''}`,
      ),
    )
  }
}
