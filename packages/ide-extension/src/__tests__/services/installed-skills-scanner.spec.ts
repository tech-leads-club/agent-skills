import { jest } from '@jest/globals'
import { createNodeAdapters } from '@tech-leads-club/core'
import type { LoggingService } from '../../services/logging-service'

// Mock fs/promises
const mockAccess = jest.fn<(path: string) => Promise<void>>()
jest.unstable_mockModule('node:fs/promises', () => ({
  access: mockAccess,
}))

// Mock logging
const mockLogger = { debug: jest.fn() }
jest.unstable_mockModule('../../services/logging-service', () => ({
  LoggingService: jest.fn(() => mockLogger),
}))

const { InstalledSkillsScanner } = await import('../../services/installed-skills-scanner')

describe('InstalledSkillsScanner', () => {
  let scanner: InstanceType<typeof InstalledSkillsScanner>
  const ports = createNodeAdapters()

  beforeEach(() => {
    jest.clearAllMocks()
    scanner = new InstalledSkillsScanner(ports, mockLogger as unknown as LoggingService)
  })

  it('should detect valid installation', async () => {
    // Simulate file exists
    mockAccess.mockResolvedValue(undefined)

    const result = await scanner.scan(
      [{ name: 'skill', category: 'cat', contentHash: '123', files: [], path: '', description: '' }],
      '/workspace',
    )

    expect(result['skill']).toBeDefined()
    expect(result['skill']?.local).toBe(true)
    expect(result['skill']?.global).toBe(true)
    expect(result['skill']?.agents[0].corrupted).toBe(false)
  })

  it('should detect corrupted installation (dir exists but SKILL.md missing)', async () => {
    mockAccess.mockImplementation(async (path: string) => {
      // Return success for directory checks
      if (!path.endsWith('SKILL.md')) return undefined
      // Throw ENOENT for SKILL.md checks
      throw { code: 'ENOENT' }
    })

    const result = await scanner.scan(
      [{ name: 'skill', category: 'cat', contentHash: '123', files: [], path: '', description: '' }],
      '/workspace',
    )

    // Agents should be listed (because dir exists)
    expect(result['skill']).not.toBeNull()
    // local/global should remain true (dir exists), while corrupted marks missing SKILL.md
    expect(result['skill']?.local).toBe(true)
    expect(result['skill']?.global).toBe(true)
    // And corrupted should be true
    expect(result['skill']?.agents.some((a) => a.corrupted)).toBe(true)
  })

  it('should skip non-installed skills', async () => {
    // Throw ENOENT for everything
    mockAccess.mockRejectedValue({ code: 'ENOENT' })

    const result = await scanner.scan(
      [{ name: 'skill', category: 'cat', contentHash: '123', files: [], path: '', description: '' }],
      '/workspace',
    )

    expect(result['skill']).toBeNull()
  })

  it(
    'should scan 100+ skills faster than serial baseline while preserving results',
    async () => {
      const skillCount = 120
      const registrySkills = Array.from({ length: skillCount }, (_, index) => ({
        name: `skill-${index}`,
        category: 'cat',
        contentHash: '123',
        files: [],
        path: '',
        description: '',
      }))

      mockAccess.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1))
      })

      const parallelStart = Date.now()
      const parallelResult = await scanner.scan(registrySkills, '/workspace')
      const parallelDurationMs = Date.now() - parallelStart

      const serialResult: Record<string, (typeof parallelResult)[string]> = {}
      const serialStart = Date.now()
      for (const skill of registrySkills) {
        const singleSkillResult = await scanner.scan([skill], '/workspace')
        serialResult[skill.name] = singleSkillResult[skill.name]
      }
      const serialDurationMs = Date.now() - serialStart

      expect(parallelResult).toEqual(serialResult)
      expect(parallelDurationMs).toBeLessThan(serialDurationMs * 0.5)
    },
    30000,
  )
})
