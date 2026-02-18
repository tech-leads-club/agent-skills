import { mkdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { AgentType } from '../../types'
import { getCanonicalPath, getInstallPath, removeSkill } from '../installer'

jest.mock('../audit-log', () => ({
  logAudit: jest.fn(),
  getAuditLogPath: jest.fn(),
  readAuditLog: jest.fn(),
}))

jest.mock('../registry', () => ({
  getCachedContentHash: jest.fn(),
}))

describe('Installer Security', () => {
  let testDir: string
  let originalCwd: string

  beforeEach(async () => {
    originalCwd = process.cwd()
    testDir = join(tmpdir(), `agent-skills-test-${Date.now()}`)
    await mkdir(testDir, { recursive: true })
    process.chdir(testDir)
  })

  afterEach(async () => {
    process.chdir(originalCwd)
    await rm(testDir, { recursive: true, force: true }).catch(() => {})
  })

  describe('Path Traversal Protection', () => {
    it('should sanitize path traversal attempts', () => {
      const path = getInstallPath('../../../etc/passwd', 'cursor')
      expect(path).not.toContain('..')
      expect(path.split('/').pop()).not.toContain('..')
    })

    it('should sanitize absolute path attempts', () => {
      const path = getInstallPath('/etc/passwd', 'cursor')
      expect(path).toContain('.cursor/skills')
    })

    it('should sanitize dangerous characters', () => {
      const path = getInstallPath('skill/../../../etc', 'cursor')
      expect(path).not.toContain('..')
    })

    it('should reject null bytes in skill names', () => {
      const path = getInstallPath('skill\0name', 'cursor')
      expect(path).not.toContain('\0')
    })

    it('should handle Windows path separators', () => {
      const path = getInstallPath('skill\\..\\..\\windows', 'cursor')
      expect(path).not.toContain('\\')
      expect(path).not.toContain('..')
    })
  })

  describe('Lockfile Validation', () => {
    it('should reject removal of skills not in lockfile', async () => {
      const agents: AgentType[] = ['cursor']
      const results = await removeSkill('non-existent-skill', agents, { force: false })

      expect(results).toHaveLength(1)
      expect(results[0].success).toBe(false)
      expect(results[0].error).toContain('lockfile')
    })

    it('should allow forced removal without lockfile check', async () => {
      const agents: AgentType[] = ['cursor']

      // Create a skill directory
      const skillDir = join(testDir, '.cursor', 'skills', 'test-skill')
      await mkdir(skillDir, { recursive: true })
      await writeFile(join(skillDir, 'test.md'), 'test')

      const results = await removeSkill('test-skill', agents, { force: true })

      expect(results).toHaveLength(1)
      // May succeed or fail depending on directory structure, but shouldn't error on lockfile
      if (!results[0].success) {
        expect(results[0].error).not.toContain('lockfile')
      }
    })
  })

  describe('Symlink Security', () => {
    it('should handle symlinks safely', async () => {
      const agents: AgentType[] = ['cursor']
      const skillsDir = join(testDir, '.cursor', 'skills')
      await mkdir(skillsDir, { recursive: true })

      const targetDir = join(testDir, 'target')
      await mkdir(targetDir, { recursive: true })

      const linkPath = join(skillsDir, 'test-skill')
      await symlink(targetDir, linkPath, 'dir')

      // Should handle symlink removal without following it
      const results = await removeSkill('test-skill', agents, { force: true })

      expect(results).toHaveLength(1)
    })
  })

  describe('Name Sanitization', () => {
    it('should handle empty skill names', () => {
      const path = getInstallPath('', 'cursor')
      expect(path).toContain('unnamed-skill')
    })

    it('should handle very long skill names', () => {
      const longName = 'a'.repeat(300)
      const path = getInstallPath(longName, 'cursor')
      const skillName = path.split('/').pop() || ''
      expect(skillName.length).toBeLessThanOrEqual(255)
    })

    it('should remove leading dots', () => {
      const path = getInstallPath('...skill', 'cursor')
      expect(path.split('/').pop()).not.toMatch(/^\./)
    })

    it('should handle special characters', () => {
      const path = getInstallPath('skill:name*test?', 'cursor')
      const skillName = path.split('/').pop() || ''
      expect(skillName).not.toContain(':')
      expect(skillName).not.toContain('*')
      expect(skillName).not.toContain('?')
    })
  })

  describe('Canonical Path Security', () => {
    it('should sanitize canonical paths', () => {
      const path = getCanonicalPath('../../../etc/passwd')
      expect(path).not.toContain('..')
      expect(path).toContain('.agents/skills')
    })

    it('should handle global canonical paths safely', () => {
      const path = getCanonicalPath('valid-skill', { global: true })
      expect(path).toContain('.agents')
      expect(path).toContain('skills')
    })
  })
})
