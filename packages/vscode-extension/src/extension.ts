import { spawn } from 'node:child_process'
import * as vscode from 'vscode'
import { SidebarProvider } from './providers/sidebar-provider'
import { CliHealthChecker } from './services/cli-health-checker'
import { CliSpawner } from './services/cli-spawner'
import { InstallationOrchestrator } from './services/installation-orchestrator'
import { InstalledSkillsScanner } from './services/installed-skills-scanner'
import { LoggingService } from './services/logging-service'
import { OperationQueue } from './services/operation-queue'
import { PostInstallVerifier } from './services/post-install-verifier'
import { SkillRegistryService } from './services/skill-registry-service'
import { StateReconciler } from './services/state-reconciler'

export function activate(context: vscode.ExtensionContext): void {
  // ① Core services
  const outputChannel = vscode.window.createOutputChannel('Agent Skills', { log: true })
  const logger = new LoggingService(outputChannel)
  context.subscriptions.push(logger)

  // ② Domain services
  const registryService = new SkillRegistryService(context, logger)
  const cliSpawner = new CliSpawner(logger)
  const operationQueue = new OperationQueue(cliSpawner)
  const verifier = new PostInstallVerifier(logger)
  const orchestrator = new InstallationOrchestrator(operationQueue, verifier, logger)
  const scanner = new InstalledSkillsScanner(logger)
  const reconciler = new StateReconciler(scanner, registryService, logger)
  const healthChecker = new CliHealthChecker(cliSpawner, logger)

  // Register disposables
  context.subscriptions.push(registryService, cliSpawner, operationQueue, orchestrator, reconciler, healthChecker)

  // ③ Providers
  const sidebarProvider = new SidebarProvider(context, logger, registryService, orchestrator, reconciler)
  context.subscriptions.push(vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, sidebarProvider))

  // ④ Start reconciliation
  reconciler.start()

  // ⑤ CLI health check (non-blocking)
  void healthChecker.check().then((status) => {
    // Determine healthy state
    const isHealthy = status.status === 'ok' || status.status === 'outdated'
    orchestrator.setCliHealthy(isHealthy)

    if (status.status === 'npx-missing') {
      void vscode.window.showErrorMessage('Node.js/npm is required. Please install Node.js and restart VS Code.')
    } else if (status.status === 'cli-missing') {
      void vscode.window
        .showErrorMessage('The @tech-leads-club/agent-skills CLI is required.', 'Install CLI')
        .then((action) => {
          if (action === 'Install CLI') {
            spawn('npm', ['install', '-g', '@tech-leads-club/agent-skills@latest'], { stdio: 'ignore', shell: true })
          }
        })
    } else if (status.status === 'outdated') {
      void vscode.window
        .showWarningMessage(
          `The Agent Skills CLI (v${status.version}) is outdated. ` +
            `This extension requires v${status.minVersion} or later.`,
          'Update CLI',
        )
        .then((action) => {
          if (action === 'Update CLI') {
            spawn('npm', ['install', '-g', '@tech-leads-club/agent-skills@latest'], { stdio: 'ignore', shell: true })
          }
        })
    }
  })

  // ⑥ Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('agentSkills.refresh', async () => {
      logger.info('Refresh command invoked')
      try {
        await registryService.refresh()
        await reconciler.reconcile()
        vscode.window.showInformationMessage('Agent Skills: Registry refreshed')
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        vscode.window.showErrorMessage(`Agent Skills: Failed to refresh — ${errorMessage}`)
      }
    }),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('agentSkills.openSettings', () => {
      logger.info('Open Settings command invoked')
      vscode.commands.executeCommand('workbench.action.openSettings', '@ext:tech-leads-club.vscode-extension')
    }),
  )

  // ⑦ Diagnostics (P3)
  const extensionVersion = context.extension?.packageJSON?.version ?? 'unknown'
  logger.info(`Agent Skills Manager v${extensionVersion} activated`)
  logger.info(`VS Code ${vscode.version} | Platform: ${process.platform}`)
  logger.info(`Workspace trusted: ${vscode.workspace.isTrusted}`)
}

export function deactivate(): void {
  // All cleanup handled by context.subscriptions disposal
}
