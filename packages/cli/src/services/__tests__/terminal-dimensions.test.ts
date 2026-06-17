import { afterEach, describe, expect, it } from '@jest/globals'

import { canShowDetailPanel, getTerminalSize, shouldUseBottomPanel } from '../terminal-dimensions'

describe('terminal-dimensions service', () => {
  const originalColumns = process.stdout.columns
  const originalRows = process.stdout.rows

  const mockTerminalSize = (columns: number | undefined, rows: number | undefined) => {
    Object.defineProperty(process.stdout, 'columns', {
      value: columns,
      configurable: true,
      writable: true,
    })
    Object.defineProperty(process.stdout, 'rows', {
      value: rows,
      configurable: true,
      writable: true,
    })
  }

  afterEach(() => {
    mockTerminalSize(originalColumns, originalRows)
  })

  describe('getTerminalSize', () => {
    it('should return current terminal dimensions', () => {
      mockTerminalSize(120, 30)
      const size = getTerminalSize()
      expect(size).toEqual({ width: 120, height: 30 })
    })

    it('should return default dimensions when stdout values are undefined', () => {
      mockTerminalSize(undefined, undefined)
      const size = getTerminalSize()
      expect(size).toEqual({ width: 80, height: 24 })
    })

    it('should handle zero values by using defaults', () => {
      mockTerminalSize(0, 0)
      const size = getTerminalSize()
      expect(size).toEqual({ width: 80, height: 24 })
    })
  })

  describe('shouldUseBottomPanel', () => {
    it('should return true when width is less than 120', () => {
      mockTerminalSize(119, 30)
      const result = shouldUseBottomPanel()
      expect(result).toBe(true)
    })

    it('should return false when width is 120 or greater', () => {
      mockTerminalSize(120, 30)
      const result = shouldUseBottomPanel()
      expect(result).toBe(false)
    })

    it('should return false for very wide terminals', () => {
      mockTerminalSize(200, 50)
      const result = shouldUseBottomPanel()
      expect(result).toBe(false)
    })

    it('should return true for narrow terminals', () => {
      mockTerminalSize(80, 24)
      const result = shouldUseBottomPanel()
      expect(result).toBe(true)
    })
  })

  describe('canShowDetailPanel', () => {
    it('should return true when dimensions meet minimum requirements', () => {
      mockTerminalSize(80, 24)
      const result = canShowDetailPanel()
      expect(result).toBe(true)
    })

    it('should return true when dimensions exceed minimum requirements', () => {
      mockTerminalSize(120, 40)
      const result = canShowDetailPanel()
      expect(result).toBe(true)
    })

    it('should return false when width is below minimum', () => {
      mockTerminalSize(79, 24)
      const result = canShowDetailPanel()
      expect(result).toBe(false)
    })

    it('should return false when height is below minimum', () => {
      mockTerminalSize(80, 23)
      const result = canShowDetailPanel()
      expect(result).toBe(false)
    })

    it('should return false when both dimensions are below minimum', () => {
      mockTerminalSize(70, 20)
      const result = canShowDetailPanel()
      expect(result).toBe(false)
    })

    it('should handle default dimensions correctly', () => {
      mockTerminalSize(undefined, undefined)
      const result = canShowDetailPanel()
      expect(result).toBe(true)
    })
  })
})
