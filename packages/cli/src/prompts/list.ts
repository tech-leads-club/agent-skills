import pc from 'picocolors'

import { getAllAgentTypes } from '../agents'
import { groupSkillsByCategory } from '../categories'
import { discoverSkillsAsync } from '../skills-provider'
import { initScreen } from '../ui/screen'
import { withSpinner } from '../ui/spinner'
import { logBar, logBarEnd, S_BAR } from '../ui/styles'
import { getAllInstalledSkillNames } from './utils'

export async function showAvailableSkills(): Promise<void> {
  initScreen()

  const skills = await withSpinner('Loading skills catalog...', discoverSkillsAsync)

  if (skills.length === 0) {
    logBar(pc.yellow('No skills found. Check your internet connection.'))
    return
  }

  logBar(pc.bold(`${skills.length} skills available:`))
  logBar()

  const allAgents = getAllAgentTypes()
  const installedSkills = await getAllInstalledSkillNames(allAgents)
  const groupedSkills = groupSkillsByCategory(skills)

  for (const [category, categorySkills] of groupedSkills) {
    logBar(`${pc.cyan('▸')} ${pc.bold(pc.cyan(category.name))}`)

    for (const skill of categorySkills) {
      const installedBadge = installedSkills.has(skill.name) ? ` ${pc.green('● installed')}` : ''
      logBar(`  ${pc.blue('◆')} ${pc.bold(skill.name)}${installedBadge}`)
      console.log(`${pc.blue(S_BAR)}      ${pc.dim(pc.gray(skill.description))}`)
    }

    logBar()
  }

  logBarEnd(pc.gray('Run "npx @tech-leads-club/agent-skills" to install'))
}
