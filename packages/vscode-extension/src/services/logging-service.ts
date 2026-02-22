import * as vscode from 'vscode'

type ErrorContext = {
  summary: string
  stackTrace?: string
}

type ErrorLike = {
  name?: unknown
  message?: unknown
  stack?: unknown
}

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
   * @param error - Optional unknown error value containing stack details.
   * @returns Nothing.
   */
  error(message: string, error?: unknown): void {
    this.outputChannel.error(message)

    if (error === undefined) {
      return
    }

    const { summary, stackTrace } = this.getErrorContext(error)
    this.outputChannel.error(`Details: ${summary}`)

    if (stackTrace) {
      this.outputChannel.error(stackTrace)
      this.outputChannel.trace(stackTrace)
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

  private getErrorContext(error: unknown): ErrorContext {
    if (error instanceof Error) {
      return {
        summary: this.formatNameAndMessage(error.name, error.message),
        stackTrace: typeof error.stack === 'string' ? error.stack : undefined,
      }
    }

    if (this.isErrorLike(error)) {
      const name = typeof error.name === 'string' ? error.name : ''
      const message = typeof error.message === 'string' ? error.message : this.stringifyValue(error)
      return {
        summary: this.formatNameAndMessage(name, message),
        stackTrace: typeof error.stack === 'string' ? error.stack : undefined,
      }
    }

    return {
      summary: this.stringifyValue(error),
    }
  }

  private formatNameAndMessage(name: string, message: string): string {
    const normalizedName = name.trim()
    const normalizedMessage = message.trim()

    if (normalizedName.length === 0) {
      return normalizedMessage
    }

    if (normalizedMessage.length === 0) {
      return normalizedName
    }

    return `${normalizedName}: ${normalizedMessage}`
  }

  private isErrorLike(value: unknown): value is ErrorLike {
    if (typeof value !== 'object' || value === null) {
      return false
    }

    const candidate = value as ErrorLike
    return (
      typeof candidate.message === 'string' || typeof candidate.stack === 'string' || typeof candidate.name === 'string'
    )
  }

  private stringifyValue(value: unknown): string {
    if (typeof value === 'string') {
      return value
    }

    if (value === undefined) {
      return 'undefined'
    }

    try {
      const serializedValue = JSON.stringify(value)
      if (serializedValue !== undefined) {
        return serializedValue
      }

      return String(value)
    } catch {
      return String(value)
    }
  }
}
