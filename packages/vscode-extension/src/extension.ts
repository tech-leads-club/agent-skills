import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext): void {
  const outputChannel = vscode.window.createOutputChannel('Agent Skills')
  outputChannel.appendLine('Agent Skills Manager activated')
  context.subscriptions.push(outputChannel)
}

export function deactivate(): void {
  // Cleanup will be added as services are implemented
}
