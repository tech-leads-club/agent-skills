import { jest } from '@jest/globals'
import type { LoggingService } from '../../services/logging-service'

// Mock fs/promises
const mockAccess = jest.fn<() => Promise<void>>()
jest.unstable_mockModule('node:fs/promises', () => ({
  access: mockAccess,
}))

// Mock logging
const mockLogger = { warn: jest.fn() }
jest.unstable_mockModule('../../services/logging-service', () => ({
  LoggingService: jest.fn(() => mockLogger),
}))

const { PostInstallVerifier } = await import('../../services/post-install-verifier')

describe('PostInstallVerifier', () => {
  let verifier: InstanceType<typeof PostInstallVerifier>

  beforeEach(() => {
    jest.clearAllMocks()
    verifier = new PostInstallVerifier(mockLogger as unknown as LoggingService)
  })

  it('should return ok if all checks pass', async () => {
    mockAccess.mockResolvedValue(undefined)

    const result = await verifier.verify('skill', ['cursor'], 'local', '/workspace')

    expect(result.ok).toBe(true)
    expect(result.corrupted).toHaveLength(0)
  })

  it('should detect missing SKILL.md', async () => {
    mockAccess.mockRejectedValue({ code: 'ENOENT' })

    const result = await verifier.verify('skill', ['cursor'], 'local', '/workspace')

    expect(result.ok).toBe(false)
    expect(result.corrupted).toHaveLength(1)
    expect(result.corrupted[0].agent).toBe('cursor')
  })

  it('should log warning but not fail for non-ENOENT errors', async () => {
    mockAccess.mockRejectedValue({ code: 'EACCES', message: 'denied' })

    const result = await verifier.verify('skill', ['cursor'], 'local', '/workspace')

    expect(result.ok).toBe(true) // Not marked as corrupted
    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Verification failed'))
  })
})
