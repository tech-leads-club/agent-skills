import * as fc from 'fast-check'
import { formatCategoryBadge } from '../badge-format'

describe('badge-format service', () => {
  describe('formatCategoryBadge', () => {
    /**
     * **Validates: Requirements 3.2.1, 3.2.2**
     * 
     * Property 2: Category badge format
     * 
     * For any category with skill counts, the badge should display in the format
     * `(installed/total)` when installed > 0, or `(total)` when installed = 0
     */
    it('should format badge correctly for any valid skill counts', () => {
      fc.assert(
        fc.property(
          // Generate non-negative integers for installed and total counts
          fc.nat({ max: 1000 }),
          fc.nat({ max: 1000 }),
          (installed, total) => {
            // Ensure installed <= total (valid constraint)
            const validInstalled = Math.min(installed, total)
            
            const badge = formatCategoryBadge(validInstalled, total)
            
            if (validInstalled > 0) {
              // When installed > 0, format should be (installed/total)
              expect(badge).toBe(`(${validInstalled}/${total})`)
              expect(badge).toMatch(/^\(\d+\/\d+\)$/)
            } else {
              // When installed = 0, format should be (total)
              expect(badge).toBe(`(${total})`)
              expect(badge).toMatch(/^\(\d+\)$/)
            }
          }
        ),
        { numRuns: 1000 }
      )
    })

    /**
     * Additional property: Badge format structure
     * 
     * Validates that the badge always starts with '(' and ends with ')'
     */
    it('should always wrap badge content in parentheses', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 1000 }),
          fc.nat({ max: 1000 }),
          (installed, total) => {
            const validInstalled = Math.min(installed, total)
            const badge = formatCategoryBadge(validInstalled, total)
            
            expect(badge.startsWith('(')).toBe(true)
            expect(badge.endsWith(')')).toBe(true)
          }
        )
      )
    })

    /**
     * Additional property: Badge contains only valid characters
     * 
     * Validates that the badge only contains digits, parentheses, and forward slash
     */
    it('should only contain valid characters (digits, parentheses, slash)', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 1000 }),
          fc.nat({ max: 1000 }),
          (installed, total) => {
            const validInstalled = Math.min(installed, total)
            const badge = formatCategoryBadge(validInstalled, total)
            
            // Badge should only contain: digits, (, ), /
            expect(badge).toMatch(/^[\d()/]+$/)
          }
        )
      )
    })

    // Example-based tests for specific edge cases
    describe('specific examples', () => {
      it('should format badge with installed skills', () => {
        expect(formatCategoryBadge(3, 8)).toBe('(3/8)')
        expect(formatCategoryBadge(1, 5)).toBe('(1/5)')
        expect(formatCategoryBadge(10, 10)).toBe('(10/10)')
      })

      it('should format badge without installed skills', () => {
        expect(formatCategoryBadge(0, 5)).toBe('(5)')
        expect(formatCategoryBadge(0, 10)).toBe('(10)')
        expect(formatCategoryBadge(0, 1)).toBe('(1)')
      })

      it('should handle edge case of zero total', () => {
        expect(formatCategoryBadge(0, 0)).toBe('(0)')
      })
    })
  })
})
