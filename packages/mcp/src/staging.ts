import { mkdir, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join, resolve, sep } from 'node:path'

import { STAGING_DIR_NAME } from './constants'

/** Root directory for staged skill files. Overridable for tests and sandboxed environments. */
export function getStagingRoot(): string {
  const override = process.env.SKILLS_STAGING_DIR?.trim()
  if (override) return resolve(override)
  return join(homedir(), '.cache', STAGING_DIR_NAME)
}

export function getSkillStagingDir(skillName: string): string {
  return join(getStagingRoot(), skillName)
}

/**
 * Writes verified skill files under the skill's staging directory and returns their absolute paths.
 *
 * hazard: every destination is re-checked against the skill directory after path resolution.
 * isSafeStagingPath already rejects traversal in the registry-supplied path, and this is the
 * second gate — a write that would land outside the skill directory throws instead.
 */
export async function stageSkillFiles(
  skillName: string,
  files: ReadonlyMap<string, string>,
): Promise<Map<string, string>> {
  const skillDir = getSkillStagingDir(skillName)
  const staged = new Map<string, string>()

  for (const [filePath, content] of files) {
    const destination = resolve(skillDir, filePath)
    if (destination !== skillDir && !destination.startsWith(skillDir + sep)) {
      throw new Error(`Refusing to stage '${filePath}': resolves outside the skill directory.`)
    }

    await mkdir(dirname(destination), { recursive: true })
    // hazard: this is remotely-sourced code landing on the user's filesystem. Writing it
    // owner-only and without the execute bit means running it takes a deliberate act by the
    // caller (invoking an interpreter), never an accidental one.
    await writeFile(destination, content, { encoding: 'utf8', mode: 0o600 })
    staged.set(filePath, destination)
  }

  return staged
}
