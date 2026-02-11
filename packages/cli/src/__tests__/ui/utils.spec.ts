import { afterEach, describe, expect, it } from '@jest/globals'
import { TERMINAL_DEFAULTS, getTerminalHeight, getTerminalWidth, truncateText } from '../../ui/utils'

describe('UI Utils', () => {
  describe('truncateText', () => {
    it('should return empty string if maxLength is <= 0', () => {
      expect(truncateText('hello', 0)).toBe('')
      expect(truncateText('hello', -1)).toBe('')
    })

    it('should return original text if length <= maxLength', () => {
      expect(truncateText('hello', 5)).toBe('hello')
      expect(truncateText('hello', 10)).toBe('hello')
    })

    it('should handle small maxLength (< 3)', () => {
      expect(truncateText('hello', 1)).toBe('.')
      expect(truncateText('hello', 2)).toBe('..')
    })

    it('should truncate text with ellipsis if length > maxLength', () => {
      // 5 chars + 3 dots = 8
      expect(truncateText('hello world', 8)).toBe('hello...')
    })

    it('should handle boundary case where length is exactly maxLength + 1', () => {
      // "123456", max 5 -> "12..." (2 chars + 3 dots)
      expect(truncateText('123456', 5)).toBe('12...')
    })
  })

  describe('Terminal Dimensions', () => {
    const originalColumns = process.stdout.columns
    const originalRows = process.stdout.rows

    const mockStdout = (columns?: number, rows?: number) => {
      Object.defineProperty(process.stdout, 'columns', {
        value: columns,
        configurable: true,
      })
      Object.defineProperty(process.stdout, 'rows', {
        value: rows,
        configurable: true,
      })
    }

    afterEach(() => {
      Object.defineProperty(process.stdout, 'columns', {
        value: originalColumns,
        configurable: true,
      })
      Object.defineProperty(process.stdout, 'rows', {
        value: originalRows,
        configurable: true,
      })
    })

    describe('getTerminalWidth', () => {
      it('should return process.stdout.columns if available', () => {
        mockStdout(100, 50)
        expect(getTerminalWidth()).toBe(100)
      })

      it('should return default width if process.stdout.columns is undefined', () => {
        mockStdout(undefined, 50)
        expect(getTerminalWidth()).toBe(TERMINAL_DEFAULTS.WIDTH)
      })

      it('should return provided default width if columns undefined', () => {
        mockStdout(undefined, 50)
        expect(getTerminalWidth(120)).toBe(120)
      })
    })

    describe('getTerminalHeight', () => {
      it('should return process.stdout.rows if available', () => {
        mockStdout(100, 50)
        expect(getTerminalHeight()).toBe(50)
      })

      it('should return default height if process.stdout.rows is undefined', () => {
        mockStdout(100, undefined)
        expect(getTerminalHeight()).toBe(TERMINAL_DEFAULTS.HEIGHT)
      })

      it('should return provided default height if rows undefined', () => {
        mockStdout(100, undefined)
        expect(getTerminalHeight(40)).toBe(40)
      })
    })
  })
})
