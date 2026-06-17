import { join } from 'node:path'

import type { CorePorts } from '../ports'
import type { AgentType, McpServerConflict, McpServerEntry } from '../types'

import { findProjectRoot } from './project-root.service'

interface McpConfigLocation {
  agent: AgentType
  localPaths: string[]
  globalPaths: (home: string) => string[]
  extract: (data: unknown) => Record<string, McpServerRaw>
}

interface McpServerRaw {
  command?: string
  args?: string[]
  env?: Record<string, string>
}

function extractMcpServers(data: unknown): Record<string, McpServerRaw> {
  if (!data || typeof data !== 'object') return {}
  const obj = data as Record<string, unknown>
  const servers = obj['mcpServers']
  if (servers && typeof servers === 'object') {
    return servers as Record<string, McpServerRaw>
  }
  return {}
}

function extractTopLevel(data: unknown): Record<string, McpServerRaw> {
  if (!data || typeof data !== 'object') return {}
  const obj = data as Record<string, unknown>
  const servers = obj['mcpServers']
  if (servers && typeof servers === 'object') {
    return servers as Record<string, McpServerRaw>
  }
  const result: Record<string, McpServerRaw> = {}
  for (const [key, val] of Object.entries(obj)) {
    if (val && typeof val === 'object' && 'command' in val) {
      result[key] = val as McpServerRaw
    }
  }
  return result
}

const MCP_CONFIG_LOCATIONS: McpConfigLocation[] = [
  {
    agent: 'claude-code',
    localPaths: ['.claude/settings.json', '.claude/settings.local.json'],
    globalPaths: (home) => [join(home, '.claude/settings.json'), join(home, '.claude/settings.local.json')],
    extract: extractMcpServers,
  },
  {
    agent: 'cursor',
    localPaths: ['.cursor/mcp.json'],
    globalPaths: (home) => [join(home, '.cursor/mcp.json')],
    extract: extractTopLevel,
  },
  {
    agent: 'windsurf',
    localPaths: ['.windsurf/mcp.json'],
    globalPaths: (home) => [join(home, '.codeium/windsurf/mcp.json')],
    extract: extractTopLevel,
  },
  {
    agent: 'cline',
    localPaths: ['.cline/mcp.json'],
    globalPaths: (home) => [join(home, '.cline/mcp.json')],
    extract: extractTopLevel,
  },
  {
    agent: 'roo',
    localPaths: ['.roo/mcp.json'],
    globalPaths: (home) => [join(home, '.roo/mcp.json')],
    extract: extractTopLevel,
  },
  {
    agent: 'kiro',
    localPaths: ['.kiro/mcp.json'],
    globalPaths: (home) => [join(home, '.kiro/mcp.json')],
    extract: extractTopLevel,
  },
]

interface DetectOptions {
  includeGlobal: boolean
}

interface DetectResult {
  servers: McpServerEntry[]
  conflicts: McpServerConflict[]
}

async function readJsonFile(ports: CorePorts, filePath: string): Promise<unknown | null> {
  try {
    const content = await ports.fs.readFile(filePath, 'utf-8')
    return JSON.parse(content) as unknown
  } catch {
    return null
  }
}

export async function detectMcpServers(ports: CorePorts, options: DetectOptions): Promise<DetectResult> {
  const projectRoot = findProjectRoot(ports)
  const home = ports.env.homedir()
  const servers: McpServerEntry[] = []

  for (const config of MCP_CONFIG_LOCATIONS) {
    const localPaths = config.localPaths.map((p) => ({
      filePath: join(projectRoot, p),
      location: 'local' as const,
    }))

    const globalPaths = options.includeGlobal
      ? config.globalPaths(home).map((filePath) => ({
          filePath,
          location: 'global' as const,
        }))
      : []

    for (const { filePath, location } of [...localPaths, ...globalPaths]) {
      const data = await readJsonFile(ports, filePath)
      if (!data) continue

      const mcpServers = config.extract(data)
      for (const [name, server] of Object.entries(mcpServers)) {
        if (!server.command) continue

        servers.push({
          name,
          agent: config.agent,
          command: server.command,
          args: server.args,
          env: server.env,
          sourceFile: filePath,
          location,
        })
      }
    }
  }

  const conflicts = detectConflicts(servers)
  return { servers, conflicts }
}

function detectConflicts(servers: McpServerEntry[]): McpServerConflict[] {
  const byName = new Map<string, McpServerEntry[]>()

  for (const server of servers) {
    const existing = byName.get(server.name) ?? []
    existing.push(server)
    byName.set(server.name, existing)
  }

  const conflicts: McpServerConflict[] = []

  for (const [serverName, entries] of byName) {
    if (entries.length < 2) continue

    const hasConflict = entries.some((a, i) =>
      entries.some(
        (b, j) => i < j && (a.command !== b.command || JSON.stringify(a.args) !== JSON.stringify(b.args)),
      ),
    )

    if (hasConflict) {
      conflicts.push({ serverName, entries })
    }
  }

  return conflicts
}
