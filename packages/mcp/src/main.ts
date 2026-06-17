#!/usr/bin/env node
import { FastMCP } from 'fastmcp'
import { createRequire } from 'node:module'

import { CACHE_TTL_MS } from './constants'
import { registerPrompts } from './prompts'
import { buildIndexes, getRegistry } from './registry'
import { registerResources } from './resources'
import { registerFetcherTool } from './tools/fetcher-tool'
import { registerListTool } from './tools/list-tool'
import { registerSearchTool } from './tools/search-tool'
import { registerSkillTool } from './tools/skill-tool'
import type { Indexes } from './types'

// Read version at runtime
const _require = createRequire(import.meta.url)
const { version = '0.0.0' } = _require('./package.json') as { version?: string }

// MCP server instance
const server = new FastMCP({ name: 'agent-skills-mcp', version: version as `${number}.${number}.${number}` })

// Initialized during warmup in main() before server.start() — always set when tools are called
let indexes!: Indexes

async function main(): Promise<void> {
  process.stderr.write('[agent-skills-mcp] starting\n')

  // Warm up: fetch registry and build initial indexes (throws if CDN unavailable — server won't start)
  indexes = buildIndexes(await getRegistry())
  process.stderr.write('[agent-skills-mcp] registry loaded, indexes built\n')

  // Register all MCP primitives
  registerSearchTool(server, getIndexes)
  registerListTool(server, getIndexes)
  registerSkillTool(server, getIndexes)
  registerFetcherTool(server, getIndexes)
  registerResources(server, getRegistry)
  registerPrompts(server, getIndexes)

  // Background refresh: keep indexes in sync with registry TTL
  setInterval(() => {
    getRegistry()
      .then((reg) => {
        indexes = buildIndexes(reg)
        process.stderr.write('[agent-skills-mcp] indexes refreshed\n')
      })
      .catch((err: unknown) => {
        process.stderr.write(`[agent-skills-mcp] index refresh failed: ${String(err)}\n`)
      })
  }, CACHE_TTL_MS).unref()

  await server.start({ transportType: 'stdio' })
}

main().catch((err: unknown) => {
  process.stderr.write(`[agent-skills-mcp] fatal: ${String(err)}\n`)
  process.exit(1)
})

function getIndexes(): Indexes {
  return indexes
}
