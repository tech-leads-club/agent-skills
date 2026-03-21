import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { CorePorts } from '@tech-leads-club/core'
import type { JobResult, QueuedJob } from '../../shared/types/job'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockCore: any = {
  getAllLockedSkills: jest.fn(),
  getSkillWithPath: jest.fn(),
  getSkillWithPathForced: jest.fn(),
  getUpdatableSkills: jest.fn(),
  installSkills: jest.fn(),
  removeSkill: jest.fn(),
}

jest.unstable_mockModule('@tech-leads-club/core', () => mockCore)

const { CoreJobExecutor } = await import('../../services/core-job-executor')

type AllLockedSkillsResult = Record<
  string,
  {
    method?: string
    agents?: string[]
  }
>

describe('CoreJobExecutor', () => {
  const ports = {
    registry: {},
    installer: {},
    fileSystem: {},
  } as unknown as CorePorts

  let executor: InstanceType<typeof CoreJobExecutor>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let progressCallback: jest.Mock<any>

  beforeEach(() => {
    jest.clearAllMocks()
    executor = new CoreJobExecutor(ports)
    progressCallback = jest.fn()
  })

  describe('executeUpdate', () => {
    it('should update skill installed locally with copy method', async () => {
      const localLock: AllLockedSkillsResult = {
        'skill-a': { method: 'copy', agents: ['cursor', 'claude-code'] },
      }
      const globalLock: AllLockedSkillsResult = {}

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCore.getAllLockedSkills.mockImplementation((_: any, global: boolean) =>
        Promise.resolve(global ? globalLock : localLock),
      )

      mockCore.getUpdatableSkills.mockResolvedValue({
        toUpdate: ['skill-a'],
      })

      mockCore.getSkillWithPathForced.mockResolvedValue({
        name: 'skill-a',
        description: 'Skill A',
        path: '/path/to/skill-a',
        category: 'test',
      })

      mockCore.installSkills.mockResolvedValue([
        { agent: 'cursor', skill: 'skill-a', success: true, method: 'copy', path: '/cursor/path' },
        { agent: 'claude-code', skill: 'skill-a', success: true, method: 'copy', path: '/cc/path' },
      ])

      const job: QueuedJob = {
        operationId: 'op-1',
        operation: 'update',
        skillName: 'skill-a',
        metadata: {
          batchId: 'batch-1',
          batchSize: 1,
          skillNames: ['skill-a'],
          scope: 'auto',
          agents: [],
        },
      }

      const result: JobResult = await executor.execute(job, progressCallback)

      expect(result.status).toBe('completed')
      expect(mockCore.installSkills).toHaveBeenCalledWith(
        ports,
        [{ name: 'skill-a', description: 'Skill A', path: '/path/to/skill-a', category: 'test' }],
        expect.objectContaining({
          global: false,
          method: 'copy',
          agents: ['cursor', 'claude-code'],
          skills: ['skill-a'],
          forceUpdate: true,
          isUpdate: true,
        }),
      )
      expect(progressCallback).toHaveBeenCalledWith('Update completed')
    })

    it('should update skill installed globally with symlink method', async () => {
      const localLock: AllLockedSkillsResult = {}
      const globalLock: AllLockedSkillsResult = {
        'skill-b': { method: 'symlink', agents: ['cursor'] },
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCore.getAllLockedSkills.mockImplementation((_: any, global: boolean) =>
        Promise.resolve(global ? globalLock : localLock),
      )

      mockCore.getUpdatableSkills.mockResolvedValue({
        toUpdate: ['skill-b'],
      })

      mockCore.getSkillWithPathForced.mockResolvedValue({
        name: 'skill-b',
        description: 'Skill B',
        path: '/path/to/skill-b',
        category: 'test',
      })

      mockCore.installSkills.mockResolvedValue([
        { agent: 'cursor', skill: 'skill-b', success: true, method: 'symlink', path: '/cursor/path' },
      ])

      const job: QueuedJob = {
        operationId: 'op-2',
        operation: 'update',
        skillName: 'skill-b',
        metadata: {
          batchId: 'batch-2',
          batchSize: 1,
          skillNames: ['skill-b'],
          scope: 'auto',
          agents: [],
        },
      }

      const result: JobResult = await executor.execute(job, progressCallback)

      expect(result.status).toBe('completed')
      expect(mockCore.installSkills).toHaveBeenCalledWith(
        ports,
        [{ name: 'skill-b', description: 'Skill B', path: '/path/to/skill-b', category: 'test' }],
        expect.objectContaining({
          global: true,
          method: 'symlink',
          agents: ['cursor'],
          skills: ['skill-b'],
          forceUpdate: true,
          isUpdate: true,
        }),
      )
    })

    it('should update skill installed in both scopes separately', async () => {
      const localLock: AllLockedSkillsResult = {
        'skill-c': { method: 'copy', agents: ['cursor'] },
      }
      const globalLock: AllLockedSkillsResult = {
        'skill-c': { method: 'symlink', agents: ['claude-code'] },
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCore.getAllLockedSkills.mockImplementation((_: any, global: boolean) =>
        Promise.resolve(global ? globalLock : localLock),
      )

      mockCore.getUpdatableSkills.mockResolvedValue({
        toUpdate: ['skill-c'],
      })

      mockCore.getSkillWithPathForced.mockResolvedValue({
        name: 'skill-c',
        description: 'Skill C',
        path: '/path/to/skill-c',
        category: 'test',
      })

      mockCore.installSkills.mockResolvedValue([
        { agent: 'cursor', skill: 'skill-c', success: true, method: 'copy', path: '/cursor/path' },
        { agent: 'claude-code', skill: 'skill-c', success: true, method: 'symlink', path: '/cc/path' },
      ])

      const job: QueuedJob = {
        operationId: 'op-3',
        operation: 'update',
        skillName: 'skill-c',
        metadata: {
          batchId: 'batch-3',
          batchSize: 1,
          skillNames: ['skill-c'],
          scope: 'auto',
          agents: [],
        },
      }

      const result: JobResult = await executor.execute(job, progressCallback)

      expect(result.status).toBe('completed')
      expect(mockCore.installSkills).toHaveBeenCalledTimes(2)
      expect(mockCore.installSkills).toHaveBeenNthCalledWith(
        1,
        ports,
        [{ name: 'skill-c', description: 'Skill C', path: '/path/to/skill-c', category: 'test' }],
        expect.objectContaining({
          global: false,
          method: 'copy',
          agents: ['cursor'],
        }),
      )
      expect(mockCore.installSkills).toHaveBeenNthCalledWith(
        2,
        ports,
        [{ name: 'skill-c', description: 'Skill C', path: '/path/to/skill-c', category: 'test' }],
        expect.objectContaining({
          global: true,
          method: 'symlink',
          agents: ['claude-code'],
        }),
      )
    })

    it('should respect scope filter for local-only updates', async () => {
      const localLock: AllLockedSkillsResult = {
        'skill-d': { method: 'copy', agents: ['cursor'] },
      }
      const globalLock: AllLockedSkillsResult = {
        'skill-d': { method: 'symlink', agents: ['claude-code'] },
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCore.getAllLockedSkills.mockImplementation((_: any, global: boolean) =>
        Promise.resolve(global ? globalLock : localLock),
      )

      mockCore.getUpdatableSkills.mockResolvedValue({
        toUpdate: ['skill-d'],
      })

      mockCore.getSkillWithPathForced.mockResolvedValue({
        name: 'skill-d',
        description: 'Skill D',
        path: '/path/to/skill-d',
        category: 'test',
      })

      mockCore.installSkills.mockResolvedValue([
        { agent: 'cursor', skill: 'skill-d', success: true, method: 'copy', path: '/cursor/path' },
      ])

      const job: QueuedJob = {
        operationId: 'op-4',
        operation: 'update',
        skillName: 'skill-d',
        metadata: {
          batchId: 'batch-4',
          batchSize: 1,
          skillNames: ['skill-d'],
          scope: 'local',
          agents: [],
        },
      }

      const result: JobResult = await executor.execute(job, progressCallback)

      expect(result.status).toBe('completed')
      expect(mockCore.installSkills).toHaveBeenCalledTimes(1)
      expect(mockCore.installSkills).toHaveBeenCalledWith(
        ports,
        [{ name: 'skill-d', description: 'Skill D', path: '/path/to/skill-d', category: 'test' }],
        expect.objectContaining({
          global: false,
          method: 'copy',
          agents: ['cursor'],
        }),
      )
    })

    it('should respect scope filter for global-only updates', async () => {
      const localLock: AllLockedSkillsResult = {
        'skill-e': { method: 'copy', agents: ['cursor'] },
      }
      const globalLock: AllLockedSkillsResult = {
        'skill-e': { method: 'symlink', agents: ['claude-code'] },
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCore.getAllLockedSkills.mockImplementation((_: any, global: boolean) =>
        Promise.resolve(global ? globalLock : localLock),
      )

      mockCore.getUpdatableSkills.mockResolvedValue({
        toUpdate: ['skill-e'],
      })

      mockCore.getSkillWithPathForced.mockResolvedValue({
        name: 'skill-e',
        description: 'Skill E',
        path: '/path/to/skill-e',
        category: 'test',
      })

      mockCore.installSkills.mockResolvedValue([
        { agent: 'claude-code', skill: 'skill-e', success: true, method: 'symlink', path: '/cc/path' },
      ])

      const job: QueuedJob = {
        operationId: 'op-5',
        operation: 'update',
        skillName: 'skill-e',
        metadata: {
          batchId: 'batch-5',
          batchSize: 1,
          skillNames: ['skill-e'],
          scope: 'global',
          agents: [],
        },
      }

      const result: JobResult = await executor.execute(job, progressCallback)

      expect(result.status).toBe('completed')
      expect(mockCore.installSkills).toHaveBeenCalledTimes(1)
      expect(mockCore.installSkills).toHaveBeenCalledWith(
        ports,
        [{ name: 'skill-e', description: 'Skill E', path: '/path/to/skill-e', category: 'test' }],
        expect.objectContaining({
          global: true,
          method: 'symlink',
          agents: ['claude-code'],
        }),
      )
    })

    it('should return completed when no updates available', async () => {
      const localLock: AllLockedSkillsResult = {}
      const globalLock: AllLockedSkillsResult = {}

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCore.getAllLockedSkills.mockImplementation((_: any, global: boolean) =>
        Promise.resolve(global ? globalLock : localLock),
      )

      mockCore.getUpdatableSkills.mockResolvedValue({
        toUpdate: [],
      })

      const job: QueuedJob = {
        operationId: 'op-6',
        operation: 'update',
        skillName: 'all',
        metadata: {
          batchId: 'batch-6',
          batchSize: 1,
          skillNames: [],
          scope: 'auto',
          agents: [],
        },
      }

      const result: JobResult = await executor.execute(job, progressCallback)

      expect(result.status).toBe('completed')
      expect(progressCallback).toHaveBeenCalledWith('All skills are up to date')
      expect(mockCore.installSkills).not.toHaveBeenCalled()
    })

    it('should return error when download fails', async () => {
      const localLock: AllLockedSkillsResult = {
        'skill-f': { method: 'copy', agents: ['cursor'] },
      }
      const globalLock: AllLockedSkillsResult = {}

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCore.getAllLockedSkills.mockImplementation((_: any, global: boolean) =>
        Promise.resolve(global ? globalLock : localLock),
      )

      mockCore.getUpdatableSkills.mockResolvedValue({
        toUpdate: ['skill-f'],
      })

      mockCore.getSkillWithPathForced.mockResolvedValue(null)

      const job: QueuedJob = {
        operationId: 'op-7',
        operation: 'update',
        skillName: 'skill-f',
        metadata: {
          batchId: 'batch-7',
          batchSize: 1,
          skillNames: ['skill-f'],
          scope: 'auto',
          agents: [],
        },
      }

      const result: JobResult = await executor.execute(job, progressCallback)

      expect(result.status).toBe('error')
      expect(result.errorMessage).toContain('No skills could be downloaded for update')
      expect(mockCore.installSkills).not.toHaveBeenCalled()
    })

    it('should return error when installation fails', async () => {
      const localLock: AllLockedSkillsResult = {
        'skill-g': { method: 'copy', agents: ['cursor'] },
      }
      const globalLock: AllLockedSkillsResult = {}

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCore.getAllLockedSkills.mockImplementation((_: any, global: boolean) =>
        Promise.resolve(global ? globalLock : localLock),
      )

      mockCore.getUpdatableSkills.mockResolvedValue({
        toUpdate: ['skill-g'],
      })

      mockCore.getSkillWithPathForced.mockResolvedValue({
        name: 'skill-g',
        description: 'Skill G',
        path: '/path/to/skill-g',
        category: 'test',
      })

      mockCore.installSkills.mockResolvedValue([
        { agent: 'cursor', skill: 'skill-g', success: false, method: 'copy', error: 'Permission denied' },
      ])

      const job: QueuedJob = {
        operationId: 'op-8',
        operation: 'update',
        skillName: 'skill-g',
        metadata: {
          batchId: 'batch-8',
          batchSize: 1,
          skillNames: ['skill-g'],
          scope: 'auto',
          agents: [],
        },
      }

      const result: JobResult = await executor.execute(job, progressCallback)

      expect(result.status).toBe('error')
      expect(result.errorMessage).toContain('Permission denied')
    })

    it('should use default copy method when lockfile method is missing', async () => {
      const localLock: AllLockedSkillsResult = {
        'skill-h': { agents: ['cursor'] },
      }
      const globalLock: AllLockedSkillsResult = {}

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCore.getAllLockedSkills.mockImplementation((_: any, global: boolean) =>
        Promise.resolve(global ? globalLock : localLock),
      )

      mockCore.getUpdatableSkills.mockResolvedValue({
        toUpdate: ['skill-h'],
      })

      mockCore.getSkillWithPathForced.mockResolvedValue({
        name: 'skill-h',
        description: 'Skill H',
        path: '/path/to/skill-h',
        category: 'test',
      })

      mockCore.installSkills.mockResolvedValue([
        { agent: 'cursor', skill: 'skill-h', success: true, method: 'copy', path: '/cursor/path' },
      ])

      const job: QueuedJob = {
        operationId: 'op-9',
        operation: 'update',
        skillName: 'skill-h',
        metadata: {
          batchId: 'batch-9',
          batchSize: 1,
          skillNames: ['skill-h'],
          scope: 'auto',
          agents: [],
        },
      }

      const result: JobResult = await executor.execute(job, progressCallback)

      expect(result.status).toBe('completed')
      expect(mockCore.installSkills).toHaveBeenCalledWith(
        ports,
        [{ name: 'skill-h', description: 'Skill H', path: '/path/to/skill-h', category: 'test' }],
        expect.objectContaining({
          method: 'copy',
        }),
      )
    })
  })
})
