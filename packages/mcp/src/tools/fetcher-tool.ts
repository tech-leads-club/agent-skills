import { type FastMCP, UserError } from 'fastmcp'
import ky from 'ky'
import { z } from 'zod'

import { buildSkillsBaseUrl, resolveCdnRef } from '../cdn'
import { fetchAndVerifySkillFiles } from '../integrity'
import { Indexes } from '../types'
import { getInvalidReferencePaths } from './core/fetcher'

const TOOL_DESCRIPTION = `Step 3 of 3 (optional). Fetch reference files that a skill's instructions told you to load.
Input: skill_name + up to 5 file_paths from the reference list returned by read_skill.
Returns: The content of each requested file, separated by --- delimiters.
Constraints: Only paths from read_skill's reference list are valid — never guess or construct paths. Make multiple calls if you need more than 5 files.`

export function registerFetcherTool(server: FastMCP, getIndexes: () => Indexes): void {
  server.addTool({
    name: 'fetch_skill_files',
    description: TOOL_DESCRIPTION,
    parameters: z.object({ skill_name: z.string(), file_paths: z.array(z.string()).min(1).max(5) }),
    annotations: { readOnlyHint: true, openWorldHint: true },
    execute: async (args) => {
      const skill = getIndexes().map.get(args.skill_name)
      if (!skill) throw new UserError(`Skill '${args.skill_name}' not found.`)

      const invalidPaths = getInvalidReferencePaths(skill, args.file_paths)

      if (invalidPaths.length > 0) {
        throw new UserError(
          `Invalid paths: [${invalidPaths.join(', ')}]. Only paths from read_skill are valid references.`,
        )
      }

      try {
        const cdnRef = await resolveCdnRef()
        const skillsBaseUrl = buildSkillsBaseUrl(cdnRef)
        // why: verify the whole skill set before returning any reference bytes
        const verified = await fetchAndVerifySkillFiles(skill, skillsBaseUrl, (url) => ky.get(url).text())

        const parts: string[] = []
        const missing: string[] = []
        for (const filePath of args.file_paths) {
          const content = verified.get(filePath)
          if (content === undefined) {
            missing.push(filePath)
            continue
          }
          parts.push(`## ${filePath}\n\n${content}`)
        }

        const output = parts.join('\n\n---\n\n')
        if (missing.length === 0) return output
        const failureNote = `Failed to fetch: ${missing.join(', ')}`
        return output.length > 0 ? `${output}\n\n---\n\n${failureNote}` : failureNote
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (message.includes('Checksum mismatch')) {
          throw new UserError(message)
        }
        throw new UserError('CDN unavailable or skill integrity check failed. Try again shortly.')
      }
    },
  })
}
