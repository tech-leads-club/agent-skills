import { MAX_REFERENCE_FILES_DISPLAY, SKILL_MAIN_FILE } from '../../constants'
import type { SkillEntry } from '../../types'
import { isOptionalReferencePath } from '../../utils'

type ContentBlocks = {
  content: [{ type: 'text'; text: string }, { type: 'text'; text: string }]
}

export function getMainSkillFile(skill: SkillEntry, skillName: string): string {
  const mainFile = skill.files.find((file: string) => file === SKILL_MAIN_FILE)
  if (mainFile) return mainFile
  throw new Error(`Skill '${skillName}' has no ${SKILL_MAIN_FILE} in files list. Please report this registry issue.`)
}

export function getReferenceFiles(skill: SkillEntry): string[] {
  return skill.files.filter((file: string) => isOptionalReferencePath(file))
}

export function formatReferenceList(referenceFiles: string[]): string {
  const omitted =
    referenceFiles.length > MAX_REFERENCE_FILES_DISPLAY ? referenceFiles.length - MAX_REFERENCE_FILES_DISPLAY : 0
  const displayedFiles = omitted > 0 ? referenceFiles.slice(0, MAX_REFERENCE_FILES_DISPLAY) : referenceFiles
  let referenceList = displayedFiles.join('\n')
  if (omitted > 0) referenceList += `\n\n(${omitted} more files omitted)`
  return referenceList
}

export function buildReadSkillOutput(mainContent: string, referenceFiles: string[]): string | ContentBlocks {
  if (referenceFiles.length === 0) return mainContent

  return {
    content: [
      { type: 'text', text: mainContent },
      { type: 'text', text: formatReferenceList(referenceFiles) },
    ],
  }
}
