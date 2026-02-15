import * as vscode from 'vscode'
import { SidebarProvider } from './providers/sidebar-provider'
import { LoggingService } from './services/logging-service'
import { SkillRegistryService } from './services/skill-registry-service'

export function activate(context: vscode.ExtensionContext): void {
  // ① Core services
  const outputChannel = vscode.window.createOutputChannel('Agent Skills')
  const logger = new LoggingService(outputChannel)
  context.subscriptions.push(logger)

  // ② Domain services
  const registryService = new SkillRegistryService(context, logger)
  context.subscriptions.push(registryService)

  // ③ Providers
  const sidebarProvider = new SidebarProvider(context, logger, registryService)
  context.subscriptions.push(vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, sidebarProvider))

  // ④ Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('agentSkills.refresh', async () => {
      logger.info('Refresh command invoked')
      try {
        await registryService.refresh()
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

  // ④ Diagnostics (P3)
  const extensionVersion = context.extension?.packageJSON?.version ?? 'unknown'
  logger.info(`Agent Skills Manager v${extensionVersion} activated`)
  logger.info(`VS Code ${vscode.version} | Platform: ${process.platform}`)
  logger.info(`Workspace trusted: ${vscode.workspace.isTrusted}`)
}

export function deactivate(): void {
  // All cleanup handled by context.subscriptions disposal
}
