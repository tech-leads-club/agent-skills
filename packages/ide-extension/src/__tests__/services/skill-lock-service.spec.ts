import { jest } from '@jest/globals'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { SkillLockService } from '../../services/skill-lock-service'

const mockLogger = {
  debug: jest.fn(),
  warn: jest.fn(),
}

describe('SkillLockService', () => {
  let service: SkillLockService
  let tempHomeDir: string
  let homedirSpy: jest.SpiedFunction<typeof os.homedir>

  beforeEach(async () => {
    jest.clearAllMocks()
    tempHomeDir = await mkdtemp(path.join(os.tmpdir(), 'skill-lock-service-'))
    homedirSpy = jest.spyOn(os, 'homedir').mockReturnValue(tempHomeDir)
    service = new SkillLockService(mockLogger as never)
  })

  afterEach(async () => {
    homedirSpy.mockRestore()
    await rm(tempHomeDir, { recursive: true, force: true })
  })

  const writeLockfile = async (content: string): Promise<void> => {
    const lockDir = path.join(tempHomeDir, '.agents')
    await mkdir(lockDir, { recursive: true })
    await writeFile(path.join(lockDir, '.skill-lock.json'), content, 'utf-8')
  }

  it('returns hashes when lockfile is valid', async () => {
    await writeLockfile(
      JSON.stringify({
        skills: {
          seo: { contentHash: 'abc123' },
        },
      }),
    )

    const hashes = await service.getInstalledHashes()

    expect(hashes).toEqual({ seo: 'abc123' })
    expect(await service.getInstalledHash('seo')).toBe('abc123')
  })

  it('returns empty map when lockfile is missing', async () => {
    const hashes = await service.getInstalledHashes()

    expect(hashes).toEqual({})
    expect(mockLogger.debug).toHaveBeenCalledWith(
      'Skill lockfile not found; returning empty hashes map',
    )
  })

  it('warns and returns empty map when lockfile is malformed', async () => {
    await writeLockfile('{invalid-json')

    const hashes = await service.getInstalledHashes()

    expect(hashes).toEqual({})
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Unable to read skill lockfile'),
    )
  })

  it('gracefully handles missing contentHash entries', async () => {
    await writeLockfile(
      JSON.stringify({
        skills: {
          seo: {},
        },
      }),
    )

    const hashes = await service.getInstalledHashes()

    expect(hashes).toEqual({ seo: undefined })
  })
})
