import { jest } from '@jest/globals'
import * as fc from 'fast-check'

const mockMkdir = jest.fn<() => Promise<void>>()
const mockReadFile = jest.fn<(path: string, encoding: string) => Promise<string>>()
const mockWriteFile = jest.fn<(path: string, data: string, encoding: string) => Promise<void>>()
const mockUnlink = jest.fn<(path: string) => Promise<void>>()
const mockHomedir = jest.fn<() => string>()

jest.unstable_mockModule('node:fs/promises', () => ({
  mkdir: mockMkdir,
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  unlink: mockUnlink,
}))

jest.unstable_mockModule('node:os', () => ({
  homedir: mockHomedir,
}))

const { getCachedUpdate, isCacheValid } = await import('../update-cache')

describe('update-cache service - Property-Based Tests', () => {
  const mockHome = '/home/testuser'
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

  beforeEach(() => {
    jest.clearAllMocks()
    mockHomedir.mockReturnValue(mockHome)
  })

  /**
   * **Validates: Requirements 3.6.7**
   *
   * Property 14: Update cache TTL
   *
   * For any update check within 24 hours of a previous check, the cached result
   * should be used instead of making a new API call. This property validates that:
   * 1. Cache is valid when age < 24 hours
   * 2. Cache is invalid when age >= 24 hours
   * 3. The TTL boundary is correctly enforced
   */
  it('should respect 24-hour TTL for any cache age', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate cache ages from 0 to 48 hours (in milliseconds)
        fc.integer({ min: 0, max: 48 * 60 * 60 * 1000 }),
        // Generate random version strings
        fc.oneof(
          fc.constant(null),
          fc.string({ minLength: 5, maxLength: 10 }).map((s) => `1.${s.slice(0, 3)}.${s.slice(3, 6)}`),
        ),
        async (cacheAgeMs, version) => {
          // Setup: Create a cache with the specified age
          const lastUpdateCheck = Date.now() - cacheAgeMs
          const cacheData = {
            lastUpdateCheck,
            latestVersion: version,
          }

          mockReadFile.mockResolvedValue(JSON.stringify(cacheData))

          // Act: Check if cache is valid
          const isValid = await isCacheValid()

          // Assert: Cache should be valid only if age < 24 hours
          const expectedValid = cacheAgeMs < CACHE_TTL_MS

          expect(isValid).toBe(expectedValid)

          // Additional assertion: Verify the cache data is correctly retrieved
          const cachedUpdate = await getCachedUpdate()
          expect(cachedUpdate).toEqual(cacheData)
        },
      ),
      { numRuns: 500 },
    )
  })

  /**
   * Additional property: Cache validity boundary precision
   *
   * Validates that the TTL boundary is precise at the millisecond level
   */
  it('should have precise TTL boundary at 24 hours', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: -1000, max: 1000 }),
        fc.string({ minLength: 5, maxLength: 10 }).map((s) => `1.${s.slice(0, 3)}.${s.slice(3, 6)}`),
        async (offsetMs, version) => {
          // Use fake timers to ensure consistent Date.now() during test
          jest.useFakeTimers()
          const now = Date.now()
          jest.setSystemTime(now)

          // Setup: Create a cache exactly at the TTL boundary + offset
          const lastUpdateCheck = now - CACHE_TTL_MS - offsetMs
          const cacheData = { lastUpdateCheck, latestVersion: version }

          mockReadFile.mockResolvedValue(JSON.stringify(cacheData))

          // Act: Check if cache is valid
          const isValid = await isCacheValid()

          // Assert: Cache should be valid only if offset is negative (within TTL)
          const expectedValid = offsetMs < 0

          expect(isValid).toBe(expectedValid)

          // Restore real timers
          jest.useRealTimers()
        },
      ),
      { numRuns: 500 },
    )
  })

  it('should return consistent cache data across multiple reads within TTL', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate cache age within TTL
        fc.integer({ min: 0, max: CACHE_TTL_MS - 1000 }),
        fc.string({ minLength: 5, maxLength: 10 }).map((s) => `1.${s.slice(0, 3)}.${s.slice(3, 6)}`),
        // Generate number of reads (2-10)
        fc.integer({ min: 2, max: 10 }),
        async (cacheAgeMs, version, numReads) => {
          // Setup: Create a valid cache
          const lastUpdateCheck = Date.now() - cacheAgeMs
          const cacheData = {
            lastUpdateCheck,
            latestVersion: version,
          }

          mockReadFile.mockResolvedValue(JSON.stringify(cacheData))
          const results = await Promise.all(Array.from({ length: numReads }, () => getCachedUpdate()))

          for (const result of results) {
            expect(result).toEqual(cacheData)
          }

          const validityChecks = await Promise.all(Array.from({ length: numReads }, () => isCacheValid()))

          for (const isValid of validityChecks) {
            expect(isValid).toBe(true)
          }
        },
      ),
      { numRuns: 200 },
    )
  })

  it('should invalidate cache immediately after TTL expires', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate cache age just beyond TTL (24h + 1ms to 48h)
        fc.integer({ min: CACHE_TTL_MS + 1, max: 48 * 60 * 60 * 1000 }),
        fc.oneof(
          fc.constant(null),
          fc.string({ minLength: 5, maxLength: 10 }).map((s) => `1.${s.slice(0, 3)}.${s.slice(3, 6)}`),
        ),
        async (cacheAgeMs, version) => {
          // Setup: Create an expired cache
          const lastUpdateCheck = Date.now() - cacheAgeMs
          const cacheData = {
            lastUpdateCheck,
            latestVersion: version,
          }

          mockReadFile.mockResolvedValue(JSON.stringify(cacheData))

          // Act: Check if cache is valid
          const isValid = await isCacheValid()

          // Assert: Cache should always be invalid
          expect(isValid).toBe(false)

          // Additional assertion: Cache data should still be retrievable
          const cachedUpdate = await getCachedUpdate()
          expect(cachedUpdate).toEqual(cacheData)
        },
      ),
      { numRuns: 300 },
    )
  })

  it('should preserve version strings correctly regardless of TTL status', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 48 * 60 * 60 * 1000 }),
        fc.oneof(
          fc.constant(null),
          fc.string({ minLength: 5, maxLength: 20 }).map((s) => `${s.slice(0, 1)}.${s.slice(1, 4)}.${s.slice(4, 7)}`),
        ),
        async (cacheAgeMs, version) => {
          // Setup: Create cache with specific version
          const lastUpdateCheck = Date.now() - cacheAgeMs
          const cacheData = {
            lastUpdateCheck,
            latestVersion: version,
          }

          mockReadFile.mockResolvedValue(JSON.stringify(cacheData))

          // Act: Retrieve cached update
          const cachedUpdate = await getCachedUpdate()

          // Assert: Version should be preserved exactly
          expect(cachedUpdate?.latestVersion).toBe(version)
        },
      ),
      { numRuns: 300 },
    )
  })
})
