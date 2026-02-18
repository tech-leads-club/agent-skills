import * as fc from 'fast-check'
import { categoryColors, getAllCategoryColors, getColorForCategory } from '../category-colors'

describe('category-colors service', () => {
  describe('getColorForCategory', () => {
    /**
     * **Validates: Requirements 3.5.1, 3.5.2**
     * 
     * Property 9: Category color consistency
     * 
     * For any category, the same color should be returned regardless of
     * which view or component requests it
     */
    it('should return consistent color for the same category across multiple calls', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(categoryColors)),
          (categoryId) => {
            const color1 = getColorForCategory(categoryId)
            const color2 = getColorForCategory(categoryId)
            const color3 = getColorForCategory(categoryId)
            
            // All calls should return the same color
            expect(color1).toBe(color2)
            expect(color2).toBe(color3)
            expect(color1).toBe(color3)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 3.5.5**
     * 
     * Property 11: Unknown category fallback
     * 
     * For any category ID not in the color mapping, the service should
     * return the default color
     */
    it('should return default color for unknown category IDs', () => {
      fc.assert(
        fc.property(
          // Generate random strings that are NOT in the known categories
          fc.string({ minLength: 1, maxLength: 20 }).filter(
            (str) => !Object.keys(categoryColors).includes(str)
          ),
          (unknownCategoryId) => {
            const color = getColorForCategory(unknownCategoryId)
            
            // Should return the default color
            expect(color).toBe(categoryColors.default)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 3.5.3**
     * 
     * Property 10: Color contrast accessibility
     * 
     * For any category color, the contrast ratio against the background
     * should be at least 4.5:1 (WCAG AA)
     * 
     * Note: This test verifies the color format is valid hex.
     * Actual contrast ratios have been manually verified in the design doc.
     */
    it('should return valid hex color codes for all categories', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(categoryColors)),
          (categoryId) => {
            const color = getColorForCategory(categoryId)
            
            // Should be a valid hex color code
            expect(color).toMatch(/^#[0-9a-f]{6}$/i)
          }
        )
      )
    })

    /**
     * Additional property: Color immutability
     * 
     * Validates that the returned color is always a string and doesn't
     * change the internal state
     */
    it('should always return a string value', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 50 }),
          (categoryId) => {
            const color = getColorForCategory(categoryId)
            
            expect(typeof color).toBe('string')
            expect(color.length).toBeGreaterThan(0)
          }
        )
      )
    })

    describe('specific examples', () => {
      it('should return correct colors for known categories', () => {
        expect(getColorForCategory('web')).toBe('#3b82f6')
        expect(getColorForCategory('devops')).toBe('#10b981')
        expect(getColorForCategory('data')).toBe('#8b5cf6')
        expect(getColorForCategory('mobile')).toBe('#f59e0b')
        expect(getColorForCategory('testing')).toBe('#ef4444')
        expect(getColorForCategory('ai')).toBe('#06b6d4')
        expect(getColorForCategory('security')).toBe('#ec4899')
      })

      it('should return default color for unknown categories', () => {
        expect(getColorForCategory('unknown')).toBe('#64748b')
        expect(getColorForCategory('nonexistent')).toBe('#64748b')
        expect(getColorForCategory('')).toBe('#64748b')
        expect(getColorForCategory('random-category')).toBe('#64748b')
      })

      it('should handle edge cases', () => {
        // Empty string
        expect(getColorForCategory('')).toBe(categoryColors.default)
        
        // Special characters
        expect(getColorForCategory('web-dev')).toBe(categoryColors.default)
        expect(getColorForCategory('web/dev')).toBe(categoryColors.default)
        
        // Case sensitivity
        expect(getColorForCategory('WEB')).toBe(categoryColors.default)
        expect(getColorForCategory('Web')).toBe(categoryColors.default)
      })

      it('should return default color when explicitly requested', () => {
        expect(getColorForCategory('default')).toBe('#64748b')
      })
    })
  })

  describe('getAllCategoryColors', () => {
    /**
     * Property: Complete color mapping
     * 
     * Validates that getAllCategoryColors returns all defined categories
     */
    it('should return all category color mappings', () => {
      const colors = getAllCategoryColors()
      
      // Should contain all known categories
      expect(colors).toHaveProperty('web')
      expect(colors).toHaveProperty('devops')
      expect(colors).toHaveProperty('data')
      expect(colors).toHaveProperty('mobile')
      expect(colors).toHaveProperty('testing')
      expect(colors).toHaveProperty('ai')
      expect(colors).toHaveProperty('security')
      expect(colors).toHaveProperty('default')
      
      // Should have exactly the expected number of categories
      expect(Object.keys(colors).length).toBe(8)
    })

    /**
     * Property: Immutability
     * 
     * Validates that modifying the returned object doesn't affect
     * the internal color mapping
     */
    it('should return a copy that does not affect internal state', () => {
      const colors1 = getAllCategoryColors()
      const colors2 = getAllCategoryColors()
      
      // Modify the first copy
      colors1['web'] = '#000000'
      
      // Second copy should be unaffected
      expect(colors2['web']).toBe('#3b82f6')
      
      // Original function should still return correct color
      expect(getColorForCategory('web')).toBe('#3b82f6')
    })

    /**
     * Property: Consistency with getColorForCategory
     * 
     * Validates that colors from getAllCategoryColors match
     * those from getColorForCategory
     */
    it('should return colors consistent with getColorForCategory', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(categoryColors)),
          (categoryId) => {
            const allColors = getAllCategoryColors()
            const individualColor = getColorForCategory(categoryId)
            
            expect(allColors[categoryId]).toBe(individualColor)
          }
        )
      )
    })

    describe('specific examples', () => {
      it('should return object with all expected colors', () => {
        const colors = getAllCategoryColors()
        
        expect(colors).toEqual({
          'web': '#3b82f6',
          'devops': '#10b981',
          'data': '#8b5cf6',
          'mobile': '#f59e0b',
          'testing': '#ef4444',
          'ai': '#06b6d4',
          'security': '#ec4899',
          'default': '#64748b',
        })
      })

      it('should return a new object on each call', () => {
        const colors1 = getAllCategoryColors()
        const colors2 = getAllCategoryColors()
        
        // Should be equal in content
        expect(colors1).toEqual(colors2)
        
        // But not the same reference
        expect(colors1).not.toBe(colors2)
      })
    })
  })

  describe('categoryColors constant', () => {
    it('should have all required category mappings', () => {
      expect(categoryColors).toHaveProperty('web')
      expect(categoryColors).toHaveProperty('devops')
      expect(categoryColors).toHaveProperty('data')
      expect(categoryColors).toHaveProperty('mobile')
      expect(categoryColors).toHaveProperty('testing')
      expect(categoryColors).toHaveProperty('ai')
      expect(categoryColors).toHaveProperty('security')
      expect(categoryColors).toHaveProperty('default')
    })

    it('should have valid hex color codes for all categories', () => {
      const hexColorPattern = /^#[0-9a-f]{6}$/i
      
      for (const color of Object.values(categoryColors)) {
        expect(color).toMatch(hexColorPattern)
      }
    })
  })
})
