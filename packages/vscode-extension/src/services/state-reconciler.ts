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
  private watchersInitialized = false

  private readonly DEBOUNCE_MS = 500

  /**
   * Creates a state reconciler that bridges scanner output to subscribers.
   *
   * @param scanner - Filesystem scanner for installed skills.
   * @param registryService - Registry service used to resolve known skills.
   * @param logger - Logging service for reconciliation diagnostics.
   */
  constructor(
    private readonly scanner: InstalledSkillsScanner,
    private readonly registryService: SkillRegistryService,
    private readonly logger: LoggingService,
  ) {}

  /**
   * Starts watching filesystem and window focus events.
   *
   * @returns Nothing.
   */
  start(): void {
    this.logger.info('Starting state reconciliation')

    if (vscode.workspace.isTrusted) {
      // Create local FileSystemWatchers only for trusted workspaces
      this.createLocalWatchers()
    } else {
      this.logger.info('Workspace untrusted — skipping local FileSystemWatchers')
    }

    // Subscribe to window focus events (catches global directory changes)
    const focusSubscription = vscode.window.onDidChangeWindowState((state) => {
      if (state.focused) {
        this.logger.debug('Window focused, triggering reconciliation')
        this.scheduleReconciliation()
      }
    })
    this.subscriptions.push(focusSubscription)

    // Listen for trust grant
    const trustSubscription = vscode.workspace.onDidGrantWorkspaceTrust(() => {
      this.logger.info('Workspace trust granted — creating local FileSystemWatchers')
      this.createLocalWatchers()
      this.scheduleReconciliation()
    })
    this.subscriptions.push(trustSubscription)

    // Initial reconciliation
    void this.reconcile()
  }

  /**
   * Forces an immediate reconciliation scan.
   *
   * @returns A promise that resolves when reconciliation finishes.
   */
  async reconcile(): Promise<void> {
    this.logger.debug('Reconciling installed state')

    try {
      const registry = await this.registryService.getRegistry()
      // Only scan local if workspace is trusted
      const workspaceRoot = vscode.workspace.isTrusted
        ? (vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? null)
        : null

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
   *
   * @returns A promise with currently detected agent hosts.
   */
  async getAvailableAgents(): Promise<AvailableAgent[]> {
    const workspaceRoot = vscode.workspace.isTrusted
      ? (vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? null)
      : null
    return this.scanner.getAvailableAgents(workspaceRoot)
  }

  /**
   * Returns the current installed skills map from the last reconciliation.
   *
   * @returns A promise with the latest cached installed-skill state.
   */
  async getInstalledSkills(): Promise<InstalledSkillsMap> {
    return this.previousState
  }

  /**
   * Subscribes to state change events.
   *
   * @param handler - Callback invoked when installed state changes.
   * @returns Nothing.
   */
  onStateChanged(handler: (state: InstalledSkillsMap) => void): void {
    this.stateChangedHandlers.push(handler)
  }

  /**
   * Disposes all watchers and subscriptions.
   *
   * @returns Nothing.
   */
  dispose(): void {
    this.logger.info('Disposing state reconciler')
    this.watchers.forEach((watcher) => watcher.dispose())
    this.subscriptions.forEach((sub) => sub.dispose())
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
    this.watchers = []
    this.watchersInitialized = false
  }

  /**
   * Creates FileSystemWatchers for all agent skill directories.
   *
   * @returns Nothing.
   */
  private createLocalWatchers(): void {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
    if (!workspaceRoot) {
      this.logger.debug('No workspace folder, skipping FileSystemWatcher creation')
      return
    }

    if (this.watchersInitialized || this.watchers.length > 0) {
      this.logger.debug('Local FileSystemWatchers already initialized, skipping duplicate creation')
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

    this.watchersInitialized = true
    this.logger.debug(`Created ${this.watchers.length} FileSystemWatchers`)
  }

  /**
   * Schedules a debounced reconciliation.
   * Trailing-edge debounce: resets on each event.
   *
   * @returns Nothing.
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
   *
   * @param newState - Newly scanned installed-skill state.
   * @returns `true` when serialized state differs from the previous snapshot.
   */
  private hasStateChanged(newState: InstalledSkillsMap): boolean {
    return JSON.stringify(this.previousState) !== JSON.stringify(newState)
  }
}
