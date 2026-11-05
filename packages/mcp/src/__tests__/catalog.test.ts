import { jest } from '@jest/globals'

import { CATALOG_LOAD_TIMEOUT_MS, type CatalogDeps, CatalogUnavailableError, createCatalog } from '../catalog'
import type { RegistrySnapshot } from '../registry'
import { createRegistry } from '../tools/__tests__/helpers'

const registryA = createRegistry([{ name: 'alpha-skill', description: 'Alpha skill for tests.' }])
const registryB = createRegistry([
  { name: 'alpha-skill', description: 'Alpha skill for tests.' },
  { name: 'beta-skill', description: 'Beta skill for tests.' },
])

const never = <T>(): Promise<T> => new Promise<T>(() => undefined)

describe('createCatalog', () => {
  it('uses a 10000 ms load timeout by default', () => {
    expect(CATALOG_LOAD_TIMEOUT_MS).toBe(10_000)
  })

  it('fails with CatalogUnavailableError when the registry does not load within the timeout', async () => {
    const catalog = createCatalog({ loadRegistry: () => never<RegistrySnapshot>(), timeoutMs: 30 })

    const result = catalog.list()

    await expect(result).rejects.toBeInstanceOf(CatalogUnavailableError)
    await expect(result).rejects.toThrow('Skill catalog unavailable. Try again shortly.')
  })

  it('fails with CatalogUnavailableError when the registry load rejects', async () => {
    const catalog = createCatalog({ loadRegistry: () => Promise.reject(new Error('ECONNREFUSED')) })

    await expect(catalog.get('alpha-skill')).rejects.toBeInstanceOf(CatalogUnavailableError)
  })

  it('requests the registry again on the next call after a failed load', async () => {
    const loadRegistry = jest
      .fn<CatalogDeps['loadRegistry']>()
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValueOnce({ data: registryA, version: '1.0.0' })
    const catalog = createCatalog({ loadRegistry })

    await expect(catalog.list()).rejects.toBeInstanceOf(CatalogUnavailableError)
    const skills = await catalog.list()

    expect(loadRegistry).toHaveBeenCalledTimes(2)
    expect(skills.map((skill) => skill.name)).toEqual(['alpha-skill'])
  })

  it('lets a call join the load that warm started', async () => {
    const loadRegistry = jest.fn<CatalogDeps['loadRegistry']>().mockResolvedValue({ data: registryA, version: '1.0.0' })
    const catalog = createCatalog({ loadRegistry })

    catalog.warm()
    const skill = await catalog.get('alpha-skill')

    expect(loadRegistry).toHaveBeenCalledTimes(1)
    expect(skill?.name).toBe('alpha-skill')
  })

  it('starts a new load on the next call when the warm load failed', async () => {
    const loadRegistry = jest.fn<CatalogDeps['loadRegistry']>().mockRejectedValue(new Error('offline'))
    const catalog = createCatalog({ loadRegistry })

    catalog.warm()
    await new Promise((resolve) => setImmediate(resolve))

    await expect(catalog.list()).rejects.toBeInstanceOf(CatalogUnavailableError)
    expect(loadRegistry).toHaveBeenCalledTimes(2)
  })

  it('serves the current data at once and refreshes in the background after the TTL', async () => {
    let now = 1_000
    const loadRegistry = jest
      .fn<CatalogDeps['loadRegistry']>()
      .mockResolvedValueOnce({ data: registryA, version: '1.0.0' })
      .mockImplementationOnce(() => never<RegistrySnapshot>())
    const catalog = createCatalog({ loadRegistry, ttlMs: 100, now: () => now })

    await catalog.list()
    now += 101
    const skills = await catalog.list()

    expect(skills.map((skill) => skill.name)).toEqual(['alpha-skill'])
    expect(loadRegistry).toHaveBeenCalledTimes(2)
  })

  it('switches to the refreshed registry once the background refresh lands', async () => {
    let now = 1_000
    const loadRegistry = jest
      .fn<CatalogDeps['loadRegistry']>()
      .mockResolvedValueOnce({ data: registryA, version: '1.0.0' })
      .mockResolvedValueOnce({ data: registryB, version: '1.0.0' })
    const catalog = createCatalog({ loadRegistry, ttlMs: 100, now: () => now })

    await catalog.list()
    now += 101
    await catalog.list()
    await new Promise((resolve) => setImmediate(resolve))

    expect((await catalog.list()).map((skill) => skill.name)).toEqual(['alpha-skill', 'beta-skill'])
  })

  it('keeps the current data when the background refresh fails', async () => {
    let now = 1_000
    const loadRegistry = jest
      .fn<CatalogDeps['loadRegistry']>()
      .mockResolvedValueOnce({ data: registryA, version: '1.0.0' })
      .mockRejectedValueOnce(new Error('offline'))
    const catalog = createCatalog({ loadRegistry, ttlMs: 100, now: () => now })

    await catalog.list()
    now += 101
    await catalog.list()
    await new Promise((resolve) => setImmediate(resolve))

    expect((await catalog.list()).map((skill) => skill.name)).toEqual(['alpha-skill'])
  })

  it('aborts the in-flight load on close', async () => {
    let received: AbortSignal | undefined
    const catalog = createCatalog({
      loadRegistry: (signal) => {
        received = signal
        return never<RegistrySnapshot>()
      },
    })

    const pending = catalog.list()
    catalog.close()

    await expect(pending).rejects.toBeInstanceOf(CatalogUnavailableError)
    expect(received?.aborted).toBe(true)
  })

  it('fails a call made after close with CatalogUnavailableError and no unhandled rejection', async () => {
    const unhandled: unknown[] = []
    const onUnhandled = (reason: unknown) => unhandled.push(reason)
    process.on('unhandledRejection', onUnhandled)
    const catalog = createCatalog({
      loadRegistry: (signal) => Promise.reject(signal.reason ?? new Error('aborted')),
    })

    try {
      catalog.close()
      await expect(catalog.list()).rejects.toBeInstanceOf(CatalogUnavailableError)
      await new Promise((resolve) => setImmediate(resolve))

      expect(unhandled).toEqual([])
    } finally {
      process.off('unhandledRejection', onUnhandled)
    }
  })

  it('searches the loaded index', async () => {
    const catalog = createCatalog({ loadRegistry: () => Promise.resolve({ data: registryB, version: '1.0.0' }) })

    const results = await catalog.search('beta', 5)

    expect(results[0].item.name).toBe('beta-skill')
  })

  it('returns the whole registry', async () => {
    const catalog = createCatalog({ loadRegistry: () => Promise.resolve({ data: registryB, version: '1.0.0' }) })

    await expect(catalog.registry()).resolves.toBe(registryB)
  })

  it('reads a skill through the verified download with the skills base URL', async () => {
    const fetchBytes = jest.fn<(url: string) => Promise<Uint8Array>>()
    const verify = jest.fn<CatalogDeps['verifyFiles']>().mockResolvedValue(new Map([['SKILL.md', new Uint8Array([1])]]))
    const catalog = createCatalog({
      loadRegistry: () => Promise.resolve({ data: registryA, version: '1.0.0' }),
      skillsBaseUrl: () => 'https://cdn.test/skills/',
      fetchBytes,
      verifyFiles: verify,
    })
    const skill = registryA.skills[0]

    const files = await catalog.read(skill)

    expect(verify).toHaveBeenCalledWith(skill, 'https://cdn.test/skills/', fetchBytes)
    expect(files.get('SKILL.md')).toEqual(new Uint8Array([1]))
  })
})

describe('createCatalog revalidation', () => {
  it('passes the current snapshot to the refresh and keeps the index when it comes back unchanged', async () => {
    let now = 1_000
    const first = { data: registryA, version: '1.0.0', etag: '"v1"' }
    const loadRegistry = jest
      .fn<CatalogDeps['loadRegistry']>()
      .mockResolvedValueOnce(first)
      .mockImplementationOnce(async (_signal, previous) => previous ?? first)
    const catalog = createCatalog({ loadRegistry, ttlMs: 100, now: () => now })

    const before = await catalog.search('alpha', 5)
    now += 101
    await catalog.list()
    await new Promise((resolve) => setImmediate(resolve))
    const after = await catalog.search('alpha', 5)

    expect(loadRegistry.mock.calls[0][1]).toBeNull()
    expect(loadRegistry.mock.calls[1][1]).toBe(first)
    expect(after).toEqual(before)
  })
})
