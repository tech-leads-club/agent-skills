import { jest } from '@jest/globals'

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

  beforeEach(() => {
    jest.clearAllMocks()
    scanner = new InstalledSkillsScanner(mockLogger as any)
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
    // But local/global flags should be false (because not validly installed)
    expect(result['skill']?.local).toBe(false)
    expect(result['skill']?.global).toBe(false)
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
})
