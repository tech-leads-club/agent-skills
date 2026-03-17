import type { SkillRegistry } from '../shared/types'
import type { LoggingService } from './logging-service'
import type { RegistryResult, SkillRegistryService } from './skill-registry-service'

export interface RegistryStoreSnapshot {
  status: 'idle' | 'loading' | 'ready' | 'offline' | 'error'
  registry: SkillRegistry | null
  fromCache: boolean
  errorMessage: string | null
}

type RegistryStoreListener = (snapshot: RegistryStoreSnapshot) => void

export class RegistryStore {
  private snapshot: RegistryStoreSnapshot = {
    status: 'idle',
    registry: null,
    fromCache: false,
    errorMessage: null,
  }

  private readonly listeners = new Set<RegistryStoreListener>()
  private inFlightLoad: Promise<void> | null = null

  constructor(
    private readonly registryService: Pick<SkillRegistryService, 'getRegistryWithMetadata'>,
    private readonly logger: Pick<LoggingService, 'debug' | 'warn'>,
  ) {}

  public getSnapshot(): RegistryStoreSnapshot {
    return { ...this.snapshot }
  }

  public subscribe(listener: RegistryStoreListener): { dispose(): void } {
    this.listeners.add(listener)
    return {
      dispose: () => {
        this.listeners.delete(listener)
      },
    }
  }

  public async prime(): Promise<void> {
    return this.load(false)
  }

  public async refresh(): Promise<void> {
    return this.load(true)
  }

  private async load(forceRefresh: boolean): Promise<void> {
    if (this.inFlightLoad) {
      this.logger.debug('[RegistryStore] Reusing in-flight registry load')
      return this.inFlightLoad
    }

    if (!this.snapshot.registry) {
      this.updateSnapshot({
        status: 'loading',
        registry: null,
        fromCache: false,
        errorMessage: null,
      })
    }

    this.inFlightLoad = this.registryService
      .getRegistryWithMetadata(forceRefresh)
      .then((result) => {
        this.updateSnapshot(this.mapResultToSnapshot(result))
      })
      .catch((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        this.updateSnapshot({
          status: 'error',
          registry: null,
          fromCache: false,
          errorMessage,
        })
        throw error
      })
      .finally(() => {
        this.inFlightLoad = null
      })

    return this.inFlightLoad
  }

  private mapResultToSnapshot(result: RegistryResult): RegistryStoreSnapshot {
    if (result.offline) {
      return {
        status: 'offline',
        registry: result.data,
        fromCache: result.fromCache,
        errorMessage: 'Unable to refresh the skills registry. Showing cached data.',
      }
    }

    return {
      status: 'ready',
      registry: result.data,
      fromCache: result.fromCache,
      errorMessage: null,
    }
  }

  private updateSnapshot(nextSnapshot: RegistryStoreSnapshot): void {
    this.snapshot = nextSnapshot
    for (const listener of this.listeners) {
      listener(this.getSnapshot())
    }
  }
}
