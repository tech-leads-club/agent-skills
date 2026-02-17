import * as vscode from 'vscode'

/**
 * Wraps a VS Code output channel and exposes structured logging helpers.
 */
export class LoggingService implements vscode.Disposable {
  /**
   * Creates a logging service bound to a VS Code log output channel.
   *
   * @param outputChannel - Channel that receives structured extension logs.
   */
  constructor(private readonly outputChannel: vscode.LogOutputChannel) {}

  /**
   * Writes an informational log entry.
   *
   * @param message - Log message.
   * @returns Nothing.
   */
  info(message: string): void {
    this.outputChannel.info(message)
  }

  /**
   * Writes a warning log entry.
   *
   * @param message - Log message.
   * @returns Nothing.
   */
  warn(message: string): void {
    this.outputChannel.warn(message)
  }

  /**
   * Writes an error log entry and optional stack trace.
   *
   * @param message - Log message.
   * @param error - Optional error containing stack details.
   * @returns Nothing.
   */
  error(message: string, error?: Error): void {
    this.outputChannel.error(message)
    if (error?.stack) {
      this.outputChannel.error(error.stack)
    }
  }

  /**
   * Writes a debug log entry.
   *
   * @param message - Log message.
   * @returns Nothing.
   */
  debug(message: string): void {
    this.outputChannel.debug(message)
  }

  /**
   * Disposes the underlying VS Code output channel.
   *
   * @returns Nothing.
   */
  dispose(): void {
    this.outputChannel.dispose()
  }
}
