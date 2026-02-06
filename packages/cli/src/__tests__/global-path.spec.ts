import { jest } from '@jest/globals'
import path from 'node:path'

jest.unstable_mockModule('node:child_process', () => ({
  execSync: jest.fn(),
}))

jest.unstable_mockModule('node:fs', () => ({
  existsSync: jest.fn(),
}))

const { execSync } = await import('node:child_process')
const { existsSync } = await import('node:fs')
const { getNpmGlobalRoot, isGloballyInstalled } = await import('../global-path')

describe('global-path', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getNpmGlobalRoot', () => {
    it('should return the npm global root path', () => {
      ;(execSync as jest.Mock).mockReturnValue('/home/user/.npm-global/lib/node_modules\n')
      const result = getNpmGlobalRoot()
      expect(execSync).toHaveBeenCalledWith('npm root -g', { encoding: 'utf-8' })
      expect(result).toBe('/home/user/.npm-global/lib/node_modules')
    })

    it('should return null when execSync fails', () => {
      ;(execSync as jest.Mock).mockImplementation(() => {
        throw new Error('command failed')
      })
      const result = getNpmGlobalRoot()
      expect(result).toBeNull()
    })
  })

  describe('isGloballyInstalled', () => {
    it('should return true when package is installed globally', () => {
      ;(execSync as jest.Mock).mockReturnValue('/home/user/.npm-global/lib/node_modules\n')
      ;(existsSync as jest.Mock).mockReturnValue(true)
      expect(isGloballyInstalled()).toBe(true)
      expect(existsSync).toHaveBeenCalledWith(
        path.join('/home/user/.npm-global/lib/node_modules', '@tech-leads-club/agent-skills'),
      )
    })

    it('should return false when package is not installed globally', () => {
      ;(execSync as jest.Mock).mockReturnValue('/home/user/.npm-global/lib/node_modules\n')
      ;(existsSync as jest.Mock).mockReturnValue(false)
      expect(isGloballyInstalled()).toBe(false)
    })

    it('should return false when npm root fails', () => {
      ;(execSync as jest.Mock).mockImplementation(() => {
        throw new Error('command failed')
      })
      expect(isGloballyInstalled()).toBe(false)
    })
  })
})
