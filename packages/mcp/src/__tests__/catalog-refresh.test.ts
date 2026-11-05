import { jest } from '@jest/globals'

import { type CatalogDeps, createCatalog } from '../catalog'
import { createRegistry } from '../tools/__tests__/helpers'
import type { Registry } from '../types'

const LATEST_URL = 'https://registry.npmjs.org/@tech-leads-club/skills-catalog/latest'
const registryUrl = (version: string) =>
  `https://cdn.jsdelivr.net/npm/@tech-leads-club/skills-catalog@${version}/skills-registry.json`

const registries: Record<string, Registry> = {
  '1.0.0': createRegistry([{ name: 'alpha-skill', description: 'Alpha skill for tests.', path: '(a)/alpha-skill' }]),
  '1.1.0': createRegistry([
    { name: 'alpha-skill', description: 'Alpha skill for tests.', path: '(a)/alpha-skill' },
    { name: 'beta-skill', description: 'Beta skill for tests.', path: '(a)/beta-skill' },
  ]),
}

type Call = { url: string; ifNoneMatch: string | null }

function stubNetwork(distTags: Array<string | Error>) {
  const calls: Call[] = []
  let tagIndex = 0
  const fetchStub = jest.fn<typeof fetch>(async (input, init) => {
    const request = input instanceof Request ? input : new Request(String(input), init)
    const headers = new Headers(init?.headers ?? request.headers)
    calls.push({ url: request.url, ifNoneMatch: headers.get('if-none-match') })

    if (request.url === LATEST_URL) {
      const next = distTags[Math.min(tagIndex++, distTags.length - 1)]
      if (next instanceof Error) throw next
      return Response.json({ name: '@tech-leads-club/skills-catalog', version: next })
    }

    const version = Object.keys(registries).find((candidate) => request.url === registryUrl(candidate))
    if (!version) return new Response('not found', { status: 404 })
    const etag = `"etag-${version}"`
    if (headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers: { etag } })
    return Response.json(registries[version], { headers: { etag } })
  })
  return { calls, fetchStub }
}

const flush = () => new Promise((resolve) => setImmediate(resolve))

describe('catalog version refresh', () => {
  const originalFetch = globalThis.fetch
  let now: number

  beforeEach(() => {
    now = 1_000
    delete process.env.SKILLS_CDN_REF
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    delete process.env.SKILLS_CDN_REF
  })

  function catalogWith(network: ReturnType<typeof stubNetwork>, extra: Partial<CatalogDeps> = {}) {
    globalThis.fetch = network.fetchStub
    return createCatalog({ ttlMs: 100, now: () => now, ...extra })
  }

  async function namesAfterRefresh(catalog: ReturnType<typeof createCatalog>): Promise<string[]> {
    await catalog.list()
    now += 101
    await catalog.list()
    await flush()
    await flush()
    return (await catalog.list()).map((skill) => skill.name)
  }

  it('serves the registry of a newer dist-tag after the TTL', async () => {
    const network = stubNetwork(['1.0.0', '1.1.0'])
    const catalog = catalogWith(network)

    const names = await namesAfterRefresh(catalog)

    expect(names).toEqual(['alpha-skill', 'beta-skill'])
    expect(network.calls.map((call) => call.url)).toContain(registryUrl('1.1.0'))
  })

  it('reads a skill from the version of the registry that listed it', async () => {
    const network = stubNetwork(['1.0.0', '1.1.0'])
    const verifyFiles = jest
      .fn<CatalogDeps['verifyFiles']>()
      .mockResolvedValue(new Map([['SKILL.md', new Uint8Array([1])]]))
    const catalog = catalogWith(network, { verifyFiles })

    const listedByOld = await catalog.get('alpha-skill')
    now += 101
    await catalog.list()
    await flush()
    await flush()
    const listedByNew = await catalog.get('alpha-skill')
    await catalog.read(listedByOld!)
    await catalog.read(listedByNew!)

    expect(listedByNew).not.toBe(listedByOld)
    expect(verifyFiles.mock.calls.map(([, baseUrl]) => baseUrl)).toEqual([
      'https://cdn.jsdelivr.net/npm/@tech-leads-club/skills-catalog@1.0.0/skills/',
      'https://cdn.jsdelivr.net/npm/@tech-leads-club/skills-catalog@1.1.0/skills/',
    ])
  })

  it('uses SKILLS_CDN_REF without asking the npm dist-tags', async () => {
    process.env.SKILLS_CDN_REF = '1.0.0'
    const network = stubNetwork(['1.1.0'])
    const catalog = catalogWith(network)

    const names = await namesAfterRefresh(catalog)

    expect(names).toEqual(['alpha-skill'])
    expect(network.calls.map((call) => call.url)).not.toContain(LATEST_URL)
  })

  it('keeps the current registry when the dist-tag lookup fails', async () => {
    const network = stubNetwork(['1.0.0', new TypeError('fetch failed')])
    const catalog = catalogWith(network)

    const names = await namesAfterRefresh(catalog)

    expect(names).toEqual(['alpha-skill'])
    expect(network.calls.filter((call) => call.url === LATEST_URL).length).toBeGreaterThanOrEqual(2)
  })

  it('revalidates with If-None-Match while the dist-tag is unchanged', async () => {
    const network = stubNetwork(['1.0.0', '1.0.0'])
    const catalog = catalogWith(network)

    await namesAfterRefresh(catalog)
    const registryCalls = network.calls.filter((call) => call.url === registryUrl('1.0.0'))

    expect(registryCalls.map((call) => call.ifNoneMatch)).toEqual([null, '"etag-1.0.0"'])
  })
})
