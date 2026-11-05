import type { McpServer } from '@modelcontextprotocol/server'
import { z } from 'zod'

import type { Catalog } from '../catalog'
import { buildSearchSkillsResponse } from './core/search'

const TOOL_DESCRIPTION = `Step 1 of 3. Call before answering any task request, to check whether a skill applies.
Input: an intent phrase in English — the index is English, so translate if needed. E.g. "react component testing".
Returns: up to 5 matches with usage_hint and score; empty when no skill fits.
Then: call read_skill with the best name.`

export const SearchSkillsOutputSchema = z.object({
  results: z.array(
    z.object({
      name: z.string(),
      category: z.string(),
      usage_hint: z.string(),
      score: z.number(),
      match_quality: z.enum(['exact', 'strong', 'partial', 'weak']),
    }),
  ),
  message: z.string().optional(),
})

export function registerSearchTool(server: McpServer, catalog: Catalog): void {
  server.registerTool(
    'search_skills',
    {
      description: TOOL_DESCRIPTION,
      inputSchema: z.strictObject({ query: z.string().min(1) }),
      outputSchema: SearchSkillsOutputSchema,
      annotations: { title: 'Find Skills by Intent', readOnlyHint: true, openWorldHint: false },
    },
    async ({ query }) => {
      const payload = buildSearchSkillsResponse(await catalog.search(query, 5))
      return { content: [{ type: 'text', text: JSON.stringify(payload) }], structuredContent: payload }
    },
  )
}
