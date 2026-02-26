import { type FastMCP } from 'fastmcp'
import { z } from 'zod'

import type { Indexes } from '../types'
import { buildListSkillsResponse } from './core/list'

const TOOL_DESCRIPTION =
  'Browse all available skills grouped by category.\n' +
  'When: User explicitly asks to see/browse/list all skills (e.g. "what skills are available?", "show me all skills").\n' +
  'Do NOT call proactively during normal task resolution — use search_skills instead.'

export const ListSkillsParamsSchema = z.object({
  explicit_request: z.literal(true),
  description_max_chars: z.number().int().min(40).max(240).default(120),
})

export function registerListTool(server: FastMCP, getIndexes: () => Indexes): void {
  server.addTool({
    name: 'list_skills',
    description: TOOL_DESCRIPTION,
    parameters: ListSkillsParamsSchema,
    annotations: { readOnlyHint: true, openWorldHint: false },
    execute: async (args) => {
      const output = buildListSkillsResponse(getIndexes().map.values(), args.description_max_chars)
      return JSON.stringify(output)
    },
  })
}
