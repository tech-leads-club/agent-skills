import * as vscode from 'vscode'
import type { AvailableAgent, InstalledSkillsMap } from '../shared/types'
import type { InstalledSkillsScanner } from './installed-skills-scanner'
import type { LoggingService } from './logging-service'
import type { SkillRegistryService } from './skill-registry-service'

/**
 * Detects external changes to skill installations and pushes updated state.
 * Uses FileSystemWatcher for local changes and window focus for global changes.
 */
export class StateReconciler implements vscode.Disposable {
  private watchers: vscode.FileSystemWatcher[] = []
  private subscriptions: vscode.Disposable[] = []
  private debounceTimer: NodeJS.Timeout | null = null
  private previousState: InstalledSkillsMap = {}
  private stateChangedHandlers: Array<(state: InstalledSkillsMap) => void> = []

  private readonly DEBOUNCE_MS = 500

  constructor(
    private readonly scanner: InstalledSkillsScanner,
    private readonly registryService: SkillRegistryService,
    private readonly logger: LoggingService,
  ) {}

  /**
   * Starts watching filesystem and window focus events.
   */
  start(): void {
    this.logger.info('Starting state reconciliation')

    // Create FileSystemWatchers for all agent skill directories
    this.createWatchers()

    // Subscribe to window focus events (catches global directory changes)
    const focusSubscription = vscode.window.onDidChangeWindowState((state) => {
      if (state.focused) {
        this.logger.debug('Window focused, triggering reconciliation')
        this.scheduleReconciliation()
      }
    })
    this.subscriptions.push(focusSubscription)

    // Initial reconciliation
    void this.reconcile()
  }

  /**
   * Forces an immediate reconciliation scan.
   */
  async reconcile(): Promise<void> {
    this.logger.debug('Reconciling installed state')

    try {
      const registry = await this.registryService.getRegistry()
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? null
      const newState = await this.scanner.scan(registry.skills, workspaceRoot)

      // Compare with previous state
      if (this.hasStateChanged(newState)) {
        this.logger.info('Installed state changed, emitting update')
        this.previousState = newState
        this.stateChangedHandlers.forEach((handler) => handler(newState))
      } else {
        this.logger.debug('Installed state unchanged')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      this.logger.error(`Reconciliation failed: ${errorMessage}`)
    }
  }

  /**
   * Returns a list of agents detected on the system.
   */
  async getAvailableAgents(): Promise<AvailableAgent[]> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? null
    return this.scanner.getAvailableAgents(workspaceRoot)
  }

  /**
   * Subscribes to state change events.
   */
  onStateChanged(handler: (state: InstalledSkillsMap) => void): void {
    this.stateChangedHandlers.push(handler)
  }

  /**
   * Disposes all watchers and subscriptions.
   */
  dispose(): void {
    this.logger.info('Disposing state reconciler')
    this.watchers.forEach((watcher) => watcher.dispose())
    this.subscriptions.forEach((sub) => sub.dispose())
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
  }

  /**
   * Creates FileSystemWatchers for all agent skill directories.
   */
  private createWatchers(): void {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
    if (!workspaceRoot) {
      this.logger.debug('No workspace folder, skipping FileSystemWatcher creation')
      return
    }

    // Watch patterns for all agent skill directories
    const patterns = [
      '**/.cursor/skills/**',
      '**/.claude/skills/**',
      '**/.github/skills/**',
      '**/.windsurf/skills/**',
      '**/.cline/skills/**',
      '**/.aider/skills/**',
      '**/.codex/skills/**',
      '**/.gemini/skills/**',
      '**/.agent/skills/**', // Antigravity
      '**/.roo/skills/**',
      '**/.kilocode/skills/**',
      '**/.trae/skills/**',
      '**/.amazonq/skills/**',
      '**/.augment/skills/**',
      '**/.tabnine/skills/**',
      '**/.opencode/skills/**',
      '**/.sourcegraph/skills/**',
      '**/.factory/skills/**', // Droid
    ]

    for (const pattern of patterns) {
      const watcher = vscode.workspace.createFileSystemWatcher(pattern)
      watcher.onDidCreate(() => this.scheduleReconciliation())
      watcher.onDidDelete(() => this.scheduleReconciliation())
      watcher.onDidChange(() => this.scheduleReconciliation())
      this.watchers.push(watcher)
    }

    this.logger.debug(`Created ${this.watchers.length} FileSystemWatchers`)
  }

  /**
   * Schedules a debounced reconciliation.
   * Trailing-edge debounce: resets on each event.
   */
  private scheduleReconciliation(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null
      void this.reconcile()
    }, this.DEBOUNCE_MS)
  }

  /**
   * Checks if the state has changed using deep equality.
   */
  private hasStateChanged(newState: InstalledSkillsMap): boolean {
    return JSON.stringify(this.previousState) !== JSON.stringify(newState)
  }
}
