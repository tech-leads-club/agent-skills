import * as vscode from 'vscode'

const ANSI = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
} as const

export class LoggingService implements vscode.Disposable {
  private readonly debugEnabled: boolean

  constructor(private readonly outputChannel: vscode.OutputChannel) {
    this.debugEnabled = vscode.workspace.getConfiguration('agentSkills').get<boolean>('debug', false)
  }

  info(message: string): void {
    this.log(ANSI.green, 'INFO ', message)
  }

  warn(message: string): void {
    this.log(ANSI.yellow, 'WARN ', message)
  }

  error(message: string, error?: Error): void {
    this.log(ANSI.red, 'ERROR', message)
    if (error?.stack) {
      this.outputChannel.appendLine(`${ANSI.red}${error.stack}${ANSI.reset}`)
    }
  }

  debug(message: string): void {
    if (this.debugEnabled) {
      this.log(ANSI.magenta, 'DEBUG', message)
    }
  }

  dispose(): void {
    this.outputChannel.dispose()
  }

  private log(color: string, level: string, message: string): void {
    const timestamp = new Date().toISOString()
    this.outputChannel.appendLine(`${color}[${level} ${timestamp}]${ANSI.reset} ${message}`)
  }
}
