import { jest } from '@jest/globals'

import { NodeLoggerAdapter } from '../index'

describe('NodeLoggerAdapter', () => {
  it('delegates logging methods to console', () => {
    const adapter = new NodeLoggerAdapter()
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
    const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {})

    try {
      adapter.error('error-message')
      adapter.warn('warn-message')
      adapter.info('info-message')
      adapter.debug('debug-message')

      expect(errorSpy).toHaveBeenCalledWith('error-message')
      expect(warnSpy).toHaveBeenCalledWith('warn-message')
      expect(infoSpy).toHaveBeenCalledWith('info-message')
      expect(debugSpy).toHaveBeenCalledWith('debug-message')
    } finally {
      errorSpy.mockRestore()
      warnSpy.mockRestore()
      infoSpy.mockRestore()
      debugSpy.mockRestore()
    }
  })
})
