import * as vscode from 'vscode'

/**
 * Wraps a VS Code output channel and exposes structured logging helpers.
 */
export class LoggingService implements vscode.Disposable {
  constructor(private readonly outputChannel: vscode.LogOutputChannel) {}

  info(message: string): void {
    this.outputChannel.info(message)
  }

  warn(message: string): void {
    this.outputChannel.warn(message)
  }

  error(message: string, error?: Error): void {
    this.outputChannel.error(message)
    if (error?.stack) {
      this.outputChannel.error(error.stack)
    }
  }

  debug(message: string): void {
    this.outputChannel.debug(message)
  }

  dispose(): void {
    this.outputChannel.dispose()
  }
}
