import { type FastMCP } from 'fastmcp'
import { z } from 'zod'

import type { Indexes } from '../types'
import { buildSearchSkillsResponse } from './core/search'

const TOOL_DESCRIPTION = `Step 1 of 3. Discovers skills by intent when the user describes a task without naming a specific skill.
Input: A concise intent phrase, e.g. "react component testing" or "aws lambda deployment".
Returns: Up to 5 skills ranked by relevance (name, description, category, score 0-100, match_quality).
Then: Pick the best match and call read_skill with its name.
Tips: Multi-word = AND. Use | for OR. Use = for exact match.`

export function registerSearchTool(server: FastMCP, getIndexes: () => Indexes): void {
  server.addTool({
    name: 'search_skills',
    description: TOOL_DESCRIPTION,
    parameters: z.object({ query: z.string().min(1) }),
    annotations: { readOnlyHint: true, openWorldHint: false },
    execute: async (args) => {
      const { fuse } = getIndexes()
      const results = fuse.search(args.query).slice(0, 5)
      return JSON.stringify(buildSearchSkillsResponse(results))
    },
  })
}
