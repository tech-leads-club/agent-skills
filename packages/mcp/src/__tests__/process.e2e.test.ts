import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  BUILT_MAIN,
  LEGACY_PROTOCOL,
  MODERN_PROTOCOL,
  type SpawnedServer,
  findWorkspaceRoot,
  initializeLegacy,
  offlineEnv,
  spawnServer,
} from './support/mcp-client'
import { type TestProxy, startTestProxy } from './support/test-proxy'

const running: SpawnedServer[] = []

function start(era: 'legacy' | 'modern', env = offlineEnv(), mainPath = BUILT_MAIN): SpawnedServer {
  const server = spawnServer(era, env, mainPath)
  running.push(server)
  return server
}

const proxies: TestProxy[] = []
const tempDirs: string[] = []

async function proxy(mode: 'refuse' | 'hang'): Promise<TestProxy> {
  const started = await startTestProxy(mode)
  proxies.push(started)
  return started
}

function proxiedEnv(url: string): NodeJS.ProcessEnv {
  return offlineEnv({ HTTPS_PROXY: url, HTTP_PROXY: url })
}

function networkEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env }
  delete env.SKILLS_CDN_REF
  return env
}

type ToolResult = { content: Array<{ text?: string }>; isError?: boolean }

function rssMiB(pid: number): number {
  const kib = Number(execFileSync('ps', ['-o', 'rss=', '-p', String(pid)], { encoding: 'utf8' }).trim())
  return kib / 1024
}

afterEach(async () => {
  for (const started of proxies.splice(0)) await started.close()
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  for (const server of running.splice(0)) {
    if (server.child.exitCode === null && server.child.signalCode === null) server.child.kill('SIGKILL')
    await server.exited
  }
})

describe('built server process', () => {
  it('answers initialize at 2025-06-18', async () => {
    const server = start('legacy')

    const response = await initializeLegacy(server)

    expect(response.result?.protocolVersion).toBe(LEGACY_PROTOCOL)
  })

  it('answers server/discover with 2026-07-28', async () => {
    const server = start('modern')

    const response = await server.rpc('server/discover')

    expect(response.result?.supportedVersions).toContain(MODERN_PROTOCOL)
  })

  it('answers the handshake within 1000 ms while the CDN is unreachable', async () => {
    const legacy = start('legacy')
    const modern = start('modern')

    const legacyStarted = Date.now()
    const legacyResponse = await initializeLegacy(legacy)
    const legacyElapsed = Date.now() - legacyStarted
    const modernStarted = Date.now()
    const modernResponse = await modern.rpc('server/discover')
    const modernElapsed = Date.now() - modernStarted

    expect(legacyResponse.result).toBeDefined()
    expect(modernResponse.result).toBeDefined()
    expect(legacyElapsed).toBeLessThan(1000)
    expect(modernElapsed).toBeLessThan(1000)
  })

  it('reports the version of the package.json beside main.js', async () => {
    const dir = mkdtempSync(join(findWorkspaceRoot(), 'dist', 'mcp-version-'))
    tempDirs.push(dir)
    copyFileSync(BUILT_MAIN, join(dir, 'main.js'))
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'copy', version: '9.9.9-beside', type: 'module' }))
    const server = start('legacy', offlineEnv(), join(dir, 'main.js'))

    const response = await initializeLegacy(server)

    expect(response.result?.serverInfo).toEqual(expect.objectContaining({ version: '9.9.9-beside' }))
  })

  it('returns the catalog unavailable error when the CDN is unreachable', async () => {
    const hanging = await proxy('hang')
    const startedAt = Date.now()
    const server = start('legacy', proxiedEnv(hanging.url))
    await initializeLegacy(server)

    const response = await server.rpc('tools/call', { name: 'search_skills', arguments: { query: 'react' } })
    const answeredAfter = Date.now() - startedAt
    const result = response.result as ToolResult

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toBe('Skill catalog unavailable. Try again shortly.')
    expect(answeredAfter).toBeGreaterThanOrEqual(5_000)
    expect(answeredAfter).toBeLessThan(11_500)
  }, 20_000)

  it('returns the catalog unavailable error at once when the proxy refuses', async () => {
    const refusing = await proxy('refuse')
    const server = start('legacy', proxiedEnv(refusing.url))
    await initializeLegacy(server)

    const response = await server.rpc('tools/call', { name: 'search_skills', arguments: { query: 'react' } })
    const result = response.result as ToolResult

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toBe('Skill catalog unavailable. Try again shortly.')
  })

  it('requests the registry again on the next tool call after a failure', async () => {
    const refusing = await proxy('refuse')
    const server = start('legacy', proxiedEnv(refusing.url))
    await initializeLegacy(server)

    await server.rpc('tools/call', { name: 'search_skills', arguments: { query: 'react' } })
    const afterFirst = refusing.connects.length
    await server.rpc('tools/call', { name: 'search_skills', arguments: { query: 'react' } })

    expect(afterFirst).toBeGreaterThan(0)
    expect(refusing.connects.length).toBeGreaterThan(afterFirst)
  })

  it('sends registry requests through HTTPS_PROXY', async () => {
    const refusing = await proxy('refuse')
    const env = proxiedEnv(refusing.url)
    delete env.NODE_USE_ENV_PROXY
    const server = start('legacy', env)
    await initializeLegacy(server)

    await server.rpc('tools/call', { name: 'search_skills', arguments: { query: 'react' } })

    expect(refusing.connects).toContain('registry.npmjs.org:443')
  })

  it('returns ttlMs 900000 and cacheScope public on cacheable results', async () => {
    const server = start('modern', networkEnv())

    for (const [method, params] of [
      ['server/discover', {}],
      ['tools/list', {}],
      ['prompts/list', {}],
      ['resources/list', {}],
      ['resources/read', { uri: 'skills://catalog' }],
    ] as const) {
      const response = await server.rpc(method, params)

      expect({ method, ttlMs: response.result?.ttlMs, cacheScope: response.result?.cacheScope }).toEqual({
        method,
        ttlMs: 900_000,
        cacheScope: 'public',
      })
    }
  })

  it('exits with code 0 within 2000 ms after stdin closes', async () => {
    const hanging = await proxy('hang')
    const legacy = start('legacy')
    const modern = start('modern')
    const loading = start('legacy', proxiedEnv(hanging.url))
    await initializeLegacy(legacy)
    await modern.rpc('server/discover')
    await initializeLegacy(loading)
    await new Promise((resolve) => setTimeout(resolve, 200))

    expect(hanging.connects.length).toBeGreaterThan(0)
    for (const server of [legacy, modern, loading]) {
      const closedAt = Date.now()
      server.child.stdin.end()
      const exit = await server.exited

      expect(exit.code).toBe(0)
      expect(exit.at - closedAt).toBeLessThan(2000)
    }
  })

  it('exits within 2000 ms after SIGTERM', async () => {
    const server = start('legacy')
    await initializeLegacy(server)

    const signalledAt = Date.now()
    server.child.kill('SIGTERM')
    const exit = await server.exited

    expect(exit.signal).toBe('SIGTERM')
    expect(exit.at - signalledAt).toBeLessThan(2000)
  })

  it('stays below 125 MiB RSS after one search_skills call', async () => {
    const server = start('legacy', networkEnv())
    await initializeLegacy(server)

    const response = await server.rpc('tools/call', { name: 'search_skills', arguments: { query: 'react' } })
    const result = response.result as ToolResult

    expect(result.isError).not.toBe(true)
    expect(rssMiB(Number(server.child.pid))).toBeLessThan(125)
  })
})
