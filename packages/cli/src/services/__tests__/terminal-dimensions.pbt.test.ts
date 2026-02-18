import * as fc from 'fast-check'
import { describe, it, expect, afterEach } from '@jest/globals'
import { getTerminalSize, shouldUseBottomPanel } from '../terminal-dimensions'

describe('terminal-dimensions service - Property-Based Tests', () => {
  // Store original values
  const originalColumns = process.stdout.columns
  const originalRows = process.stdout.rows

  afterEach(() => {
    // Restore original values
    process.stdout.columns = originalColumns
    process.stdout.rows = originalRows
  })

  /**
   * **Validates: Requirements 3.4.3**
   *
   * Property 7: Panel position by terminal size
   *
   * For any terminal dimensions, the detail panel should be positioned on the side
   * when width >= 120, and at the bottom when width < 120. This property validates that:
   * 1. Width >= 120 results in side position (shouldUseBottomPanel returns false)
   * 2. Width < 120 results in bottom position (shouldUseBottomPanel returns true)
   * 3. The threshold boundary at 120 columns is correctly enforced
   */
  it('should position panel based on terminal width threshold of 120 columns', () => {
    fc.assert(
      fc.property(
        // Generate terminal widths from 1 to 300 columns
        fc.integer({ min: 1, max: 300 }),
        // Generate terminal heights from 1 to 100 rows (height doesn't affect panel position)
        fc.integer({ min: 1, max: 100 }),
        (width, height) => {
          // Setup: Set terminal dimensions
          process.stdout.columns = width
          process.stdout.rows = height

          // Act: Check panel position
          const useBottomPanel = shouldUseBottomPanel()

          // Assert: Panel should be at bottom when width < 120, side when width >= 120
          const expectedBottomPanel = width < 120

          expect(useBottomPanel).toBe(expectedBottomPanel)

          // Additional assertion: Verify terminal size is read correctly
          const size = getTerminalSize()
          expect(size.width).toBe(width)
          expect(size.height).toBe(height)
        }
      ),
      { numRuns: 500 }
    )
  })

  /**
   * Additional property: Boundary precision at 120 columns
   *
   * Validates that the threshold is precise at exactly 120 columns
   */
  it('should have precise threshold boundary at 120 columns', () => {
    fc.assert(
      fc.property(
        // Generate small offsets around the 120 column boundary (-50 to +50)
        fc.integer({ min: -50, max: 50 }),
        fc.integer({ min: 24, max: 100 }),
        (offset, height) => {
          // Setup: Set width to exactly 120 + offset
          const width = 120 + offset
          process.stdout.columns = width
          process.stdout.rows = height

          // Act: Check panel position
          const useBottomPanel = shouldUseBottomPanel()

          // Assert: Should use bottom panel only when offset is negative (width < 120)
          const expectedBottomPanel = offset < 0

          expect(useBottomPanel).toBe(expectedBottomPanel)
        }
      ),
      { numRuns: 300 }
    )
  })

  /**
   * Additional property: Panel position independence from height
   *
   * Validates that panel positioning is determined solely by width,
   * not affected by terminal height
   */
  it('should determine panel position based on width only, independent of height', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 300 }),
        // Generate two different heights
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (width, height1, height2) => {
          // Setup: Test with same width but different heights
          process.stdout.columns = width
          
          // First test with height1
          process.stdout.rows = height1
          const result1 = shouldUseBottomPanel()

          // Second test with height2
          process.stdout.rows = height2
          const result2 = shouldUseBottomPanel()

          // Assert: Both should return the same result since width is the same
          expect(result1).toBe(result2)

          // Both should match the expected result based on width
          const expectedBottomPanel = width < 120
          expect(result1).toBe(expectedBottomPanel)
          expect(result2).toBe(expectedBottomPanel)
        }
      ),
      { numRuns: 300 }
    )
  })

  /**
   * Additional property: Consistent results across multiple calls
   *
   * Validates that calling shouldUseBottomPanel multiple times with
   * the same terminal dimensions returns consistent results
   */
  it('should return consistent results across multiple calls with same dimensions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 300 }),
        fc.integer({ min: 1, max: 100 }),
        // Generate number of calls (2-10)
        fc.integer({ min: 2, max: 10 }),
        (width, height, numCalls) => {
          // Setup: Set terminal dimensions
          process.stdout.columns = width
          process.stdout.rows = height

          // Act: Call shouldUseBottomPanel multiple times
          const results = Array.from({ length: numCalls }, () => shouldUseBottomPanel())

          // Assert: All calls should return the same result
          const firstResult = results[0]
          for (const result of results) {
            expect(result).toBe(firstResult)
          }

          // Verify the result matches the expected value
          const expectedBottomPanel = width < 120
          expect(firstResult).toBe(expectedBottomPanel)
        }
      ),
      { numRuns: 200 }
    )
  })

  /**
   * Additional property: Edge cases at minimum and maximum widths
   *
   * Validates behavior at extreme terminal widths
   */
  it('should handle extreme terminal widths correctly', () => {
    fc.assert(
      fc.property(
        // Generate extreme widths: very small (1-10) or very large (200-500)
        fc.oneof(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 200, max: 500 })
        ),
        fc.integer({ min: 1, max: 100 }),
        (width, height) => {
          // Setup: Set terminal dimensions
          process.stdout.columns = width
          process.stdout.rows = height

          // Act: Check panel position
          const useBottomPanel = shouldUseBottomPanel()

          // Assert: Should follow the same rule regardless of extreme values
          const expectedBottomPanel = width < 120

          expect(useBottomPanel).toBe(expectedBottomPanel)

          // For very small widths, should always use bottom panel
          if (width < 120) {
            expect(useBottomPanel).toBe(true)
          }

          // For very large widths, should always use side panel
          if (width >= 200) {
            expect(useBottomPanel).toBe(false)
          }
        }
      ),
      { numRuns: 200 }
    )
  })

  describe('specific boundary examples', () => {
    it('should use bottom panel at exactly 119 columns', () => {
      process.stdout.columns = 119
      process.stdout.rows = 30

      expect(shouldUseBottomPanel()).toBe(true)
    })

    it('should use side panel at exactly 120 columns', () => {
      process.stdout.columns = 120
      process.stdout.rows = 30

      expect(shouldUseBottomPanel()).toBe(false)
    })

    it('should use side panel at exactly 121 columns', () => {
      process.stdout.columns = 121
      process.stdout.rows = 30

      expect(shouldUseBottomPanel()).toBe(false)
    })

    it('should use bottom panel for minimum terminal width', () => {
      process.stdout.columns = 80
      process.stdout.rows = 24

      expect(shouldUseBottomPanel()).toBe(true)
    })

    it('should use side panel for very wide terminals', () => {
      process.stdout.columns = 200
      process.stdout.rows = 50

      expect(shouldUseBottomPanel()).toBe(false)
    })

    it('should use bottom panel for narrow terminals', () => {
      process.stdout.columns = 100
      process.stdout.rows = 40

      expect(shouldUseBottomPanel()).toBe(true)
    })
  })
})
