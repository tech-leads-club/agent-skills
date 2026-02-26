import { type FastMCP, UserError } from 'fastmcp'
import ky from 'ky'
import { z } from 'zod'

import { Indexes } from '../types'
import { fetchReferenceFileContents, getInvalidReferencePaths } from './core/fetcher'

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

      return fetchReferenceFileContents(skill, args.file_paths, (url) => ky.get(url).text())
    },
  })
}
