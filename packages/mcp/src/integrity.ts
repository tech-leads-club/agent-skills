import { createHash } from 'node:crypto'

/**
 * Computes the registry contentHash for an in-memory skill file set.
 * Must match packages/skills-catalog/src/utils.ts computeSkillHash (sorted path + bytes).
 */
export function computeContentHash(files: ReadonlyMap<string, string | Uint8Array>): string {
  const hash = createHash('sha256')
  const sortedPaths = [...files.keys()].sort()

  for (const filePath of sortedPaths) {
    const content = files.get(filePath)
    if (content === undefined) continue
    hash.update(filePath)
    hash.update(content)
  }

  return hash.digest('hex')
}

/** Decodes verified skill bytes for text-only responses. Binary files must stay as bytes. */
export function decodeSkillText(bytes: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
}

/**
 * Downloads every file listed for a skill and verifies the aggregate contentHash.
 * Returns the verified file map on success, as the original bytes.
 */
export async function fetchAndVerifySkillFiles(
  skill: { name: string; path: string; files: string[]; contentHash: string },
  skillsBaseUrl: string,
  fetchBytes: (url: string) => Promise<Uint8Array>,
): Promise<Map<string, Uint8Array>> {
  const contents = new Map<string, Uint8Array>()

  const results = await Promise.allSettled(
    skill.files.map(async (filePath) => {
      const url = `${skillsBaseUrl}${skill.path}/${filePath}`
      const bytes = await fetchBytes(url)
      return { filePath, bytes }
    }),
  )

  const failures: string[] = []
  for (const [index, result] of results.entries()) {
    if (result.status === 'fulfilled') {
      contents.set(result.value.filePath, result.value.bytes)
    } else {
      failures.push(skill.files[index])
    }
  }

  if (failures.length > 0) {
    throw new Error(`Failed to download skill files for '${skill.name}': ${failures.join(', ')}`)
  }

  const computed = computeContentHash(contents)
  if (computed !== skill.contentHash) {
    throw new Error(
      `Checksum mismatch for skill '${skill.name}': expected ${skill.contentHash}, got ${computed}. ` +
        'The CDN content may have been tampered with or is out of sync with the registry.',
    )
  }

  return contents
}
