import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join, resolve, sep } from 'node:path'

import { STAGING_DIR_NAME, STAGING_REVISION_LENGTH } from './constants'

/** Root directory for staged skill files. Overridable for tests and sandboxed environments. */
export function getStagingRoot(): string {
  const override = process.env.SKILLS_STAGING_DIR?.trim()
  if (override) return resolve(override)
  return join(homedir(), '.cache', STAGING_DIR_NAME)
}

/**
 * Returns the staging directory for one revision of a skill.
 *
 * why: keying the directory on contentHash makes staging additive rather than overwriting —
 * a different revision is a different directory, so re-staging never replaces bytes that a
 * previous call produced. That is what lets the tool honestly declare destructiveHint: false,
 * whose documented meaning is "additive, not destructive".
 */
export function getSkillStagingDir(skillName: string, contentHash: string): string {
  return join(getStagingRoot(), skillName, contentHash.slice(0, STAGING_REVISION_LENGTH))
}

export type StagedFile = { path: string; written: boolean }

/**
 * Writes verified skill files under the skill's revision directory.
 *
 * A file already present with identical bytes is left untouched and reported as written: false,
 * so repeating the call is a real no-op and idempotentHint: true holds.
 *
 * hazard: every destination is re-checked against the revision directory after path resolution.
 * isSafeStagingPath already rejects traversal in the registry-supplied path; this is the second
 * gate — a write that would land outside the directory throws instead.
 */
export async function stageSkillFiles(
  skillName: string,
  contentHash: string,
  files: ReadonlyMap<string, string>,
): Promise<Map<string, StagedFile>> {
  const skillDir = getSkillStagingDir(skillName, contentHash)
  const staged = new Map<string, StagedFile>()

  for (const [filePath, content] of files) {
    const destination = resolve(skillDir, filePath)
    if (destination !== skillDir && !destination.startsWith(skillDir + sep)) {
      throw new Error(`Refusing to stage '${filePath}': resolves outside the skill directory.`)
    }

    if (await hasIdenticalContent(destination, content)) {
      staged.set(filePath, { path: destination, written: false })
      continue
    }

    await mkdir(dirname(destination), { recursive: true })
    // hazard: this is remotely-sourced code landing on the user's filesystem. Writing it
    // owner-only and without the execute bit means running it takes a deliberate act by the
    // caller (invoking an interpreter), never an accidental one.
    await writeFile(destination, content, { encoding: 'utf8', mode: 0o600 })
    staged.set(filePath, { path: destination, written: true })
  }

  return staged
}

async function hasIdenticalContent(destination: string, content: string): Promise<boolean> {
  try {
    return (await readFile(destination, 'utf8')) === content
  } catch {
    return false
  }
}
