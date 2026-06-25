import { describe, expect, it, jest } from '@jest/globals'

import type { CorePorts, EnvPort, FileSystemPort, HttpPort, LoggerPort, PackageResolverPort, PathsPort, ShellPort } from '../../ports'

import { detectMcpServers } from '../mcp-detector.service'

const createPorts = (fileMap: Record<string, string> = {}): CorePorts => {
  const existingPaths = new Set(Object.keys(fileMap))
  // Also add parent dirs to existingPaths for project root detection
  existingPaths.add('/workspace/package.json')

  const fs = {
    existsSync: jest.fn((p: string) => existingPaths.has(p)),
    readFile: jest.fn(async (p: string) => {
      if (fileMap[p] !== undefined) return fileMap[p]
      throw new Error('not found')
    }),
  } as unknown as FileSystemPort

  const env = {
    cwd: jest.fn(() => '/workspace'),
    homedir: jest.fn(() => '/home/tester'),
    platform: jest.fn(() => 'linux'),
    getEnv: jest.fn(() => undefined),
  } as unknown as EnvPort

  return {
    fs,
    env,
    http: {} as HttpPort,
    logger: {} as LoggerPort,
    packageResolver: {} as PackageResolverPort,
    paths: {} as PathsPort,
    shell: {} as ShellPort,
  }
}

describe('detectMcpServers', () => {
  it('returns empty results when no config files exist', async () => {
    const ports = createPorts({})

    const result = await detectMcpServers(ports, { includeGlobal: false })

    expect(result.servers).toEqual([])
    expect(result.conflicts).toEqual([])
  })

  it('parses Claude Code settings.json with mcpServers', async () => {
    const settings = JSON.stringify({
      mcpServers: {
        'my-server': {
          command: 'npx',
          args: ['-y', 'my-mcp-server'],
        },
      },
    })

    const ports = createPorts({
      '/workspace/.claude/settings.json': settings,
    })

    const result = await detectMcpServers(ports, { includeGlobal: false })

    expect(result.servers).toHaveLength(1)
    expect(result.servers[0].name).toBe('my-server')
    expect(result.servers[0].agent).toBe('claude-code')
    expect(result.servers[0].command).toBe('npx')
    expect(result.servers[0].args).toEqual(['-y', 'my-mcp-server'])
    expect(result.servers[0].location).toBe('local')
  })

  it('parses Cursor mcp.json', async () => {
    const mcpConfig = JSON.stringify({
      mcpServers: {
        'cursor-server': {
          command: 'node',
          args: ['server.js'],
        },
      },
    })

    const ports = createPorts({
      '/workspace/.cursor/mcp.json': mcpConfig,
    })

    const result = await detectMcpServers(ports, { includeGlobal: false })

    expect(result.servers).toHaveLength(1)
    expect(result.servers[0].name).toBe('cursor-server')
    expect(result.servers[0].agent).toBe('cursor')
  })

  it('detects conflicts when same server has different commands', async () => {
    const claudeConfig = JSON.stringify({
      mcpServers: {
        'shared-server': { command: 'npx', args: ['v1'] },
      },
    })
    const cursorConfig = JSON.stringify({
      mcpServers: {
        'shared-server': { command: 'node', args: ['v2'] },
      },
    })

    const ports = createPorts({
      '/workspace/.claude/settings.json': claudeConfig,
      '/workspace/.cursor/mcp.json': cursorConfig,
    })

    const result = await detectMcpServers(ports, { includeGlobal: false })

    expect(result.servers).toHaveLength(2)
    expect(result.conflicts).toHaveLength(1)
    expect(result.conflicts[0].serverName).toBe('shared-server')
    expect(result.conflicts[0].entries).toHaveLength(2)
  })

  it('does not flag conflicts when same server has identical config', async () => {
    const claudeConfig = JSON.stringify({
      mcpServers: {
        'shared-server': { command: 'npx', args: ['same'] },
      },
    })
    const cursorConfig = JSON.stringify({
      mcpServers: {
        'shared-server': { command: 'npx', args: ['same'] },
      },
    })

    const ports = createPorts({
      '/workspace/.claude/settings.json': claudeConfig,
      '/workspace/.cursor/mcp.json': cursorConfig,
    })

    const result = await detectMcpServers(ports, { includeGlobal: false })

    expect(result.servers).toHaveLength(2)
    expect(result.conflicts).toHaveLength(0)
  })

  it('includes global configs when includeGlobal is true', async () => {
    const globalConfig = JSON.stringify({
      mcpServers: {
        'global-server': { command: 'npx', args: ['global'] },
      },
    })

    const ports = createPorts({
      '/home/tester/.claude/settings.json': globalConfig,
    })

    const result = await detectMcpServers(ports, { includeGlobal: true })

    expect(result.servers).toHaveLength(1)
    expect(result.servers[0].location).toBe('global')
  })

  it('skips entries without a command', async () => {
    const config = JSON.stringify({
      mcpServers: {
        'no-command': { args: ['test'] },
        'has-command': { command: 'npx', args: ['test'] },
      },
    })

    const ports = createPorts({
      '/workspace/.claude/settings.json': config,
    })

    const result = await detectMcpServers(ports, { includeGlobal: false })

    expect(result.servers).toHaveLength(1)
    expect(result.servers[0].name).toBe('has-command')
  })
})
