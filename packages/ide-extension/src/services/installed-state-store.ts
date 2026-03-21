import deepEqual from 'fast-deep-equal'
import * as vscode from 'vscode'
import type { InstalledScopeHashes, InstalledSkillsMap } from '../shared/types'
import type { LoggingService } from './logging-service'
import type { SkillLockService } from './skill-lock-service'
import type { StateReconciler } from './state-reconciler'

export interface InstalledStateSnapshot {
  installedSkills: InstalledSkillsMap
  lastUpdatedAt: string | null
}

type InstalledStateListener = (snapshot: InstalledStateSnapshot) => void

export class InstalledStateStore implements vscode.Disposable {
  private snapshot: InstalledStateSnapshot = {
    installedSkills: {},
    lastUpdatedAt: null,
  }

  private readonly listeners = new Set<InstalledStateListener>()
  private isDisposed = false

  constructor(
    private readonly reconciler: Pick<StateReconciler, 'reconcile' | 'getInstalledSkills' | 'onStateChanged'>,
    private readonly skillLockService: Pick<SkillLockService, 'getInstalledHashesByScope'>,
    private readonly logger: Pick<LoggingService, 'debug'>,
  ) {
    this.reconciler.onStateChanged((state) => {
      if (this.isDisposed) {
        return
      }
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
    if (this.isDisposed) {
      return { dispose: () => {} }
    }

    this.listeners.add(listener)
    return {
      dispose: () => {
        this.listeners.delete(listener)
      },
    }
  }

  public async load(): Promise<void> {
    if (this.isDisposed) {
      return
    }

    await this.refresh()
  }

  public async refresh(): Promise<void> {
    if (this.isDisposed) {
      return
    }

    this.logger.debug('[InstalledStateStore] Refreshing installed state')
    await this.reconciler.reconcile()
    const installedSkills = await this.reconciler.getInstalledSkills()
    await this.publishState(installedSkills)
  }

  public dispose(): void {
    this.isDisposed = true
    this.listeners.clear()
  }

  private async publishState(installedSkills: InstalledSkillsMap): Promise<void> {
    if (this.isDisposed) {
      return
    }

    const installedHashes = await this.skillLockService.getInstalledHashesByScope()
    const nextSnapshot: InstalledStateSnapshot = {
      installedSkills: this.withInstalledHashes(installedSkills, installedHashes),
      lastUpdatedAt: new Date().toISOString(),
    }

    if (deepEqual(nextSnapshot, this.snapshot)) {
      return
    }

    this.snapshot = nextSnapshot

    for (const listener of this.listeners) {
      listener(this.getSnapshot())
    }
  }

  private withInstalledHashes(
    installedSkills: InstalledSkillsMap,
    installedHashes: Record<string, InstalledScopeHashes>,
  ): InstalledSkillsMap {
    const merged: InstalledSkillsMap = {}

    for (const [skillName, installedInfo] of Object.entries(installedSkills)) {
      if (!installedInfo) {
        merged[skillName] = null
        continue
      }

      const scopeHashes = installedHashes[skillName]
      if (!scopeHashes) {
        merged[skillName] = installedInfo
        continue
      }

      merged[skillName] = {
        ...installedInfo,
        contentHash: scopeHashes.local ?? scopeHashes.global,
        scopeHashes,
      }
    }

    return merged
  }
}
