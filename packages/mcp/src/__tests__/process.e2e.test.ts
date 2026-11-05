import {
  LEGACY_PROTOCOL,
  MODERN_PROTOCOL,
  type SpawnedServer,
  initializeLegacy,
  offlineEnv,
  spawnServer,
} from './support/mcp-client'

const running: SpawnedServer[] = []

function start(era: 'legacy' | 'modern', env = offlineEnv()): SpawnedServer {
  const server = spawnServer(era, env)
  running.push(server)
  return server
}

afterEach(async () => {
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
})
