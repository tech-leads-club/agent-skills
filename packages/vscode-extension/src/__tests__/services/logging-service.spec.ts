import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import * as vscode from 'vscode'
import { LoggingService } from '../../services/logging-service'

describe('LoggingService', () => {
  let outputChannel: vscode.LogOutputChannel
  let loggingService: LoggingService

  beforeEach(() => {
    jest.clearAllMocks()

    outputChannel = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      dispose: jest.fn(),
    } as unknown as vscode.LogOutputChannel

    loggingService = new LoggingService(outputChannel)
  })

  it('should log info messages via LogOutputChannel.info()', () => {
    loggingService.info('test info')
    expect(outputChannel.info).toHaveBeenCalledWith('test info')
  })

  it('should log warn messages via LogOutputChannel.warn()', () => {
    loggingService.warn('test warn')
    expect(outputChannel.warn).toHaveBeenCalledWith('test warn')
  })

  it('should log error messages via LogOutputChannel.error()', () => {
    loggingService.error('test error')
    expect(outputChannel.error).toHaveBeenCalledWith('test error')
  })

  it('should log error stack traces', () => {
    const error = new Error('oops')
    error.stack = 'Error: oops\n    at test'
    loggingService.error('test error', error)

    expect(outputChannel.error).toHaveBeenCalledWith('test error')
    expect(outputChannel.error).toHaveBeenCalledWith('Details: Error: oops')
    expect(outputChannel.error).toHaveBeenCalledWith(error.stack)
    expect(outputChannel.trace).toHaveBeenCalledWith(error.stack)
  })

  it('should log non-Error error values', () => {
    loggingService.error('test error', 'boom')

    expect(outputChannel.error).toHaveBeenCalledWith('test error')
    expect(outputChannel.error).toHaveBeenCalledWith('Details: boom')
    expect(outputChannel.trace).not.toHaveBeenCalled()
  })

  it('should log debug messages via LogOutputChannel.debug()', () => {
    loggingService.debug('test debug')
    expect(outputChannel.debug).toHaveBeenCalledWith('test debug')
  })

  it('should dispose the output channel', () => {
    loggingService.dispose()
    expect(outputChannel.dispose).toHaveBeenCalled()
  })
})
