import { jest } from '@jest/globals'
import type { CorePorts } from '@tech-leads-club/core'
import type { LoggingService } from '../../services/logging-service'

const mockLogger: Pick<LoggingService, 'debug' | 'warn'> = {
  debug: jest.fn(),
  warn: jest.fn(),
}

type LockedSkills = Record<string, { contentHash?: string; name: string; source: string; installedAt: string; updatedAt: string } | undefined>
const mockGetAllLockedSkills = jest.fn<() => Promise<LockedSkills>>()

jest.unstable_mockModule('@tech-leads-club/core', () =>
  import('@tech-leads-club/core').then((actual) => ({
    ...actual,
    getAllLockedSkills: mockGetAllLockedSkills,
  })),
)

const { SkillLockService } = await import('../../services/skill-lock-service')

const createMockPorts = (): CorePorts =>
  ({
    fs: {} as never,
    http: {} as never,
    shell: {} as never,
    env: {} as never,
    logger: {} as never,
    packageResolver: {} as never,
    paths: {} as never,
  }) as CorePorts

describe('SkillLockService', () => {
  let service: InstanceType<typeof SkillLockService>

  beforeEach(() => {
    jest.clearAllMocks()
    service = new SkillLockService(createMockPorts(), mockLogger as LoggingService)
  })

  it('returns hashes when lockfile is valid', async () => {
    mockGetAllLockedSkills
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        seo: { contentHash: 'abc123', name: 'seo', source: '', installedAt: '', updatedAt: '' },
      })

    const hashes = await service.getInstalledHashes()

    expect(hashes).toEqual({ seo: 'abc123' })
    expect(await service.getInstalledHash('seo')).toBe('abc123')
  })

  it('returns empty map when lockfile is missing', async () => {
    mockGetAllLockedSkills.mockResolvedValue({})

    const hashes = await service.getInstalledHashes()

    expect(hashes).toEqual({})
  })

  it('warns and returns empty map when lockfile read fails', async () => {
    mockGetAllLockedSkills.mockRejectedValue(new Error('ENOENT'))

    const hashes = await service.getInstalledHashes()

    expect(hashes).toEqual({})
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Unable to read skill lockfile'),
    )
  })

  it('gracefully handles missing contentHash entries', async () => {
    mockGetAllLockedSkills
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        seo: { name: 'seo', source: '', installedAt: '', updatedAt: '' },
      })

    const hashes = await service.getInstalledHashes()

    expect(hashes).toEqual({ seo: undefined })
  })
})
