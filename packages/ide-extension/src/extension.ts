import * as vscode from 'vscode'
import { createExtHostAdapters } from './adapters'
import { SidebarProvider } from './providers/sidebar-provider'
import { CoreJobExecutor } from './services/core-job-executor'
import { InstallationOrchestrator } from './services/installation-orchestrator'
import { InstalledSkillsScanner } from './services/installed-skills-scanner'
import { InstalledStateStore } from './services/installed-state-store'
import { LoggingService } from './services/logging-service'
import { OperationQueue } from './services/operation-queue'
import { PostInstallVerifier } from './services/post-install-verifier'
import { RegistryStore } from './services/registry-store'
import { ScopePolicyService } from './services/scope-policy-service'
import { SkillLockService } from './services/skill-lock-service'
import { SkillRegistryService } from './services/skill-registry-service'
import { StateReconciler } from './services/state-reconciler'

/**
 * Entry point invoked by VS Code when the extension activates.
 * Wires service dependencies, providers, commands, and diagnostics.
 *
 * @param context - Extension lifecycle context used to register disposables and access metadata.
 *
 * @example
 * ```typescript
 * export function activate(context: vscode.ExtensionContext) {
 *   // setup extension
 * }
 * ```
 */
export function activate(context: vscode.ExtensionContext): void {
  const outputChannel = vscode.window.createOutputChannel('Agent Skills', { log: true })
  const logger = new LoggingService(outputChannel)
  context.subscriptions.push(logger)

  const ports = createExtHostAdapters(outputChannel)
  const registryService = new SkillRegistryService(ports, context, logger)
  const executor = new CoreJobExecutor(ports)
  const operationQueue = new OperationQueue(executor)
  const verifier = new PostInstallVerifier(ports, logger)
  const orchestrator = new InstallationOrchestrator(operationQueue, verifier, logger)
  const scanner = new InstalledSkillsScanner(ports, logger)
  const reconciler = new StateReconciler(ports, scanner, registryService, logger)
  const skillLockService = new SkillLockService(ports, logger)
  const registryStore = new RegistryStore(registryService, logger)
  const installedStateStore = new InstalledStateStore(reconciler, skillLockService, logger)

  context.subscriptions.push(registryService, operationQueue, orchestrator, reconciler)

  const sidebarProvider = new SidebarProvider(
    context,
    logger,
    registryStore,
    orchestrator,
    reconciler,
    installedStateStore,
  )
  context.subscriptions.push(vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, sidebarProvider))

  const scopePolicyService = new ScopePolicyService()

  /**
   * Evaluates scope policy: workspaceOnly (local when workspace+trusted, global always).
   */
  const updatePolicy = () => {
    const isWorkspaceTrusted = vscode.workspace.isTrusted
    const hasWorkspaceFolder = !!vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0

    const policy = scopePolicyService.evaluate({
      allowedScopes: 'all',
      isWorkspaceTrusted,
      hasWorkspaceFolder,
    })

    reconciler.updatePolicy(policy)
    sidebarProvider.updatePolicy(policy)
  }

  updatePolicy()

  context.subscriptions.push(
    vscode.workspace.onDidGrantWorkspaceTrust(() => updatePolicy()),
    vscode.workspace.onDidChangeWorkspaceFolders(() => updatePolicy()),
  )

  void registryStore.prime()
  void installedStateStore.refresh()

  const extensionVersion = context.extension?.packageJSON?.version ?? 'unknown'
  logger.info(`Agent Skills v${extensionVersion} activated`)
  logger.info(`VS Code ${vscode.version} | Platform: ${process.platform}`)
  logger.info(`Workspace trusted: ${vscode.workspace.isTrusted}`)
}

/**
 * Clean-up hook used by VS Code when the extension is deactivated.
 *
 * @example
 * ```typescript
 * export function deactivate() {
 *   // cleanup
 * }
 * ```
 */
export function deactivate(): void {}
