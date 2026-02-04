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
const { getGlobalSkillPath, getGlobalSkillsPath, getNpmGlobalRoot, isGloballyInstalled } =
  await import('../global-path')

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

  describe('getGlobalSkillsPath', () => {
    it('should return skills path when package is installed globally', () => {
      ;(execSync as jest.Mock).mockReturnValue('/home/user/.npm-global/lib/node_modules\n')
      ;(existsSync as jest.Mock).mockReturnValue(true)
      const result = getGlobalSkillsPath()
      const expected = path.join('/home/user/.npm-global/lib/node_modules', '@tech-leads-club/agent-skills/skills')
      expect(result).toBe(expected)
    })

    it('should return null when skills directory does not exist', () => {
      ;(execSync as jest.Mock).mockReturnValue('/home/user/.npm-global/lib/node_modules\n')
      ;(existsSync as jest.Mock).mockReturnValue(false)
      const result = getGlobalSkillsPath()
      expect(result).toBeNull()
    })

    it('should return null when npm root fails', () => {
      ;(execSync as jest.Mock).mockImplementation(() => {
        throw new Error('command failed')
      })
      const result = getGlobalSkillsPath()
      expect(result).toBeNull()
    })
  })

  describe('isGloballyInstalled', () => {
    it('should return true when package is installed globally', () => {
      ;(execSync as jest.Mock).mockReturnValue('/home/user/.npm-global/lib/node_modules\n')
      ;(existsSync as jest.Mock).mockReturnValue(true)
      expect(isGloballyInstalled()).toBe(true)
    })

    it('should return false when package is not installed globally', () => {
      ;(execSync as jest.Mock).mockReturnValue('/home/user/.npm-global/lib/node_modules\n')
      ;(existsSync as jest.Mock).mockReturnValue(false)
      expect(isGloballyInstalled()).toBe(false)
    })
  })

  describe('getGlobalSkillPath', () => {
    it('should return path to specific skill when it exists', () => {
      ;(execSync as jest.Mock).mockReturnValue('/home/user/.npm-global/lib/node_modules\n')
      ;(existsSync as jest.Mock).mockReturnValue(true)
      const result = getGlobalSkillPath('spec-driven-dev')
      const expected = path.join(
        '/home/user/.npm-global/lib/node_modules',
        '@tech-leads-club/agent-skills/skills/spec-driven-dev',
      )
      expect(result).toBe(expected)
    })

    it('should return null when skill does not exist', () => {
      ;(execSync as jest.Mock).mockReturnValue('/home/user/.npm-global/lib/node_modules\n')
      ;(existsSync as jest.Mock).mockReturnValueOnce(true).mockReturnValueOnce(false)
      const result = getGlobalSkillPath('nonexistent-skill')
      expect(result).toBeNull()
    })
  })
})
