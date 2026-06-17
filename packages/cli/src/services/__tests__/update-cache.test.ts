import { jest } from '@jest/globals'
import { join } from 'node:path'

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

const { getCachedUpdate, setCachedUpdate, isCacheValid, clearCache } = await import('../update-cache')

describe('update-cache service', () => {
  const mockHome = '/home/testuser'
  const expectedCachePath = join(mockHome, '.agent-skills', 'cache.json')
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

  beforeEach(() => {
    jest.clearAllMocks()
    mockHomedir.mockReturnValue(mockHome)
  })

  describe('getCachedUpdate', () => {
    it('should return null when cache file does not exist', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT: no such file'))

      const cache = await getCachedUpdate()

      expect(cache).toBeNull()
    })

    it('should load and validate existing cache', async () => {
      const existingCache = {
        lastUpdateCheck: Date.now(),
        latestVersion: '1.2.3',
      }
      mockReadFile.mockResolvedValue(JSON.stringify(existingCache))

      const cache = await getCachedUpdate()

      expect(mockReadFile).toHaveBeenCalledWith(expectedCachePath, 'utf-8')
      expect(cache).toEqual(existingCache)
    })

    it('should return null when cache is invalid JSON', async () => {
      mockReadFile.mockResolvedValue('invalid json{')

      const cache = await getCachedUpdate()

      expect(cache).toBeNull()
    })

    it('should return null when cache is not an object', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify('string value'))

      const cache = await getCachedUpdate()

      expect(cache).toBeNull()
    })

    it('should return null when lastUpdateCheck is missing', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ latestVersion: '1.2.3' }))

      const cache = await getCachedUpdate()

      expect(cache).toBeNull()
    })

    it('should return null when lastUpdateCheck is not a number', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ lastUpdateCheck: 'not-a-number', latestVersion: '1.2.3' }))

      const cache = await getCachedUpdate()

      expect(cache).toBeNull()
    })

    it('should handle null latestVersion', async () => {
      const existingCache = {
        lastUpdateCheck: Date.now(),
        latestVersion: null,
      }
      mockReadFile.mockResolvedValue(JSON.stringify(existingCache))

      const cache = await getCachedUpdate()

      expect(cache).toEqual(existingCache)
    })
  })

  describe('setCachedUpdate', () => {
    it('should create directory and save cache with version', async () => {
      mockMkdir.mockResolvedValue(undefined)
      mockWriteFile.mockResolvedValue(undefined)

      const beforeTime = Date.now()
      await setCachedUpdate('1.2.3')
      const afterTime = Date.now()

      expect(mockMkdir).toHaveBeenCalledWith(join(mockHome, '.agent-skills'), { recursive: true })
      expect(mockWriteFile).toHaveBeenCalledTimes(1)

      const [path, data, encoding] = mockWriteFile.mock.calls[0] as [string, string, string]
      expect(path).toBe(expectedCachePath)
      expect(encoding).toBe('utf-8')

      const savedCache = JSON.parse(data)
      expect(savedCache.latestVersion).toBe('1.2.3')
      expect(savedCache.lastUpdateCheck).toBeGreaterThanOrEqual(beforeTime)
      expect(savedCache.lastUpdateCheck).toBeLessThanOrEqual(afterTime)
    })

    it('should save cache with null version', async () => {
      mockMkdir.mockResolvedValue(undefined)
      mockWriteFile.mockResolvedValue(undefined)

      await setCachedUpdate(null)

      const [, data] = mockWriteFile.mock.calls[0] as [string, string, string]
      const savedCache = JSON.parse(data)
      expect(savedCache.latestVersion).toBeNull()
    })
  })

  describe('isCacheValid', () => {
    it('should return false when cache does not exist', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'))

      const isValid = await isCacheValid()

      expect(isValid).toBe(false)
    })

    it('should return true when cache is within TTL', async () => {
      const recentTime = Date.now() - 1000 * 60 * 60 // 1 hour ago
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          lastUpdateCheck: recentTime,
          latestVersion: '1.2.3',
        }),
      )

      const isValid = await isCacheValid()

      expect(isValid).toBe(true)
    })

    it('should return false when cache is expired (older than 24 hours)', async () => {
      const oldTime = Date.now() - CACHE_TTL_MS - 1000 // 24 hours + 1 second ago
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          lastUpdateCheck: oldTime,
          latestVersion: '1.2.3',
        }),
      )

      const isValid = await isCacheValid()

      expect(isValid).toBe(false)
    })

    it('should return true when cache is exactly at TTL boundary', async () => {
      const boundaryTime = Date.now() - CACHE_TTL_MS + 1000 // Just under 24 hours
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          lastUpdateCheck: boundaryTime,
          latestVersion: '1.2.3',
        }),
      )

      const isValid = await isCacheValid()

      expect(isValid).toBe(true)
    })

    it('should return false when cache is invalid', async () => {
      mockReadFile.mockResolvedValue('invalid json')

      const isValid = await isCacheValid()

      expect(isValid).toBe(false)
    })
  })

  describe('clearCache', () => {
    it('should delete cache file', async () => {
      mockUnlink.mockResolvedValue(undefined)

      await clearCache()

      expect(mockUnlink).toHaveBeenCalledWith(expectedCachePath)
    })

    it('should silently fail when cache file does not exist', async () => {
      mockUnlink.mockRejectedValue(new Error('ENOENT'))

      await expect(clearCache()).resolves.not.toThrow()
    })

    it('should silently fail on other errors', async () => {
      mockUnlink.mockRejectedValue(new Error('Permission denied'))

      await expect(clearCache()).resolves.not.toThrow()
    })
  })
})
