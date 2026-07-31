import { type FastMCP, UserError } from 'fastmcp'
import ky from 'ky'
import { z } from 'zod'

import { buildSkillsBaseUrl, resolveCdnRef } from '../cdn'
import { fetchAndVerifySkillFiles } from '../integrity'
import type { Indexes } from '../types'
import { buildReferenceFilesOutput, getInvalidReferencePaths } from './core/fetcher'

const TOOL_DESCRIPTION = `Step 3, for files the instructions tell you to READ (typically references/). Returns their text.
Input: skill_name + up to 5 paths from read_skill's list. Never invent a path.
Oversized responses are truncated and name what was left out — ask for fewer paths.
For files the instructions tell you to RUN, use prepare_skill_files instead.`

export function registerFetcherTool(server: FastMCP, getIndexes: () => Indexes): void {
  server.addTool({
    name: 'fetch_skill_files',
    description: TOOL_DESCRIPTION,
    parameters: z.object({ skill_name: z.string(), file_paths: z.array(z.string()).min(1).max(5) }),
    annotations: { title: 'Fetch Skill Reference Files', readOnlyHint: true, openWorldHint: true },
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

        return buildReferenceFilesOutput(args.file_paths, verified)
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
