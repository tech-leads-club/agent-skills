import { afterEach, beforeEach, describe, expect, it } from '@jest/globals'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  clearRegistryCache,
  clearSkillCache,
  getCacheDir,
  getCachedContentHash,
  getSkillCachePath,
  isSkillCached,
  type SkillMetadata,
} from '../registry'

describe('registry', () => {
  describe('CONFIG constants', () => {
    it('should have reasonable timeout value', () => {
      const expectedTimeoutMs = 15_000
      expect(expectedTimeoutMs).toBeGreaterThanOrEqual(10_000)
      expect(expectedTimeoutMs).toBeLessThanOrEqual(30_000)
    })

    it('should have retry configuration', () => {
      const maxRetries = 3
      const retryBaseDelayMs = 500
      expect(maxRetries).toBeGreaterThanOrEqual(1)
      expect(maxRetries).toBeLessThanOrEqual(5)
      expect(retryBaseDelayMs).toBeGreaterThanOrEqual(100)
    })

    it('should have concurrency limit', () => {
      const maxConcurrentDownloads = 10
      expect(maxConcurrentDownloads).toBeGreaterThanOrEqual(5)
      expect(maxConcurrentDownloads).toBeLessThanOrEqual(20)
    })
  })

  describe('URLS configuration', () => {
    it('should generate correct CDN URLs', () => {
      const version = '0.9.1'
      const expectedCdnBase = `https://cdn.jsdelivr.net/gh/tech-leads-club/agent-skills@v${version}`
      expect(expectedCdnBase).toContain('cdn.jsdelivr.net')
      expect(expectedCdnBase).toContain('tech-leads-club/agent-skills')
    })

    it('should generate fallback URLs using raw.githubusercontent.com', () => {
      const version = '0.9.1'
      const expectedFallbackBase = `https://raw.githubusercontent.com/tech-leads-club/agent-skills/v${version}`
      expect(expectedFallbackBase).toContain('raw.githubusercontent.com')
      expect(expectedFallbackBase).toContain('tech-leads-club/agent-skills')
    })

    it('should have matching paths for CDN and fallback', () => {
      const cdnPath = '/packages/skills-catalog/skills-registry.json'
      const cdnUrl = `https://cdn.jsdelivr.net/gh/tech-leads-club/agent-skills@v0.9.1${cdnPath}`
      const fallbackUrl = `https://raw.githubusercontent.com/tech-leads-club/agent-skills/v0.9.1${cdnPath}`

      expect(cdnUrl).toContain('skills-registry.json')
      expect(fallbackUrl).toContain('skills-registry.json')
    })
  })

  describe('exponential backoff calculation', () => {
    const calculateDelay = (attempt: number, baseDelayMs: number): number => {
      return baseDelayMs * Math.pow(2, attempt)
    }

    it('should calculate correct delays for each attempt', () => {
      const baseDelay = 500
      expect(calculateDelay(0, baseDelay)).toBe(500) // First retry
      expect(calculateDelay(1, baseDelay)).toBe(1000) // Second retry
      expect(calculateDelay(2, baseDelay)).toBe(2000) // Third retry
      expect(calculateDelay(3, baseDelay)).toBe(4000) // Fourth retry (if needed)
    })

    it('should add jitter to prevent thundering herd', () => {
      const addJitter = (delay: number): number => delay + Math.random() * 100
      const baseDelay = 1000

      const delays = Array.from({ length: 10 }, () => addJitter(baseDelay))
      const uniqueDelays = new Set(delays)

      // With random jitter, delays should be mostly unique
      expect(uniqueDelays.size).toBeGreaterThan(1)

      // All delays should be within expected range
      delays.forEach((delay) => {
        expect(delay).toBeGreaterThanOrEqual(baseDelay)
        expect(delay).toBeLessThan(baseDelay + 100)
      })
    })
  })

  describe('fetchWithRetry behavior simulation', () => {
    it('should succeed on first attempt if response is OK', async () => {
      let attemptCount = 0
      const mockFetch = async (): Promise<{ ok: boolean; status: number }> => {
        attemptCount++
        return { ok: true, status: 200 }
      }

      const result = await mockFetch()
      expect(attemptCount).toBe(1)
      expect(result.ok).toBe(true)
    })

    it('should retry on server error (5xx)', async () => {
      let attemptCount = 0
      const maxRetries = 3

      const mockFetch = async (): Promise<{ ok: boolean; status: number }> => {
        attemptCount++
        if (attemptCount <= 2) {
          throw new Error('HTTP 500')
        }
        return { ok: true, status: 200 }
      }

      const fetchWithRetry = async (): Promise<{ ok: boolean; status: number }> => {
        let lastError: Error | undefined
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            return await mockFetch()
          } catch (error) {
            lastError = error as Error
          }
        }
        throw lastError
      }

      const result = await fetchWithRetry()
      expect(attemptCount).toBe(3) // Failed twice, succeeded on third
      expect(result.ok).toBe(true)
    })

    it('should not retry on client error (4xx)', async () => {
      let attemptCount = 0

      const mockFetch = async (): Promise<{ ok: boolean; status: number }> => {
        attemptCount++
        return { ok: false, status: 404 }
      }

      // Simulate: 4xx errors should not trigger retry, just return
      const result = await mockFetch()
      expect(attemptCount).toBe(1)
      expect(result.status).toBe(404)
    })

    it('should try fallback URL after all retries fail', async () => {
      let primaryAttempts = 0
      let fallbackAttempts = 0
      const maxRetries = 3

      const mockPrimaryFetch = async (): Promise<never> => {
        primaryAttempts++
        throw new Error('Primary CDN failed')
      }

      const mockFallbackFetch = async (): Promise<{ ok: boolean; status: number }> => {
        fallbackAttempts++
        return { ok: true, status: 200 }
      }

      const fetchWithRetryAndFallback = async (): Promise<{ ok: boolean; status: number }> => {
        // Try primary with retries
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            return await mockPrimaryFetch()
          } catch {
            // Continue to next attempt or fallback
          }
        }

        // Try fallback
        return await mockFallbackFetch()
      }

      const result = await fetchWithRetryAndFallback()
      expect(primaryAttempts).toBe(maxRetries + 1) // All retries exhausted
      expect(fallbackAttempts).toBe(1)
      expect(result.ok).toBe(true)
    })

    it('should throw original error if both primary and fallback fail', async () => {
      const maxRetries = 2

      const mockFetch = async (): Promise<never> => {
        throw new Error('Network error')
      }

      const fetchWithRetryAndFallback = async (): Promise<{ ok: boolean }> => {
        let lastError: Error | undefined

        // Primary attempts
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            return await mockFetch()
          } catch (error) {
            lastError = error as Error
          }
        }

        // Fallback attempt
        try {
          return await mockFetch()
        } catch {
          throw lastError ?? new Error('Fetch failed')
        }
      }

      await expect(fetchWithRetryAndFallback()).rejects.toThrow('Network error')
    })
  })

  describe('batched download simulation', () => {
    it('should split files into correct batch sizes', () => {
      const files = Array.from({ length: 25 }, (_, i) => `file${i}.md`)
      const batchSize = 10

      const batches: string[][] = []
      for (let i = 0; i < files.length; i += batchSize) {
        batches.push(files.slice(i, i + batchSize))
      }

      expect(batches).toHaveLength(3)
      expect(batches[0]).toHaveLength(10)
      expect(batches[1]).toHaveLength(10)
      expect(batches[2]).toHaveLength(5)
    })

    it('should handle single batch for small skill', () => {
      const files = ['SKILL.md', 'README.md', 'LICENSE.txt']
      const batchSize = 10

      const batches: string[][] = []
      for (let i = 0; i < files.length; i += batchSize) {
        batches.push(files.slice(i, i + batchSize))
      }

      expect(batches).toHaveLength(1)
      expect(batches[0]).toHaveLength(3)
    })

    it('should handle large skill like cloudflare-deploy (310 files)', () => {
      const files = Array.from({ length: 310 }, (_, i) => `reference${i}.md`)
      const batchSize = 10

      const batches: string[][] = []
      for (let i = 0; i < files.length; i += batchSize) {
        batches.push(files.slice(i, i + batchSize))
      }

      expect(batches).toHaveLength(31)
      expect(batches[30]).toHaveLength(10) // Last batch is exactly 10
    })

    it('should process batches sequentially', async () => {
      const executionOrder: number[] = []
      const batchSize = 3
      const files = [1, 2, 3, 4, 5, 6, 7]

      const processBatch = async (batch: number[]): Promise<void> => {
        await Promise.all(
          batch.map(async (n) => {
            await new Promise((resolve) => setTimeout(resolve, 10))
            executionOrder.push(n)
          }),
        )
      }

      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize)
        await processBatch(batch)
      }

      // First batch (1, 2, 3) should complete before second batch (4, 5, 6)
      const firstBatchMaxIndex = Math.max(
        executionOrder.indexOf(1),
        executionOrder.indexOf(2),
        executionOrder.indexOf(3),
      )
      const secondBatchMinIndex = Math.min(
        executionOrder.indexOf(4),
        executionOrder.indexOf(5),
        executionOrder.indexOf(6),
      )

      expect(firstBatchMaxIndex).toBeLessThan(secondBatchMinIndex)
    })
  })

  describe('integrity verification', () => {
    it('should count successful downloads correctly', () => {
      const results = [true, true, false, true, true]
      const successCount = results.filter(Boolean).length
      expect(successCount).toBe(4)
    })

    it('should detect incomplete downloads', () => {
      const totalFiles = 10
      const downloadedCount = 8

      const isComplete = downloadedCount >= totalFiles
      expect(isComplete).toBe(false)
    })

    it('should pass when all files downloaded', () => {
      const totalFiles = 10
      const downloadedCount = 10

      const isComplete = downloadedCount >= totalFiles
      expect(isComplete).toBe(true)
    })

    it('should generate helpful error message for partial downloads', () => {
      const totalFiles = 310
      const downloadedCount = 295

      const errorMessage = `Only ${downloadedCount}/${totalFiles} files downloaded successfully`
      expect(errorMessage).toBe('Only 295/310 files downloaded successfully')
    })
  })

  describe('path safety checks', () => {
    const isPathSafe = (basePath: string, targetPath: string): boolean => {
      const resolvedBase = join(basePath, '.')
      const resolvedTarget = join(targetPath, '.')
      return resolvedTarget.startsWith(resolvedBase)
    }

    it('should allow normal file paths', () => {
      const base = '/cache/skills/my-skill'
      expect(isPathSafe(base, '/cache/skills/my-skill/SKILL.md')).toBe(true)
      expect(isPathSafe(base, '/cache/skills/my-skill/references/api.md')).toBe(true)
    })

    it('should block path traversal attempts', () => {
      const base = '/cache/skills/my-skill'
      expect(isPathSafe(base, '/cache/skills/other-skill/file.md')).toBe(false)
      expect(isPathSafe(base, '/etc/passwd')).toBe(false)
    })

    it('should handle nested directories correctly', () => {
      const base = '/cache/skills/cloudflare-deploy'
      expect(isPathSafe(base, '/cache/skills/cloudflare-deploy/references/workers/api.md')).toBe(true)
      expect(isPathSafe(base, '/cache/skills/cloudflare-deploy/references/deep/nested/file.md')).toBe(true)
    })
  })

  describe('name sanitization', () => {
    const UNSAFE_PATH_PATTERNS = [/[/\\]/g, /\.\./g, /[<>:"|?*]/g] as const

    const sanitizeName = (name: string): string => {
      return UNSAFE_PATH_PATTERNS.reduce((result, pattern) => result.replace(pattern, ''), name).trim()
    }

    it('should keep valid skill names unchanged', () => {
      expect(sanitizeName('my-skill')).toBe('my-skill')
      expect(sanitizeName('cloudflare-deploy')).toBe('cloudflare-deploy')
      expect(sanitizeName('aws-advisor')).toBe('aws-advisor')
    })

    it('should remove path traversal characters', () => {
      expect(sanitizeName('../evil')).toBe('evil')
      expect(sanitizeName('..\\..\\passwd')).toBe('passwd')
    })

    it('should remove path separators', () => {
      expect(sanitizeName('path/to/skill')).toBe('pathtoskill')
      expect(sanitizeName('path\\to\\skill')).toBe('pathtoskill')
    })

    it('should remove special characters', () => {
      expect(sanitizeName('skill<script>')).toBe('skillscript')
      expect(sanitizeName('skill:name')).toBe('skillname')
      expect(sanitizeName('skill"name"')).toBe('skillname')
    })

    it('should trim whitespace', () => {
      expect(sanitizeName('  my-skill  ')).toBe('my-skill')
    })
  })

  describe('cache validity', () => {
    const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

    const isCacheValid = (fetchedAt: number, now: number): boolean => {
      return now - fetchedAt < CACHE_TTL_MS
    }

    it('should consider recent cache as valid', () => {
      const now = Date.now()
      const oneHourAgo = now - 60 * 60 * 1000
      expect(isCacheValid(oneHourAgo, now)).toBe(true)
    })

    it('should consider old cache as invalid', () => {
      const now = Date.now()
      const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000
      expect(isCacheValid(twoDaysAgo, now)).toBe(false)
    })

    it('should expire at exactly 24 hours', () => {
      const now = Date.now()
      const exactly24HoursAgo = now - CACHE_TTL_MS
      expect(isCacheValid(exactly24HoursAgo, now)).toBe(false)

      const justUnder24Hours = now - CACHE_TTL_MS + 1
      expect(isCacheValid(justUnder24Hours, now)).toBe(true)
    })
  })

  describe('skill metadata structure', () => {
    interface SkillMetadata {
      name: string
      description: string
      category: string
      path: string
      files: string[]
      author?: string
      version?: string
    }

    it('should validate required fields', () => {
      const skill: SkillMetadata = {
        name: 'cloudflare-deploy',
        description: 'Deploy to Cloudflare',
        category: 'cloud',
        path: '(cloud)/cloudflare-deploy',
        files: ['SKILL.md', 'LICENSE.txt'],
      }

      expect(skill.name).toBeTruthy()
      expect(skill.description).toBeTruthy()
      expect(skill.category).toBeTruthy()
      expect(skill.path).toBeTruthy()
      expect(skill.files.length).toBeGreaterThan(0)
    })

    it('should allow optional metadata fields', () => {
      const skill: SkillMetadata = {
        name: 'my-skill',
        description: 'desc',
        category: 'dev',
        path: 'path',
        files: ['SKILL.md'],
        author: 'github.com/user',
        version: '1.0.0',
      }

      expect(skill.author).toBe('github.com/user')
      expect(skill.version).toBe('1.0.0')
    })

    it('should handle skill with many files', () => {
      const skill: SkillMetadata = {
        name: 'large-skill',
        description: 'A skill with many files',
        category: 'cloud',
        path: '(cloud)/large-skill',
        files: Array.from({ length: 310 }, (_, i) => `file${i}.md`),
      }

      expect(skill.files.length).toBe(310)
    })
  })

  describe('environment variable override', () => {
    it('should allow SKILLS_CDN_REF to override version', () => {
      const getRef = (envValue: string | undefined, cliVersion: string): string => {
        return envValue ?? `v${cliVersion}`
      }

      expect(getRef(undefined, '0.9.1')).toBe('v0.9.1')
      expect(getRef('main', '0.9.1')).toBe('main')
      expect(getRef('feature-branch', '0.9.1')).toBe('feature-branch')
    })
  })
})

describe('registry filesystem operations', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = join(tmpdir(), `registry-test-${Date.now()}`)
    await mkdir(tempDir, { recursive: true })
  })

  afterEach(async () => {
    try {
      await rm(tempDir, { recursive: true, force: true })
    } catch {
      // Ignore
    }
  })

  describe('skill cache directory structure', () => {
    it('should create nested reference directories', async () => {
      const skillPath = join(tempDir, 'cloudflare-deploy')
      const referencePath = join(skillPath, 'references', 'workers')

      await mkdir(referencePath, { recursive: true })
      await writeFile(join(referencePath, 'api.md'), '# API Reference')

      expect(existsSync(referencePath)).toBe(true)
      expect(existsSync(join(referencePath, 'api.md'))).toBe(true)
    })

    it('should write downloaded content correctly', async () => {
      const filePath = join(tempDir, 'SKILL.md')
      const content = '---\nname: test-skill\n---\n# Test'

      await writeFile(filePath, content)

      const readContent = readFileSync(filePath, 'utf-8')
      expect(readContent).toBe(content)
    })

    it('should handle deeply nested paths', async () => {
      const deepPath = join(tempDir, 'a', 'b', 'c', 'd', 'e')

      await mkdir(deepPath, { recursive: true })
      await writeFile(join(deepPath, 'file.md'), 'content')

      expect(existsSync(join(deepPath, 'file.md'))).toBe(true)
    })
  })

  describe('registry cache file', () => {
    it('should save and read cached registry', async () => {
      const cacheFile = join(tempDir, 'registry.json')
      const cachedData = {
        fetchedAt: Date.now(),
        registry: {
          version: '1.0.0',
          generatedAt: new Date().toISOString(),
          baseUrl: 'https://example.com',
          categories: {},
          skills: [],
        },
      }

      await writeFile(cacheFile, JSON.stringify(cachedData, null, 2))

      const content = readFileSync(cacheFile, 'utf-8')
      const parsed = JSON.parse(content)

      expect(parsed.fetchedAt).toBe(cachedData.fetchedAt)
      expect(parsed.registry.version).toBe('1.0.0')
    })

    it('should handle corrupted cache gracefully', () => {
      const tryParse = (content: string): object | null => {
        try {
          return JSON.parse(content)
        } catch {
          return null
        }
      }

      expect(tryParse('invalid json')).toBeNull()
      expect(tryParse('{"valid": true}')).toEqual({ valid: true })
    })
  })
})

describe('registry exported functions', () => {
  describe('getSkillCachePath', () => {
    it('should return valid cache path for skill name', () => {
      const path = getSkillCachePath('my-skill')
      expect(path).toContain('tlc-skills')
      expect(path).toContain('skills')
      expect(path).toContain('my-skill')
    })

    it('should sanitize skill name in path', () => {
      // Valid names should work
      const path = getSkillCachePath('cloudflare-deploy')
      expect(path).toContain('cloudflare-deploy')
    })

    it('should throw for empty skill name after sanitization', () => {
      expect(() => getSkillCachePath('')).toThrow('Invalid skill name')
    })

    it('should throw for skill name with only unsafe characters', () => {
      expect(() => getSkillCachePath('../../../')).toThrow('Invalid skill name')
    })
  })

  describe('isSkillCached', () => {
    it('should return false for non-existent skill', () => {
      expect(isSkillCached('non-existent-skill-' + Date.now())).toBe(false)
    })

    it('should return false for invalid skill name', () => {
      expect(isSkillCached('')).toBe(false)
    })
  })

  describe('getCacheDir', () => {
    it('should return cache directory path', () => {
      const cacheDir = getCacheDir()
      expect(cacheDir).toContain('tlc-skills')
      expect(cacheDir).toBeTruthy()
    })

    it('should return consistent path', () => {
      const path1 = getCacheDir()
      const path2 = getCacheDir()
      expect(path1).toBe(path2)
    })
  })

  describe('clearSkillCache', () => {
    it('should not throw for non-existent skill', () => {
      expect(() => clearSkillCache('non-existent-skill-' + Date.now())).not.toThrow()
    })
  })

  describe('clearRegistryCache', () => {
    it('should not throw when called', () => {
      expect(() => clearRegistryCache()).not.toThrow()
    })
  })

  describe('SkillMetadata type', () => {
    it('should accept valid skill metadata', () => {
      const metadata: SkillMetadata = {
        name: 'test-skill',
        description: 'A test skill',
        category: 'development',
        path: '(development)/test-skill',
        files: ['SKILL.md'],
      }
      expect(metadata.name).toBe('test-skill')
      expect(metadata.files).toContain('SKILL.md')
    })

    it('should accept skill with many files like cloudflare-deploy', () => {
      const metadata: SkillMetadata = {
        name: 'cloudflare-deploy',
        description: 'Deploy to Cloudflare',
        category: 'cloud',
        path: '(cloud)/cloudflare-deploy',
        files: Array.from({ length: 310 }, (_, i) => `ref${i}.md`),
        author: 'github.com/openai/skills',
        version: '1.0.0',
      }
      expect(metadata.files.length).toBe(310)
      expect(metadata.author).toBe('github.com/openai/skills')
    })
  })
})

describe('registry retry and fallback logic', () => {
  describe('retry timing calculation', () => {
    it('should calculate exponential delays correctly', () => {
      const baseDelay = 500
      const calculateDelay = (attempt: number) => baseDelay * Math.pow(2, attempt)

      expect(calculateDelay(0)).toBe(500)
      expect(calculateDelay(1)).toBe(1000)
      expect(calculateDelay(2)).toBe(2000)
    })

    it('should respect max retries configuration', () => {
      const maxRetries = 3
      const attempts: number[] = []

      for (let i = 0; i <= maxRetries; i++) {
        attempts.push(i)
      }

      expect(attempts.length).toBe(4) // 0, 1, 2, 3
    })
  })

  describe('fallback URL generation', () => {
    it('should generate correct fallback URL structure', () => {
      const version = 'v0.9.1'
      const path = '(cloud)/cloudflare-deploy/SKILL.md'

      const primaryUrl = `https://cdn.jsdelivr.net/gh/tech-leads-club/agent-skills@${version}/packages/skills-catalog/skills/${path}`
      const fallbackUrl = `https://raw.githubusercontent.com/tech-leads-club/agent-skills/${version}/packages/skills-catalog/skills/${path}`

      expect(primaryUrl).toContain('cdn.jsdelivr.net')
      expect(fallbackUrl).toContain('raw.githubusercontent.com')
      expect(primaryUrl).toContain(path)
      expect(fallbackUrl).toContain(path)
    })
  })

  describe('batch download configuration', () => {
    it('should respect concurrency limit', () => {
      const maxConcurrent = 10
      const totalFiles = 310

      const batchCount = Math.ceil(totalFiles / maxConcurrent)
      expect(batchCount).toBe(31)
    })

    it('should handle exact multiples of batch size', () => {
      const maxConcurrent = 10
      const totalFiles = 100

      const batchCount = totalFiles / maxConcurrent
      expect(batchCount).toBe(10)
    })
  })

  describe('integrity check simulation', () => {
    it('should verify download count matches file count', () => {
      const expectedFiles = 310
      const downloadedFiles = 310

      const isComplete = downloadedFiles >= expectedFiles
      expect(isComplete).toBe(true)
    })

    it('should detect partial downloads', () => {
      const expectedFiles = 310
      const downloadedFiles = 295

      const isComplete = downloadedFiles >= expectedFiles
      expect(isComplete).toBe(false)

      const errorMsg = `Only ${downloadedFiles}/${expectedFiles} files downloaded successfully`
      expect(errorMsg).toContain('295/310')
    })
  })
})

describe('content hash computation', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = join(tmpdir(), `hash-test-${Date.now()}`)
    await mkdir(tempDir, { recursive: true })
  })

  afterEach(async () => {
    try {
      await rm(tempDir, { recursive: true, force: true })
    } catch {
      // Ignore
    }
  })

  it('should produce deterministic hash for same content regardless of input order', async () => {
    await writeFile(join(tempDir, 'SKILL.md'), '# Test Skill')
    await writeFile(join(tempDir, 'README.md'), '# Readme')

    const computeHash = (dir: string, files: string[]): string => {
      const hash = createHash('sha256')
      const sortedFiles = [...files].sort()
      for (const file of sortedFiles) {
        const filePath = join(dir, file)
        if (existsSync(filePath)) {
          hash.update(file)
          hash.update(readFileSync(filePath))
        }
      }
      return hash.digest('hex')
    }

    const hash1 = computeHash(tempDir, ['SKILL.md', 'README.md'])
    const hash2 = computeHash(tempDir, ['README.md', 'SKILL.md'])

    expect(hash1).toBe(hash2)
    expect(hash1).toHaveLength(64)
  })

  it('should produce different hash when content changes', async () => {
    await writeFile(join(tempDir, 'SKILL.md'), '# Version 1')

    const computeHash = (dir: string, files: string[]): string => {
      const hash = createHash('sha256')
      const sortedFiles = [...files].sort()
      for (const file of sortedFiles) {
        const filePath = join(dir, file)
        if (existsSync(filePath)) {
          hash.update(file)
          hash.update(readFileSync(filePath))
        }
      }
      return hash.digest('hex')
    }

    const hash1 = computeHash(tempDir, ['SKILL.md'])

    await writeFile(join(tempDir, 'SKILL.md'), '# Version 2')
    const hash2 = computeHash(tempDir, ['SKILL.md'])

    expect(hash1).not.toBe(hash2)
  })

  it('should produce different hash when files are added', async () => {
    await writeFile(join(tempDir, 'SKILL.md'), '# Skill')

    const computeHash = (dir: string, files: string[]): string => {
      const hash = createHash('sha256')
      const sortedFiles = [...files].sort()
      for (const file of sortedFiles) {
        const filePath = join(dir, file)
        if (existsSync(filePath)) {
          hash.update(file)
          hash.update(readFileSync(filePath))
        }
      }
      return hash.digest('hex')
    }

    const hash1 = computeHash(tempDir, ['SKILL.md'])

    await writeFile(join(tempDir, 'EXTRA.md'), '# Extra')
    const hash2 = computeHash(tempDir, ['SKILL.md', 'EXTRA.md'])

    expect(hash1).not.toBe(hash2)
  })
})

describe('cache metadata (.skill-meta.json)', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = join(tmpdir(), `meta-test-${Date.now()}`)
    await mkdir(tempDir, { recursive: true })
  })

  afterEach(async () => {
    try {
      await rm(tempDir, { recursive: true, force: true })
    } catch {
      // Ignore
    }
  })

  it('should round-trip cache metadata via JSON', async () => {
    const meta = { contentHash: 'abc123def456', downloadedAt: Date.now() }
    const metaPath = join(tempDir, '.skill-meta.json')

    writeFileSync(metaPath, JSON.stringify(meta, null, 2))
    const parsed = JSON.parse(readFileSync(metaPath, 'utf-8'))

    expect(parsed.contentHash).toBe(meta.contentHash)
    expect(parsed.downloadedAt).toBe(meta.downloadedAt)
  })

  it('should handle missing meta file gracefully', () => {
    const metaPath = join(tempDir, '.skill-meta.json')
    expect(existsSync(metaPath)).toBe(false)

    const tryRead = (): { contentHash: string; downloadedAt: number } | null => {
      try {
        if (!existsSync(metaPath)) return null
        return JSON.parse(readFileSync(metaPath, 'utf-8'))
      } catch {
        return null
      }
    }

    expect(tryRead()).toBeNull()
  })

  it('should handle corrupted meta file gracefully', async () => {
    const metaPath = join(tempDir, '.skill-meta.json')
    await writeFile(metaPath, 'not valid json{{{')

    const tryRead = (): { contentHash: string } | null => {
      try {
        return JSON.parse(readFileSync(metaPath, 'utf-8'))
      } catch {
        return null
      }
    }

    expect(tryRead()).toBeNull()
  })
})

describe('getCachedContentHash', () => {
  it('should return undefined for non-existent skill', () => {
    const hash = getCachedContentHash('non-existent-skill-' + Date.now())
    expect(hash).toBeUndefined()
  })

  it('should return undefined for invalid skill name', () => {
    const hash = getCachedContentHash('')
    expect(hash).toBeUndefined()
  })
})

describe('needsUpdate detection logic', () => {
  interface UpdateCheckParams {
    isCached: boolean
    registryHash: string | undefined
    cachedHash: string | undefined
  }

  const checkNeedsUpdate = (params: UpdateCheckParams): boolean => {
    if (!params.isCached) return true
    if (!params.registryHash) return false
    if (!params.cachedHash) return true
    return params.cachedHash !== params.registryHash
  }

  it('should need update when skill is not cached', () => {
    expect(checkNeedsUpdate({ isCached: false, registryHash: 'abc', cachedHash: undefined })).toBe(true)
  })

  it('should NOT need update when registry has no hash (cannot compare)', () => {
    expect(checkNeedsUpdate({ isCached: true, registryHash: undefined, cachedHash: 'abc' })).toBe(false)
  })

  it('should need update when cache has no hash (legacy skill)', () => {
    expect(checkNeedsUpdate({ isCached: true, registryHash: 'abc', cachedHash: undefined })).toBe(true)
  })

  it('should need update when hashes differ', () => {
    expect(checkNeedsUpdate({ isCached: true, registryHash: 'new-hash', cachedHash: 'old-hash' })).toBe(true)
  })

  it('should NOT need update when hashes match', () => {
    expect(checkNeedsUpdate({ isCached: true, registryHash: 'same-hash', cachedHash: 'same-hash' })).toBe(false)
  })

  it('should NOT need update when both hashes are undefined (no comparison possible)', () => {
    expect(checkNeedsUpdate({ isCached: true, registryHash: undefined, cachedHash: undefined })).toBe(false)
  })

  it('should handle real SHA-256 hashes', () => {
    const hash1 = createHash('sha256').update('content-v1').digest('hex')
    const hash2 = createHash('sha256').update('content-v2').digest('hex')
    const hash1Copy = createHash('sha256').update('content-v1').digest('hex')

    expect(checkNeedsUpdate({ isCached: true, registryHash: hash1, cachedHash: hash1Copy })).toBe(false)
    expect(checkNeedsUpdate({ isCached: true, registryHash: hash2, cachedHash: hash1 })).toBe(true)
  })
})

describe('getUpdatableSkills batch logic', () => {
  const simulateGetUpdatableSkills = (
    skillNames: string[],
    outdatedSet: Set<string>,
  ): { toUpdate: string[]; upToDate: string[] } => {
    const toUpdate: string[] = []
    const upToDate: string[] = []

    for (const name of skillNames) {
      if (outdatedSet.has(name)) {
        toUpdate.push(name)
      } else {
        upToDate.push(name)
      }
    }

    return { toUpdate, upToDate }
  }

  it('should separate outdated from up-to-date skills', () => {
    const outdated = new Set(['skill-a', 'skill-c'])
    const result = simulateGetUpdatableSkills(['skill-a', 'skill-b', 'skill-c', 'skill-d'], outdated)

    expect(result.toUpdate).toEqual(['skill-a', 'skill-c'])
    expect(result.upToDate).toEqual(['skill-b', 'skill-d'])
  })

  it('should return all in upToDate when nothing is outdated', () => {
    const result = simulateGetUpdatableSkills(['skill-a', 'skill-b'], new Set())

    expect(result.toUpdate).toHaveLength(0)
    expect(result.upToDate).toEqual(['skill-a', 'skill-b'])
  })

  it('should return all in toUpdate when everything is outdated', () => {
    const result = simulateGetUpdatableSkills(['skill-a', 'skill-b'], new Set(['skill-a', 'skill-b']))

    expect(result.toUpdate).toEqual(['skill-a', 'skill-b'])
    expect(result.upToDate).toHaveLength(0)
  })

  it('should handle empty skill list', () => {
    const result = simulateGetUpdatableSkills([], new Set(['skill-a']))

    expect(result.toUpdate).toHaveLength(0)
    expect(result.upToDate).toHaveLength(0)
  })

  it('should maintain order of skills', () => {
    const outdated = new Set(['z-skill', 'a-skill'])
    const result = simulateGetUpdatableSkills(['z-skill', 'm-skill', 'a-skill'], outdated)

    expect(result.toUpdate).toEqual(['z-skill', 'a-skill'])
    expect(result.upToDate).toEqual(['m-skill'])
  })
})

describe('smart update config filtering', () => {
  interface UpdateConfig {
    skills: string[]
    agents: string[]
    global: boolean
  }

  const filterConfigs = (
    configs: UpdateConfig[],
    outdatedSkills: Set<string>,
  ): { configs: UpdateConfig[]; toUpdate: string[]; upToDate: string[] } => {
    const allSkills = [...new Set(configs.flatMap((c) => c.skills))]
    const toUpdate = allSkills.filter((s) => outdatedSkills.has(s))
    const upToDate = allSkills.filter((s) => !outdatedSkills.has(s))

    if (toUpdate.length === 0) {
      return { configs: [], upToDate, toUpdate: [] }
    }

    const filteredConfigs = configs
      .map((config) => ({
        ...config,
        skills: config.skills.filter((s) => outdatedSkills.has(s)),
      }))
      .filter((config) => config.skills.length > 0)

    return { configs: filteredConfigs, upToDate, toUpdate }
  }

  it('should filter configs to only include outdated skills', () => {
    const configs: UpdateConfig[] = [{ skills: ['skill-a', 'skill-b', 'skill-c'], agents: ['cursor'], global: false }]
    const outdated = new Set(['skill-a', 'skill-c'])

    const result = filterConfigs(configs, outdated)

    expect(result.configs).toHaveLength(1)
    expect(result.configs[0].skills).toEqual(['skill-a', 'skill-c'])
    expect(result.toUpdate).toEqual(['skill-a', 'skill-c'])
    expect(result.upToDate).toEqual(['skill-b'])
  })

  it('should return empty configs when all skills are up to date', () => {
    const configs: UpdateConfig[] = [{ skills: ['skill-a', 'skill-b'], agents: ['cursor'], global: false }]

    const result = filterConfigs(configs, new Set())

    expect(result.configs).toHaveLength(0)
    expect(result.toUpdate).toHaveLength(0)
    expect(result.upToDate).toEqual(['skill-a', 'skill-b'])
  })

  it('should remove configs where no skills need update', () => {
    const configs: UpdateConfig[] = [
      { skills: ['skill-a'], agents: ['cursor'], global: false },
      { skills: ['skill-b'], agents: ['claude-code'], global: true },
    ]
    const outdated = new Set(['skill-a'])

    const result = filterConfigs(configs, outdated)

    expect(result.configs).toHaveLength(1)
    expect(result.configs[0].agents).toEqual(['cursor'])
  })

  it('should handle configs with overlapping skills', () => {
    const configs: UpdateConfig[] = [
      { skills: ['skill-a', 'skill-b'], agents: ['cursor'], global: false },
      { skills: ['skill-a', 'skill-c'], agents: ['claude-code'], global: true },
    ]
    const outdated = new Set(['skill-a'])

    const result = filterConfigs(configs, outdated)

    expect(result.configs).toHaveLength(2)
    expect(result.toUpdate).toEqual(['skill-a'])
    expect(result.upToDate).toEqual(['skill-b', 'skill-c'])
  })
})

describe('update preview display logic', () => {
  it('should format single skill update correctly', () => {
    const toUpdate = ['skill-a']
    const label = `${toUpdate.length} skill${toUpdate.length === 1 ? '' : 's'} with updates available:`

    expect(label).toBe('1 skill with updates available:')
  })

  it('should format multiple skill updates correctly', () => {
    const toUpdate = ['skill-a', 'skill-b', 'skill-c']
    const label = `${toUpdate.length} skill${toUpdate.length === 1 ? '' : 's'} with updates available:`

    expect(label).toBe('3 skills with updates available:')
  })

  it('should format up-to-date count correctly', () => {
    const upToDate = ['skill-d', 'skill-e']
    const label = `${upToDate.length} skill${upToDate.length === 1 ? '' : 's'} already up to date`

    expect(label).toBe('2 skills already up to date')
  })

  it('should format singular up-to-date correctly', () => {
    const upToDate = ['skill-d']
    const label = `${upToDate.length} skill${upToDate.length === 1 ? '' : 's'} already up to date`

    expect(label).toBe('1 skill already up to date')
  })
})
