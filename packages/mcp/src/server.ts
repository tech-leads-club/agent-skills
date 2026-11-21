import { McpServer } from '@modelcontextprotocol/server'

import type { Catalog } from './catalog'
import { CACHE_TTL_MS } from './constants'
import { registerPrompts } from './prompts'
import { registerResources } from './resources'
import { registerFetcherTool } from './tools/fetcher-tool'
import { registerListTool } from './tools/list-tool'
import { registerPrepareTool } from './tools/prepare-tool'
import { registerSearchTool } from './tools/search-tool'
import { registerSkillTool } from './tools/skill-tool'

export const SERVER_INSTRUCTIONS = [
  'Catalog of agent skills: packaged instructions, references and scripts for specific tasks.',
  '1. Before a task, call search_skills with an English intent phrase.',
  '2. Call read_skill with the best match and follow its instructions.',
  '3. For files the instructions tell you to read, call fetch_skill_files. For files they tell you to run, call prepare_skill_files.',
  'Call list_skills only when the user asks to see every skill.',
].join('\n')

const PUBLIC_CACHE_HINT = { ttlMs: CACHE_TTL_MS, cacheScope: 'public' } as const

export function createServer(deps: { catalog: Catalog; version: string }): McpServer {
  const server = new McpServer(
    { name: 'agent-skills-mcp', version: deps.version },
    {
      instructions: SERVER_INSTRUCTIONS,
      cacheHints: {
        'server/discover': PUBLIC_CACHE_HINT,
        'tools/list': PUBLIC_CACHE_HINT,
        'prompts/list': PUBLIC_CACHE_HINT,
        'resources/list': PUBLIC_CACHE_HINT,
        'resources/read': PUBLIC_CACHE_HINT,
      },
    },
  )

  registerSearchTool(server, deps.catalog)
  registerListTool(server, deps.catalog)
  registerSkillTool(server, deps.catalog)
  registerFetcherTool(server, deps.catalog)
  registerPrepareTool(server, deps.catalog)
  registerPrompts(server, deps.catalog)
  registerResources(server, deps.catalog)

  return server
}
