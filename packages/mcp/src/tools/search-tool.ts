import type { FastMCP } from 'fastmcp'
import { z } from 'zod'

import type { Indexes } from '../types'
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

export function registerSearchTool(server: FastMCP, getIndexes: () => Indexes): void {
  server.addTool({
    name: 'search_skills',
    description: TOOL_DESCRIPTION,
    parameters: z.object({ query: z.string().min(1) }),
    // why: declaring outputSchema makes the server emit MCP structuredContent (spec 2025-06-18+)
    // alongside the JSON text fallback, so clients get a validated contract instead of a blob.
    outputSchema: SearchSkillsOutputSchema,
    annotations: { title: 'Find Skills by Intent', readOnlyHint: true, openWorldHint: false },
    execute: async (args) => {
      const { fuse } = getIndexes()
      const results = fuse.search(args.query).slice(0, 5)
      return buildSearchSkillsResponse(results)
    },
  })
}
