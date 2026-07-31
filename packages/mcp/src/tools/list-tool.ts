import type { FastMCP } from 'fastmcp'
import { z } from 'zod'

import type { Indexes } from '../types'
import { buildListSkillsResponse } from './core/list'

const TOOL_DESCRIPTION =
  'Browse the whole catalog, grouped by category.\n' +
  'Only when the user explicitly asks to see every skill. To resolve a task, use search_skills.'

export const ListSkillsParamsSchema = z.object({
  explicit_request: z.literal(true),
  description_max_chars: z.number().int().min(40).max(240).default(120),
})

export const ListSkillsOutputSchema = z.object({
  total_skills: z.number().int(),
  total_categories: z.number().int(),
  categories: z.array(
    z.object({
      category: z.string(),
      skills: z.array(z.object({ name: z.string(), description: z.string() })),
    }),
  ),
})

export function registerListTool(server: FastMCP, getIndexes: () => Indexes): void {
  server.addTool({
    name: 'list_skills',
    description: TOOL_DESCRIPTION,
    parameters: ListSkillsParamsSchema,
    // why: declaring outputSchema makes the server emit MCP structuredContent (spec 2025-06-18+)
    // instead of an opaque JSON string, so clients can consume the catalog without re-parsing text.
    outputSchema: ListSkillsOutputSchema,
    annotations: { title: 'Browse Skill Catalog', readOnlyHint: true, openWorldHint: false },
    execute: async (args) => buildListSkillsResponse(getIndexes().map.values(), args.description_max_chars),
  })
}
