import type { SkillEntry } from '../../types'
import { buildCdnUrl, isOptionalReferencePath } from '../../utils'

export function getInvalidReferencePaths(skill: SkillEntry, filePaths: string[]): string[] {
  const validReferencePaths = new Set(skill.files.filter((filePath: string) => isOptionalReferencePath(filePath)))
  return filePaths.filter((path) => !validReferencePaths.has(path))
}

export async function fetchReferenceFileContents(
  skill: SkillEntry,
  filePaths: string[],
  fetchText: (url: string) => Promise<string>,
): Promise<string> {
  const results = await Promise.allSettled(
    filePaths.map(async (filePath) => {
      const content = await fetchText(buildCdnUrl(skill.path, filePath))
      return { filePath, content }
    }),
  )

  const successParts: string[] = []
  const failedPaths: string[] = []

  for (const [index, result] of results.entries()) {
    if (result.status === 'fulfilled') {
      successParts.push(`## ${result.value.filePath}\n\n${result.value.content}`)
      continue
    }
    failedPaths.push(filePaths[index])
  }

  const output = successParts.join('\n\n---\n\n')
  if (failedPaths.length === 0) return output
  const failureNote = `Failed to fetch: ${failedPaths.join(', ')}`
  return output.length > 0 ? `${output}\n\n---\n\n${failureNote}` : failureNote
}
