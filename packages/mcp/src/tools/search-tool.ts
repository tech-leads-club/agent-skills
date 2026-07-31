import type { FastMCP } from 'fastmcp'
import { z } from 'zod'

import type { Indexes } from '../types'
import { buildSearchSkillsResponse } from './core/search'

const TOOL_DESCRIPTION = `Step 1 of 3. ALWAYS call this first — before answering — whenever the user asks for help with a task, to check if a specialized skill applies. Discovers skills by intent.
Input: A concise intent phrase in English (translate the user's request to English keywords if needed — the catalog is indexed in English), e.g. "react component testing" or "aws lambda deployment".
Returns: Up to 5 skills ranked by relevance (name, usage_hint, category, score 0-100, match_quality). usage_hint is a short summary; full instructions come from read_skill.
Then: Pick the best match and call read_skill with its name.`

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
