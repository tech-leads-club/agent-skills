import pc from 'picocolors'

import { getAllAgentTypes } from '../agents'
import { removeSkill } from '../installer'
import type { AgentType } from '../types'
import { blueConfirm, blueMultiSelectWithBack, isCancelled } from '../ui/input'
import { initScreen } from '../ui/screen'
import { logBar, logBarEnd, logCancelled } from '../ui/styles'
import { showRemoveResults } from './results'
import { buildAgentOptions, getInstalledSkillNames } from './utils'

export async function runInteractiveRemove(global: boolean): Promise<void> {
  initScreen()
  const allAgents = getAllAgentTypes()
  const installedSkills = await getInstalledSkillNames(allAgents, global)

  if (installedSkills.size === 0) {
    logBar(pc.yellow('No skills installed'))
    logBarEnd()
    return
  }

  const skillsArray = Array.from(installedSkills)

  // Step 1
  const selectedSkills = await selectSkillsToRemove(skillsArray)
  if (selectedSkills === null) return

  // Step 2
  const selectedAgents = await selectAgentsToRemoveFrom(allAgents, allAgents)
  if (selectedAgents === null) return
  if (isCancelled(selectedAgents)) return

  // Step 3
  const confirm = await blueConfirm(
    `Remove ${selectedSkills.length} skill(s) from ${selectedAgents.length} agent(s)?`,
    false,
  )

  if (isCancelled(confirm) || !confirm) {
    logCancelled()
    return
  }

  logBar()

  for (const skillName of selectedSkills) {
    const results = await removeSkill(skillName, selectedAgents as AgentType[], { global })
    showRemoveResults(skillName, results)
  }
}

async function selectSkillsToRemove(skillsArray: string[]): Promise<string[] | null> {
  const result = await blueMultiSelectWithBack(
    `Which skills do you want to remove? ${pc.gray(`(${skillsArray.length} installed)`)}`,
    skillsArray.map((name) => ({ value: name, label: name })),
    [],
    false,
  )
  const selectedSkills = result.value

  if (isCancelled(selectedSkills)) {
    logCancelled()
    return null
  }

  const validSkills = selectedSkills as string[]

  if (validSkills.length === 0) {
    logBar(pc.yellow('⚠ Please select at least one skill'))
    return selectSkillsToRemove(skillsArray)
  }

  return validSkills
}

async function selectAgentsToRemoveFrom(
  allAgents: AgentType[],
  initialSelection: AgentType[],
  initialCursor = 0,
): Promise<AgentType[] | symbol | null> {
  const result = await blueMultiSelectWithBack(
    'Remove from which agents?',
    buildAgentOptions(allAgents).map((opt) => ({ ...opt, hint: undefined })),
    initialSelection,
    true,
    initialCursor,
  )
  const { value: selectedAgents, cursor: finalCursor } = result

  if (selectedAgents === Symbol.for('back')) return Symbol.for('back')

  if (isCancelled(selectedAgents)) {
    logCancelled()
    return null
  }

  const validAgents = selectedAgents as AgentType[]

  if (validAgents.length === 0) {
    logBar(pc.yellow('⚠ Please select at least one agent'))
    return selectAgentsToRemoveFrom(allAgents, [], finalCursor)
  }

  return validAgents
}
