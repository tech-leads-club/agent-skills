import { join } from 'node:path'

import {
  categoryIdToFolderName,
  extractCategoryId,
  formatCategoryName,
  getCacheDir,
  isCategoryFolder,
  isPathSafe,
  sanitizeName,
} from './utils'

describe('sanitizeName', () => {
  it('removes unsafe filesystem characters and traversal prefixes', () => {
    expect(sanitizeName('../bad:/\\name')).toBe('badname')
  })

  it('falls back to a stable default when the input becomes empty', () => {
    expect(sanitizeName('...')).toBe('unnamed-skill')
  })

  it('trims surrounding whitespace', () => {
    expect(sanitizeName(' my-skill ')).toBe('my-skill')
  })

  it('limits the final value to 255 characters', () => {
    expect(sanitizeName('a'.repeat(300))).toHaveLength(255)
  })
})

describe('isPathSafe', () => {
  it('accepts paths inside the base directory', () => {
    expect(isPathSafe('/repo/.agents', '/repo/.agents/cursor/accessibility')).toBe(true)
  })

  it('accepts the base directory itself', () => {
    expect(isPathSafe('/repo/.agents', '/repo/.agents')).toBe(true)
  })

  it('rejects paths outside the base directory', () => {
    expect(isPathSafe('/repo/.agents', '/repo/other/accessibility')).toBe(false)
  })
})

describe('category helpers', () => {
  it('formats category names for display', () => {
    expect(formatCategoryName('core-migration')).toBe('Core Migration')
  })

  it('extracts ids from category folders', () => {
    expect(extractCategoryId('(frontend)')).toBe('frontend')
    expect(extractCategoryId('frontend')).toBeNull()
  })

  it('validates and creates category folder names', () => {
    expect(isCategoryFolder('(quality-tools)')).toBe(true)
    expect(isCategoryFolder('quality-tools')).toBe(false)
    expect(categoryIdToFolderName('quality-tools')).toBe('(quality-tools)')
  })
})

describe('getCacheDir', () => {
  it('builds the relative cache directory path', () => {
    expect(getCacheDir()).toBe(join('.cache', 'agent-skills'))
  })
})
