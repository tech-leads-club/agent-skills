import type { McpServer } from '@modelcontextprotocol/server'
import { z } from 'zod'

import type { Catalog } from '../catalog'
import { buildListSkillsResponse } from './core/list'

const TOOL_DESCRIPTION =
  'Browse the whole catalog, grouped by category.\n' +
  'Only when the user explicitly asks to see every skill. To resolve a task, use search_skills.'

export const ListSkillsParamsSchema = z.strictObject({
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

export function registerListTool(server: McpServer, catalog: Catalog): void {
  server.registerTool(
    'list_skills',
    {
      description: TOOL_DESCRIPTION,
      inputSchema: ListSkillsParamsSchema,
      outputSchema: ListSkillsOutputSchema,
      annotations: { title: 'Browse Skill Catalog', readOnlyHint: true, openWorldHint: false },
    },
    async ({ description_max_chars }) => {
      const payload = buildListSkillsResponse(await catalog.list(), description_max_chars)
      return { content: [{ type: 'text', text: JSON.stringify(payload) }], structuredContent: payload }
    },
  )
}
