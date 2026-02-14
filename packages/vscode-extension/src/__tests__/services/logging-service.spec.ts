import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import * as vscode from 'vscode'
import { LoggingService } from '../../services/logging-service'

describe('LoggingService', () => {
  let outputChannel: vscode.OutputChannel
  let loggingService: LoggingService

  const ANSI = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
    reset: '\x1b[0m',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-01T12:00:00.000Z'))

    outputChannel = {
      appendLine: jest.fn(),
      dispose: jest.fn(),
    } as unknown as vscode.OutputChannel

    // Default: debug disabled
    ;(vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
      get: jest.fn((_key: string, defaultValue: unknown) => defaultValue),
    })

    loggingService = new LoggingService(outputChannel)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should log info messages with green color', () => {
    loggingService.info('test info')
    const timestamp = new Date().toISOString()
    expect(outputChannel.appendLine).toHaveBeenCalledWith(`${ANSI.green}[INFO  ${timestamp}]${ANSI.reset} test info`)
  })

  it('should log warn messages with yellow color', () => {
    loggingService.warn('test warn')
    const timestamp = new Date().toISOString()
    expect(outputChannel.appendLine).toHaveBeenCalledWith(`${ANSI.yellow}[WARN  ${timestamp}]${ANSI.reset} test warn`)
  })

  it('should log error messages with red color', () => {
    loggingService.error('test error')
    const timestamp = new Date().toISOString()
    expect(outputChannel.appendLine).toHaveBeenCalledWith(`${ANSI.red}[ERROR ${timestamp}]${ANSI.reset} test error`)
  })

  it('should log error stack traces', () => {
    const error = new Error('oops')
    error.stack = 'Error: oops\n    at test'
    loggingService.error('test error', error)

    const timestamp = new Date().toISOString()
    expect(outputChannel.appendLine).toHaveBeenCalledWith(`${ANSI.red}[ERROR ${timestamp}]${ANSI.reset} test error`)
    expect(outputChannel.appendLine).toHaveBeenCalledWith(`${ANSI.red}${error.stack}${ANSI.reset}`)
  })

  it('should not log debug messages when debug is disabled', () => {
    loggingService.debug('test debug')
    expect(outputChannel.appendLine).not.toHaveBeenCalled()
  })

  it('should log debug messages with magenta color when debug is enabled', () => {
    // Mock debug: true
    ;(vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
      get: jest.fn((key: string, defaultValue: unknown) => (key === 'debug' ? true : defaultValue)),
    })

    const debugService = new LoggingService(outputChannel)
    debugService.debug('test debug')

    const timestamp = new Date().toISOString()
    expect(outputChannel.appendLine).toHaveBeenCalledWith(`${ANSI.magenta}[DEBUG ${timestamp}]${ANSI.reset} test debug`)
  })

  it('should dispose the output channel', () => {
    loggingService.dispose()
    expect(outputChannel.dispose).toHaveBeenCalled()
  })
})
