import type { InstalledSkillsMap } from '../shared/types'
import type { LoggingService } from './logging-service'
import type { SkillLockService } from './skill-lock-service'
import type { StateReconciler } from './state-reconciler'

export interface InstalledStateSnapshot {
  installedSkills: InstalledSkillsMap
  lastUpdatedAt: string | null
}

type InstalledStateListener = (snapshot: InstalledStateSnapshot) => void

export class InstalledStateStore {
  private snapshot: InstalledStateSnapshot = {
    installedSkills: {},
    lastUpdatedAt: null,
  }

  private readonly listeners = new Set<InstalledStateListener>()

  constructor(
    private readonly reconciler: Pick<StateReconciler, 'reconcile' | 'getInstalledSkills' | 'onStateChanged'>,
    private readonly skillLockService: Pick<SkillLockService, 'getInstalledHashes'>,
    private readonly logger: Pick<LoggingService, 'debug'>,
  ) {
    this.reconciler.onStateChanged((state) => {
      void this.publishState(state)
    })
  }

  public getSnapshot(): InstalledStateSnapshot {
    return {
      installedSkills: this.snapshot.installedSkills,
      lastUpdatedAt: this.snapshot.lastUpdatedAt,
    }
  }

  public subscribe(listener: InstalledStateListener): { dispose(): void } {
    this.listeners.add(listener)
    return {
      dispose: () => {
        this.listeners.delete(listener)
      },
    }
  }

  public async load(): Promise<void> {
    await this.refresh()
  }

  public async refresh(): Promise<void> {
    this.logger.debug('[InstalledStateStore] Refreshing installed state')
    await this.reconciler.reconcile()
    const installedSkills = await this.reconciler.getInstalledSkills()
    await this.publishState(installedSkills)
  }

  private async publishState(installedSkills: InstalledSkillsMap): Promise<void> {
    const installedHashes = await this.skillLockService.getInstalledHashes()
    const nextSnapshot: InstalledStateSnapshot = {
      installedSkills: this.withInstalledHashes(installedSkills, installedHashes),
      lastUpdatedAt: new Date().toISOString(),
    }

    if (JSON.stringify(nextSnapshot) === JSON.stringify(this.snapshot)) {
      return
    }

    this.snapshot = nextSnapshot

    for (const listener of this.listeners) {
      listener(this.getSnapshot())
    }
  }

  private withInstalledHashes(
    installedSkills: InstalledSkillsMap,
    installedHashes: Record<string, string | undefined>,
  ): InstalledSkillsMap {
    const merged: InstalledSkillsMap = {}

    for (const [skillName, installedInfo] of Object.entries(installedSkills)) {
      if (!installedInfo) {
        merged[skillName] = null
        continue
      }

      const installedHash = installedHashes[skillName]
      if (installedHash === undefined) {
        merged[skillName] = installedInfo
        continue
      }

      merged[skillName] = {
        ...installedInfo,
        contentHash: installedHash,
      }
    }

    return merged
  }
}
