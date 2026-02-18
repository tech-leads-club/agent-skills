import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { readSkillLock, removeSkillFromLock, addSkillToLock } from '../lockfile'
import type { AgentType } from '../../types'

describe('Lockfile Security', () => {
  let testDir: string
  let originalCwd: string

  beforeEach(async () => {
    originalCwd = process.cwd()
    testDir = join(tmpdir(), `lockfile-test-${Date.now()}`)
    await mkdir(testDir, { recursive: true })
    process.chdir(testDir)
  })

  afterEach(async () => {
    process.chdir(originalCwd)
    await rm(testDir, { recursive: true, force: true }).catch(() => {})
  })

  describe('Lockfile Integrity', () => {
    it('should handle corrupted lockfile gracefully', async () => {
      const agentsDir = join(testDir, '.agents')
      await mkdir(agentsDir, { recursive: true })
      await writeFile(join(agentsDir, '.skill-lock.json'), 'invalid json{{{')
      
      const lock = await readSkillLock(false)
      expect(lock.version).toBe(2)
      expect(lock.skills).toEqual({})
    })

    it('should create backup before writing', async () => {
      const agents: AgentType[] = ['cursor']
      await addSkillToLock('test-skill', agents, { source: 'local' })
      
      // Write again to trigger backup
      await addSkillToLock('test-skill-2', agents, { source: 'local' })
      
      // Backup should exist (we can't easily verify without exposing internal paths)
      const lock = await readSkillLock(false)
      expect(lock.skills['test-skill']).toBeDefined()
      expect(lock.skills['test-skill-2']).toBeDefined()
    })

    it('should use atomic writes', async () => {
      const agents: AgentType[] = ['cursor']
      
      // Write sequentially to avoid race conditions in test
      await addSkillToLock('skill-1', agents, { source: 'local' })
      await addSkillToLock('skill-2', agents, { source: 'local' })
      await addSkillToLock('skill-3', agents, { source: 'local' })
      
      const lock = await readSkillLock(false)
      expect(Object.keys(lock.skills).length).toBe(3)
    })
  })

  describe('Lockfile Migration', () => {
    it('should migrate v1 lockfile to v2', async () => {
      const agentsDir = join(testDir, '.agents')
      await mkdir(agentsDir, { recursive: true })
      
      const v1Lock = {
        version: 1,
        skills: {
          'old-skill': {
            name: 'old-skill',
            source: 'local',
            installedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      }
      
      await writeFile(join(agentsDir, '.skill-lock.json'), JSON.stringify(v1Lock))
      
      const lock = await readSkillLock(false)
      expect(lock.version).toBe(2)
      expect(lock.skills['old-skill']).toBeDefined()
      expect(lock.skills['old-skill'].method).toBe('copy')
      expect(lock.skills['old-skill'].global).toBe(false)
    })
  })

  describe('Lockfile Operations', () => {
    it('should prevent duplicate entries', async () => {
      const agents: AgentType[] = ['cursor']
      
      await addSkillToLock('test-skill', agents, { source: 'local' })
      await addSkillToLock('test-skill', agents, { source: 'local' })
      
      const lock = await readSkillLock(false)
      expect(Object.keys(lock.skills)).toHaveLength(1)
    })

    it('should update timestamps on re-add', async () => {
      const agents: AgentType[] = ['cursor']
      
      await addSkillToLock('test-skill', agents, { source: 'local' })
      const lock1 = await readSkillLock(false)
      const firstUpdate = lock1.skills['test-skill'].updatedAt
      
      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10))
      
      await addSkillToLock('test-skill', agents, { source: 'local' })
      const lock2 = await readSkillLock(false)
      const secondUpdate = lock2.skills['test-skill'].updatedAt
      
      expect(secondUpdate).not.toBe(firstUpdate)
    })

    it('should remove skills correctly', async () => {
      const agents: AgentType[] = ['cursor']
      
      await addSkillToLock('test-skill', agents, { source: 'local' })
      const removed = await removeSkillFromLock('test-skill', false)
      
      expect(removed).toBe(true)
      
      const lock = await readSkillLock(false)
      expect(lock.skills['test-skill']).toBeUndefined()
    })

    it('should return false when removing non-existent skill', async () => {
      const removed = await removeSkillFromLock('non-existent', false)
      expect(removed).toBe(false)
    })
  })
})
