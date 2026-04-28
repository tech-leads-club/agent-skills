import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals'

import type { CorePorts } from '../../ports'
import type { InstallResult, SkillLockFile, SkillMetadata } from '../../types'

// ESM-compatible module mocking: define mock functions first, then register factories.
const forceDownloadSkillMock = jest.fn<(ports: CorePorts, name: string) => Promise<string | null>>()
const getSkillMetadataMock = jest.fn<(ports: CorePorts, name: string) => Promise<SkillMetadata | null>>()
const installSkillsMock = jest.fn<(...args: unknown[]) => Promise<InstallResult[]>>()
const readSkillLockMock = jest.fn<(ports: CorePorts, global?: boolean) => Promise<SkillLockFile>>()

jest.unstable_mockModule('../registry.service', () => ({
  forceDownloadSkill: forceDownloadSkillMock,
  getSkillMetadata: getSkillMetadataMock,
}))

jest.unstable_mockModule('../installer.service', () => ({
  installSkills: installSkillsMock,
}))

jest.unstable_mockModule('../lockfile.service', () => ({
  readSkillLock: readSkillLockMock,
}))

// Dynamic import must come after unstable_mockModule registrations.
let updateSkills: (ports: CorePorts, skillNames: string[]) => Promise<InstallResult[]>

beforeAll(async () => {
  const mod = await import('../update.service')
  updateSkills = mod.updateSkills
})

const ports = {} as CorePorts

const makeEmptyLock = (): SkillLockFile => ({ version: 2, skills: {} })

const makeLocalLock = (skillName: string): SkillLockFile => ({
  version: 2,
  skills: {
    [skillName]: {
      name: skillName,
      source: 'local',
      contentHash: 'old-hash',
      installedAt: '2026-03-13T15:45:30.404Z',
      updatedAt: '2026-03-13T15:45:30.404Z',
      agents: ['cursor', 'claude-code'],
      method: 'copy',
      global: false,
    },
  },
})

const makeSuccessResult = (skill: string, agent: string): InstallResult => ({
  agent,
  skill,
  path: `/project/.cursor/skills/${skill}`,
  method: 'copy',
  success: true,
})

beforeEach(() => {
  jest.clearAllMocks()

  forceDownloadSkillMock.mockResolvedValue('/home/user/.cache/agent-skills/skills/tlc-spec-driven')
  getSkillMetadataMock.mockResolvedValue({
    name: 'tlc-spec-driven',
    description: 'Feature planning skill',
    category: 'development',
    path: '(development)/tlc-spec-driven',
    files: ['SKILL.md'],
    contentHash: 'new-hash-v3',
  })
  installSkillsMock.mockResolvedValue([
    makeSuccessResult('tlc-spec-driven', 'Cursor'),
    makeSuccessResult('tlc-spec-driven', 'Claude Code'),
  ])
  // Default: local lock has the skill, global lock is empty.
  readSkillLockMock.mockImplementation(async (_ports, global = false) =>
    global ? makeEmptyLock() : makeLocalLock('tlc-spec-driven'),
  )
})

describe('updateSkills', () => {
  it('force-downloads fresh content before reinstalling', async () => {
    await updateSkills(ports, ['tlc-spec-driven'])

    expect(forceDownloadSkillMock).toHaveBeenCalledWith(ports, 'tlc-spec-driven')
  })

  it('reinstalls using the fresh cache path, not the stale one', async () => {
    await updateSkills(ports, ['tlc-spec-driven'])

    expect(installSkillsMock).toHaveBeenCalledWith(
      ports,
      expect.arrayContaining([
        expect.objectContaining({ path: '/home/user/.cache/agent-skills/skills/tlc-spec-driven' }),
      ]),
      expect.anything(),
    )
  })

  it('reinstalls to agents recorded in the local lockfile', async () => {
    await updateSkills(ports, ['tlc-spec-driven'])

    expect(installSkillsMock).toHaveBeenCalledWith(
      ports,
      expect.anything(),
      expect.objectContaining({
        agents: ['cursor', 'claude-code'],
        method: 'copy',
        global: false,
      }),
    )
  })

  it('returns install results from the reinstall step', async () => {
    const results = await updateSkills(ports, ['tlc-spec-driven'])

    expect(results).toHaveLength(2)
    expect(results.every((r) => r.success)).toBe(true)
    expect(results.every((r) => r.skill === 'tlc-spec-driven')).toBe(true)
  })

  it('also reinstalls for the global scope when the skill is globally installed', async () => {
    readSkillLockMock.mockImplementation(async (_ports, global = false) => ({
      version: 2,
      skills: {
        'tlc-spec-driven': {
          name: 'tlc-spec-driven',
          source: 'local',
          contentHash: 'old-hash',
          installedAt: '2026-03-13T15:45:30.404Z',
          updatedAt: '2026-03-13T15:45:30.404Z',
          agents: ['cursor'],
          method: 'copy' as const,
          global,
        },
      },
    }))
    installSkillsMock.mockResolvedValue([makeSuccessResult('tlc-spec-driven', 'Cursor')])

    await updateSkills(ports, ['tlc-spec-driven'])

    // installSkills called twice: once for local (global=false) and once for global (global=true)
    expect(installSkillsMock).toHaveBeenCalledTimes(2)
    expect(installSkillsMock).toHaveBeenCalledWith(ports, expect.anything(), expect.objectContaining({ global: false }))
    expect(installSkillsMock).toHaveBeenCalledWith(ports, expect.anything(), expect.objectContaining({ global: true }))
  })

  it('returns an empty array when the skill is not recorded in any lockfile', async () => {
    readSkillLockMock.mockResolvedValue(makeEmptyLock())

    const results = await updateSkills(ports, ['tlc-spec-driven'])

    expect(installSkillsMock).not.toHaveBeenCalled()
    expect(results).toHaveLength(0)
  })

  it('returns a failure result when forceDownloadSkill fails', async () => {
    forceDownloadSkillMock.mockResolvedValue(null)

    const results = await updateSkills(ports, ['tlc-spec-driven'])

    expect(installSkillsMock).not.toHaveBeenCalled()
    expect(results).toHaveLength(1)
    expect(results[0].success).toBe(false)
    expect(results[0].skill).toBe('tlc-spec-driven')
  })

  it('processes multiple skills sequentially and aggregates all results', async () => {
    forceDownloadSkillMock.mockImplementation(async (_ports, name) => `/cache/${name}`)
    getSkillMetadataMock.mockResolvedValue(null)
    installSkillsMock
      .mockResolvedValueOnce([makeSuccessResult('skill-a', 'Cursor')])
      .mockResolvedValueOnce([makeSuccessResult('skill-b', 'Cursor')])

    readSkillLockMock.mockImplementation(async (_ports, global = false) =>
      global
        ? makeEmptyLock()
        : {
            version: 2,
            skills: {
              'skill-a': {
                name: 'skill-a',
                source: 'local',
                contentHash: 'h1',
                installedAt: '',
                updatedAt: '',
                agents: ['cursor'],
                method: 'copy' as const,
                global: false,
              },
              'skill-b': {
                name: 'skill-b',
                source: 'local',
                contentHash: 'h2',
                installedAt: '',
                updatedAt: '',
                agents: ['cursor'],
                method: 'copy' as const,
                global: false,
              },
            },
          },
    )

    const results = await updateSkills(ports, ['skill-a', 'skill-b'])

    expect(results).toHaveLength(2)
    expect(results.map((r) => r.skill)).toEqual(['skill-a', 'skill-b'])
  })
})
