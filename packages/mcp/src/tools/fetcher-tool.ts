import type { McpServer } from '@modelcontextprotocol/server'
import { z } from 'zod'

import type { Catalog } from '../catalog'
import { decodeSkillText } from '../integrity'
import { buildReferenceFilesOutput, getInvalidReferencePaths, selectReferenceFiles } from './core/fetcher'
import { readVerifiedSkill } from './skill-tool'

const TOOL_DESCRIPTION = `Step 3, for files the instructions tell you to READ (typically references/). Returns their text.
Input: skill_name + up to 5 paths from read_skill's list. Never invent a path.
Oversized responses are truncated and name what was left out — ask for fewer paths.
For files the instructions tell you to RUN, use prepare_skill_files instead.`

export const FetchSkillFilesOutputSchema = z.object({
  skill_name: z.string(),
  files: z.array(z.object({ path: z.string(), text: z.string(), truncated: z.boolean() })),
  omitted: z.array(z.string()),
})

export function registerFetcherTool(server: McpServer, catalog: Catalog): void {
  server.registerTool(
    'fetch_skill_files',
    {
      description: TOOL_DESCRIPTION,
      inputSchema: z.strictObject({ skill_name: z.string(), file_paths: z.array(z.string()).min(1).max(5) }),
      outputSchema: FetchSkillFilesOutputSchema,
      annotations: { title: 'Fetch Skill Reference Files', readOnlyHint: true, openWorldHint: true },
    },
    async ({ skill_name, file_paths }) => {
      const skill = await catalog.get(skill_name)
      if (!skill) throw new Error(`Skill '${skill_name}' not found. Use search_skills to find valid names.`)

      const invalidPaths = getInvalidReferencePaths(skill, file_paths)
      if (invalidPaths.length > 0) {
        throw new Error(`Invalid paths: [${invalidPaths.join(', ')}]. Only paths from read_skill are valid references.`)
      }

      const { files } = await readVerifiedSkill(catalog, skill_name)
      const asText = new Map([...files].map(([filePath, bytes]) => [filePath, decodeSkillText(bytes)]))
      const { files: selected, omitted } = selectReferenceFiles(file_paths, asText)

      return {
        content: [{ type: 'text', text: buildReferenceFilesOutput(file_paths, asText) }],
        structuredContent: { skill_name, files: selected, omitted },
      }
    },
  )
}
