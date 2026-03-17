import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { LoggingService } from '../../services/logging-service'
import type { RegistryStoreSnapshot } from '../../services/registry-store'
import { RegistryStore } from '../../services/registry-store'
import type { RegistryResult, SkillRegistryService } from '../../services/skill-registry-service'
import type { SkillRegistry } from '../../shared/types'

type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((innerResolve) => {
    resolve = innerResolve
  })

  return { promise, resolve }
}

describe('RegistryStore', () => {
  let registryService: jest.Mocked<Pick<SkillRegistryService, 'getRegistryWithMetadata'>>
  let logger: jest.Mocked<Pick<LoggingService, 'debug' | 'warn'>>

  const registry: SkillRegistry = {
    version: '1.0.0',
    categories: {},
    skills: [],
  }

  beforeEach(() => {
    registryService = {
      getRegistryWithMetadata: jest.fn(),
    }

    logger = {
      debug: jest.fn(),
      warn: jest.fn(),
    }
  })

  it('starts with an idle empty snapshot', () => {
    const store = new RegistryStore(registryService, logger)

    expect(store.getSnapshot()).toEqual({
      status: 'idle',
      registry: null,
      fromCache: false,
      errorMessage: null,
    })
  })

  it('publishes loading then ready during prime', async () => {
    const deferred = createDeferred<RegistryResult>()
    registryService.getRegistryWithMetadata.mockReturnValue(deferred.promise)
    const store = new RegistryStore(registryService, logger)
    const snapshots = [store.getSnapshot().status]

    store.subscribe((snapshot: RegistryStoreSnapshot) => {
      snapshots.push(snapshot.status)
    })

    const primePromise = store.prime()

    expect(store.getSnapshot()).toEqual({
      status: 'loading',
      registry: null,
      fromCache: false,
      errorMessage: null,
    })

    deferred.resolve({
      data: registry,
      fromCache: false,
      offline: false,
    })
    await primePromise

    expect(store.getSnapshot()).toEqual({
      status: 'ready',
      registry,
      fromCache: false,
      errorMessage: null,
    })
    expect(snapshots).toEqual(['idle', 'loading', 'ready'])
  })

  it('deduplicates concurrent prime calls', async () => {
    const deferred = createDeferred<RegistryResult>()
    registryService.getRegistryWithMetadata.mockReturnValue(deferred.promise)
    const store = new RegistryStore(registryService, logger)

    const [first, second] = [store.prime(), store.prime()]

    expect(registryService.getRegistryWithMetadata).toHaveBeenCalledTimes(1)

    deferred.resolve({
      data: registry,
      fromCache: false,
      offline: false,
    })

    await Promise.all([first, second])
  })

  it('marks offline snapshots when cached data is served as fallback', async () => {
    registryService.getRegistryWithMetadata.mockResolvedValue({
      data: registry,
      fromCache: true,
      offline: true,
    })
    const store = new RegistryStore(registryService, logger)

    await store.refresh()

    expect(store.getSnapshot()).toEqual({
      status: 'offline',
      registry,
      fromCache: true,
      errorMessage: expect.stringContaining('Unable to refresh'),
    })
  })
})
