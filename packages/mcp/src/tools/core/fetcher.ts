import type { SkillEntry } from '../../types'
import { isBundledFilePath } from '../../utils'

/**
 * Character budget for one fetch_skill_files response (~12.5k tokens).
 * why: reference files are unbounded in size, so a handful of large ones in a single call can
 * exceed the ~25k-token cap agents apply to tool responses and cost the turn.
 */
export const MAX_REFERENCE_RESPONSE_CHARS = 50_000

/** Below this, a truncated file carries no usable signal — omit it instead. */
const MIN_USEFUL_TRUNCATION_CHARS = 2_000

export function getInvalidReferencePaths(skill: SkillEntry, filePaths: string[]): string[] {
  const validReferencePaths = new Set(skill.files.filter((filePath: string) => isBundledFilePath(filePath)))
  return filePaths.filter((path) => !validReferencePaths.has(path))
}

export type ReferenceFileSelection = {
  files: Array<{ path: string; text: string; truncated: boolean }>
  omitted: string[]
  missing: string[]
  budgetOmitted: string[]
}

/**
 * Picks the reference files that fit a character budget, in the requested order.
 * Once the budget runs out the remaining paths are reported as omitted.
 */
export function selectReferenceFiles(
  requestedPaths: string[],
  contents: ReadonlyMap<string, string>,
  budgetChars: number = MAX_REFERENCE_RESPONSE_CHARS,
): ReferenceFileSelection {
  const files: ReferenceFileSelection['files'] = []
  const missing: string[] = []
  const budgetOmitted: string[] = []
  let used = 0
  let budgetExhausted = false

  for (const filePath of requestedPaths) {
    const content = contents.get(filePath)

    if (content === undefined) {
      missing.push(filePath)
      continue
    }

    if (budgetExhausted) {
      budgetOmitted.push(filePath)
      continue
    }

    const remaining = budgetChars - used

    if (content.length <= remaining) {
      files.push({ path: filePath, text: content, truncated: false })
      used += content.length
      continue
    }

    if (remaining >= MIN_USEFUL_TRUNCATION_CHARS) {
      files.push({ path: filePath, text: content.slice(0, remaining), truncated: true })
    } else {
      budgetOmitted.push(filePath)
    }

    budgetExhausted = true
  }

  return { files, omitted: [...missing, ...budgetOmitted], missing, budgetOmitted }
}

/**
 * Assembles the reference-file response within a character budget.
 * Files are emitted in the requested order; once the budget runs out the remaining
 * paths are reported back with an instruction the agent can act on.
 */
export function buildReferenceFilesOutput(
  requestedPaths: string[],
  contents: ReadonlyMap<string, string>,
  budgetChars: number = MAX_REFERENCE_RESPONSE_CHARS,
): string {
  const { files, missing, budgetOmitted } = selectReferenceFiles(requestedPaths, contents, budgetChars)
  const parts = files.map((file) =>
    file.truncated
      ? `## ${file.path} [truncated: first ${file.text.length} of ${contents.get(file.path)?.length} chars]\n\n${file.text}`
      : `## ${file.path}\n\n${file.text}`,
  )
  const truncated = files.find((file) => file.truncated)?.path

  const notes: string[] = []
  if (missing.length > 0) notes.push(`Failed to fetch: ${missing.join(', ')}`)
  if (truncated !== undefined || budgetOmitted.length > 0) {
    const detail = [
      truncated !== undefined ? `'${truncated}' was cut short` : undefined,
      budgetOmitted.length > 0 ? `not returned: ${budgetOmitted.join(', ')}` : undefined,
    ]
      .filter(Boolean)
      .join('; ')
    notes.push(
      `Response budget of ${budgetChars} chars reached — ${detail}. ` +
        'Call fetch_skill_files again with fewer paths to get the rest.',
    )
  }

  const output = parts.join('\n\n---\n\n')
  if (notes.length === 0) return output
  const note = notes.join('\n')
  return output.length > 0 ? `${output}\n\n---\n\n${note}` : note
}
