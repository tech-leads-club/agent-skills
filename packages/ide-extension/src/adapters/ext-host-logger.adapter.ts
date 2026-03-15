import * as vscode from 'vscode'

import type { LoggerPort } from '@tech-leads-club/core'

/**
 * Extension Host implementation of {@link LoggerPort} routing to VS Code OutputChannel.
 */
export class ExtHostLoggerAdapter implements LoggerPort {
  constructor(private readonly outputChannel: vscode.LogOutputChannel) {}

  error(message: string): void {
    this.outputChannel.error(message)
  }

  warn(message: string): void {
    this.outputChannel.warn(message)
  }

  info(message: string): void {
    this.outputChannel.info(message)
  }

  debug(message: string): void {
    this.outputChannel.debug(message)
  }
}
