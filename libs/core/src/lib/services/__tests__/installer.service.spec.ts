import { describe, expect, it, jest } from '@jest/globals'

import type {
  CorePorts,
  EnvPort,
  FileSystemPort,
  HttpPort,
  LoggerPort,
  PackageResolverPort,
  PathsPort,
  ShellPort,
} from '../../ports'
import type { InstallOptions, SkillInfo } from '../../types'

import {
  getCanonicalPath,
  getInstallPath,
  installSkills,
  isSkillInstalled,
  listInstalledSkills,
  removeSkill,
} from '../installer.service'

type TestPorts = {
  ports: CorePorts
  appendFileMock: jest.MockedFunction<(path: string, content: string, encoding: string) => Promise<void>>
  cpMock: jest.MockedFunction<(src: string, dest: string, options?: { recursive?: boolean }) => Promise<void>>
  existsSyncMock: jest.MockedFunction<(path: string) => boolean>
  lstatMock: jest.MockedFunction<(path: string) => Promise<{ isDirectory(): boolean; isSymbolicLink(): boolean }>>
  mkdirMock: jest.MockedFunction<(path: string, options?: { recursive?: boolean }) => Promise<void>>
  readdirMock: jest.MockedFunction<
    (
      path: string,
      options?: { withFileTypes: true },
    ) => Promise<{ name: string; isDirectory(): boolean; isSymbolicLink?(): boolean }[]>
  >
  readFileMock: jest.MockedFunction<(path: string, encoding: string) => Promise<string>>
  readlinkMock: jest.MockedFunction<(linkPath: string) => Promise<string>>
  renameMock: jest.MockedFunction<(oldPath: string, newPath: string) => Promise<void>>
  rmMock: jest.MockedFunction<(path: string, options?: { recursive?: boolean; force?: boolean }) => Promise<void>>
  writeFileMock: jest.MockedFunction<(path: string, content: string, encoding: string) => Promise<void>>
}

const createInstallOptions = (overrides: Partial<InstallOptions> = {}): InstallOptions => ({
  global: false,
  method: 'copy',
  agents: ['cursor'],
  skills: ['my-skill'],
  ...overrides,
})

const createPorts = (): TestPorts => {
  const appendFileMock = jest.fn<(path: string, content: string, encoding: string) => Promise<void>>()
  const cpMock = jest.fn<(src: string, dest: string, options?: { recursive?: boolean }) => Promise<void>>()
  const existsSyncMock = jest.fn<(path: string) => boolean>()
  const lstatMock = jest.fn<(path: string) => Promise<{ isDirectory(): boolean; isSymbolicLink(): boolean }>>()
  const mkdirMock = jest.fn<(path: string, options?: { recursive?: boolean }) => Promise<void>>()
  const readdirMock =
    jest.fn<
      (
        path: string,
        options?: { withFileTypes: true },
      ) => Promise<{ name: string; isDirectory(): boolean; isSymbolicLink?(): boolean }[]>
    >()
  const readFileMock = jest.fn<(path: string, encoding: string) => Promise<string>>()
  const readlinkMock = jest.fn<(linkPath: string) => Promise<string>>()
  const renameMock = jest.fn<(oldPath: string, newPath: string) => Promise<void>>()
  const rmMock = jest.fn<(path: string, options?: { recursive?: boolean; force?: boolean }) => Promise<void>>()
  const writeFileMock = jest.fn<(path: string, content: string, encoding: string) => Promise<void>>()

  appendFileMock.mockResolvedValue(undefined)
  cpMock.mockResolvedValue(undefined)
  existsSyncMock.mockImplementation((path) => path === '/workspace/project/package.json')
  lstatMock.mockImplementation(async () => {
    const error = new Error('missing') as Error & { code?: string }
    error.code = 'ENOENT'
    throw error
  })
  mkdirMock.mockResolvedValue(undefined)
  readdirMock.mockResolvedValue([])
  readFileMock.mockRejectedValue(new Error('missing'))
  readlinkMock.mockResolvedValue('')
  renameMock.mockResolvedValue(undefined)
  rmMock.mockResolvedValue(undefined)
  writeFileMock.mockResolvedValue(undefined)

  const fs = {
    appendFile: appendFileMock,
    cp: cpMock,
    existsSync: existsSyncMock,
    lstat: lstatMock,
    mkdir: mkdirMock,
    readFile: readFileMock,
    readFileSync: jest.fn(() => ''),
    readdir: readdirMock,
    readdirSync: jest.fn(() => []),
    readlink: readlinkMock,
    rename: renameMock,
    rm: rmMock,
    symlink: jest.fn(async () => undefined),
    writeFile: writeFileMock,
  } as unknown as FileSystemPort

  const env = {
    cwd: jest.fn(() => '/workspace/project/packages/cli'),
    getEnv: jest.fn(() => undefined),
    homedir: jest.fn(() => '/home/tester'),
    platform: jest.fn(() => 'linux'),
  } as unknown as EnvPort

  const ports: CorePorts = {
    env,
    fs,
    http: {} as HttpPort,
    logger: {
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    } as unknown as LoggerPort,
    packageResolver: {} as PackageResolverPort,
    paths: {
      getLocalSkillsDirectory: jest.fn(() => null),
      getSkillsCatalogPath: jest.fn(() => '/workspace/project/packages/skills-catalog/skills'),
      getWorkspaceRoot: jest.fn(() => '/workspace/project'),
    } as unknown as PathsPort,
    shell: {} as ShellPort,
  }

  return {
    ports,
    appendFileMock,
    cpMock,
    existsSyncMock,
    lstatMock,
    mkdirMock,
    readdirMock,
    readFileMock,
    readlinkMock,
    renameMock,
    rmMock,
    writeFileMock,
  }
}

describe('installer service path helpers', () => {
  it('returns the expected local install path for an agent', () => {
    const { ports } = createPorts()

    expect(getInstallPath(ports, 'my-skill', 'cursor')).toBe('/workspace/project/.cursor/skills/my-skill')
  })

  it('returns the expected canonical local path', () => {
    const { ports } = createPorts()

    expect(getCanonicalPath(ports, 'my-skill')).toBe('/workspace/project/.agents/skills/my-skill')
  })
})

describe('installSkills', () => {
  it('installs one skill with the copy method and returns a successful result', async () => {
    const { ports, cpMock, mkdirMock } = createPorts()
    const skill: SkillInfo = {
      name: 'my-skill',
      description: 'Test skill',
      path: '/tmp/catalog/my-skill',
      category: 'testing',
    }

    const results = await installSkills(ports, [skill], createInstallOptions({ skills: ['my-skill'] }))

    expect(mkdirMock).toHaveBeenCalledWith('/workspace/project/.cursor/skills', { recursive: true })
    expect(cpMock).toHaveBeenCalledWith('/tmp/catalog/my-skill', '/workspace/project/.cursor/skills/my-skill', {
      recursive: true,
    })
    expect(results).toEqual([
      {
        agent: 'Cursor',
        skill: 'my-skill',
        path: '/workspace/project/.cursor/skills/my-skill',
        method: 'copy',
        success: true,
      },
    ])
  })

  it('installs multiple skills in sequence', async () => {
    const { ports, cpMock } = createPorts()
    const skills: SkillInfo[] = [
      {
        name: 'alpha-skill',
        description: 'Alpha skill',
        path: '/tmp/catalog/alpha-skill',
        category: 'testing',
      },
      {
        name: 'beta-skill',
        description: 'Beta skill',
        path: '/tmp/catalog/beta-skill',
        category: 'testing',
      },
    ]

    const results = await installSkills(ports, skills, createInstallOptions({ skills: ['alpha-skill', 'beta-skill'] }))

    expect(cpMock).toHaveBeenCalledTimes(2)
    expect(results).toEqual([
      {
        agent: 'Cursor',
        skill: 'alpha-skill',
        path: '/workspace/project/.cursor/skills/alpha-skill',
        method: 'copy',
        success: true,
      },
      {
        agent: 'Cursor',
        skill: 'beta-skill',
        path: '/workspace/project/.cursor/skills/beta-skill',
        method: 'copy',
        success: true,
      },
    ])
  })

  it('installs a local symlink when the symlink method succeeds', async () => {
    const { ports, cpMock } = createPorts()
    const symlinkMock = ports.fs.symlink as jest.MockedFunction<
      (target: string, linkPath: string, type?: string) => Promise<void>
    >
    const skill: SkillInfo = {
      name: 'my-skill',
      description: 'Test skill',
      path: '/tmp/catalog/my-skill',
      category: 'testing',
    }

    const results = await installSkills(
      ports,
      [skill],
      createInstallOptions({ method: 'symlink', skills: ['my-skill'] }),
    )

    expect(cpMock).toHaveBeenCalledWith('/tmp/catalog/my-skill', '/workspace/project/.agents/skills/my-skill', {
      recursive: true,
    })
    expect(symlinkMock).toHaveBeenCalledWith(
      '../../.agents/skills/my-skill',
      '/workspace/project/.cursor/skills/my-skill',
      undefined,
    )
    expect(results).toEqual([
      {
        agent: 'Cursor',
        skill: 'my-skill',
        path: '/workspace/project/.cursor/skills/my-skill',
        method: 'symlink',
        success: true,
        usedGlobalSymlink: false,
      },
    ])
  })

  it('falls back to copy when symlink creation fails', async () => {
    const { ports, cpMock } = createPorts()
    const symlinkMock = ports.fs.symlink as jest.MockedFunction<
      (target: string, linkPath: string, type?: string) => Promise<void>
    >
    const skill: SkillInfo = {
      name: 'fallback-skill',
      description: 'Fallback skill',
      path: '/tmp/catalog/fallback-skill',
      category: 'testing',
    }

    symlinkMock.mockRejectedValueOnce(new Error('symlink failed'))

    const results = await installSkills(
      ports,
      [skill],
      createInstallOptions({ method: 'symlink', skills: ['fallback-skill'] }),
    )

    expect(cpMock).toHaveBeenLastCalledWith(
      '/tmp/catalog/fallback-skill',
      '/workspace/project/.cursor/skills/fallback-skill',
      { recursive: true },
    )
    expect(results).toEqual([
      {
        agent: 'Cursor',
        skill: 'fallback-skill',
        path: '/workspace/project/.cursor/skills/fallback-skill',
        method: 'copy',
        success: true,
        symlinkFailed: true,
      },
    ])
  })

  it('returns a failed result when file copy throws an error', async () => {
    const { ports, cpMock } = createPorts()
    const skill: SkillInfo = {
      name: 'broken-skill',
      description: 'Broken skill',
      path: '/tmp/catalog/broken-skill',
      category: 'testing',
    }

    cpMock.mockRejectedValueOnce(new Error('copy failed'))

    const results = await installSkills(ports, [skill], createInstallOptions({ skills: ['broken-skill'] }))

    expect(results).toEqual([
      {
        agent: 'Cursor',
        skill: 'broken-skill',
        path: '/workspace/project/.cursor/skills/broken-skill',
        method: 'copy',
        success: false,
        error: 'copy failed',
      },
    ])
  })

  it('returns an empty result when no skills are provided', async () => {
    const { ports, cpMock } = createPorts()

    const results = await installSkills(ports, [], createInstallOptions({ skills: [] }))

    expect(results).toEqual([])
    expect(cpMock).not.toHaveBeenCalled()
  })
})

describe('removeSkill', () => {
  it('removes an installed skill and returns a successful result', async () => {
    const { ports, lstatMock, readFileMock, rmMock } = createPorts()

    readFileMock.mockResolvedValueOnce(
      JSON.stringify({
        version: 2,
        skills: {
          'my-skill': {
            name: 'my-skill',
            source: 'local',
            installedAt: '2026-03-14T00:00:00.000Z',
            updatedAt: '2026-03-14T00:00:00.000Z',
            agents: ['cursor'],
            method: 'copy',
            global: false,
          },
        },
      }),
    )
    lstatMock.mockResolvedValue({
      isDirectory: () => true,
      isSymbolicLink: () => false,
    })

    const results = await removeSkill(ports, 'my-skill', ['cursor'])

    expect(rmMock).toHaveBeenCalledWith('/workspace/project/.cursor/skills/my-skill', { recursive: true, force: true })
    expect(results).toEqual([
      {
        skill: 'my-skill',
        agent: 'Cursor',
        success: true,
      },
    ])
  })

  it('returns a not-found result when the skill is absent from the lockfile', async () => {
    const { ports, rmMock } = createPorts()

    const results = await removeSkill(ports, 'missing-skill', ['cursor'])

    expect(results).toEqual([
      {
        skill: 'missing-skill',
        agent: 'Cursor',
        success: false,
        error: 'Skill not found in lockfile',
      },
    ])
    expect(rmMock).not.toHaveBeenCalled()
  })

  it('removes the skill for multiple agents', async () => {
    const { ports, lstatMock, readFileMock, rmMock } = createPorts()

    readFileMock.mockResolvedValueOnce(
      JSON.stringify({
        version: 2,
        skills: {
          'shared-skill': {
            name: 'shared-skill',
            source: 'local',
            installedAt: '2026-03-14T00:00:00.000Z',
            updatedAt: '2026-03-14T00:00:00.000Z',
            agents: ['cursor', 'codex'],
            method: 'copy',
            global: false,
          },
        },
      }),
    )
    lstatMock.mockResolvedValue({
      isDirectory: () => true,
      isSymbolicLink: () => false,
    })

    const results = await removeSkill(ports, 'shared-skill', ['cursor', 'codex'])

    expect(rmMock).toHaveBeenCalledWith('/workspace/project/.cursor/skills/shared-skill', {
      recursive: true,
      force: true,
    })
    expect(rmMock).toHaveBeenCalledWith('/workspace/project/.codex/skills/shared-skill', {
      recursive: true,
      force: true,
    })
    expect(results).toEqual([
      {
        skill: 'shared-skill',
        agent: 'Cursor',
        success: true,
      },
      {
        skill: 'shared-skill',
        agent: 'OpenAI Codex',
        success: true,
      },
    ])
  })

  it('removes a local symlink install successfully', async () => {
    const { ports, lstatMock, readFileMock, readlinkMock, rmMock } = createPorts()

    readFileMock.mockResolvedValueOnce(
      JSON.stringify({
        version: 2,
        skills: {
          'symlink-skill': {
            name: 'symlink-skill',
            source: 'local',
            installedAt: '2026-03-14T00:00:00.000Z',
            updatedAt: '2026-03-14T00:00:00.000Z',
            agents: ['cursor'],
            method: 'symlink',
            global: false,
          },
        },
      }),
    )
    lstatMock.mockResolvedValue({
      isDirectory: () => false,
      isSymbolicLink: () => true,
    })
    readlinkMock.mockResolvedValue('../../.agents/skills/symlink-skill')

    const results = await removeSkill(ports, 'symlink-skill', ['cursor'])

    expect(results).toEqual([
      {
        skill: 'symlink-skill',
        agent: 'Cursor',
        success: true,
      },
    ])
    expect(rmMock).toHaveBeenCalledWith('/workspace/project/.cursor/skills/symlink-skill', {
      recursive: true,
      force: true,
    })
  })

  it('removes a global symlink install successfully', async () => {
    const { ports, lstatMock, readFileMock, readlinkMock, rmMock } = createPorts()

    readFileMock.mockResolvedValueOnce(
      JSON.stringify({
        version: 2,
        skills: {
          'global-symlink-skill': {
            name: 'global-symlink-skill',
            source: 'local',
            installedAt: '2026-03-14T00:00:00.000Z',
            updatedAt: '2026-03-14T00:00:00.000Z',
            agents: ['cursor'],
            method: 'symlink',
            global: true,
          },
        },
      }),
    )
    lstatMock.mockResolvedValue({
      isDirectory: () => false,
      isSymbolicLink: () => true,
    })
    readlinkMock.mockResolvedValue('../../../packages/skills-catalog/skills/global-symlink-skill')

    const results = await removeSkill(ports, 'global-symlink-skill', ['cursor'], { global: true })

    expect(results).toEqual([
      {
        skill: 'global-symlink-skill',
        agent: 'Cursor',
        success: true,
      },
    ])
    expect(rmMock).toHaveBeenCalledWith('/home/tester/.cursor/skills/global-symlink-skill', {
      recursive: true,
      force: true,
    })
  })
})

describe('listInstalledSkills', () => {
  it('returns installed skill directories and symlinks for an agent', async () => {
    const { ports, readdirMock } = createPorts()

    readdirMock.mockResolvedValue([
      { name: 'alpha-skill', isDirectory: () => true, isSymbolicLink: () => false },
      { name: 'beta-skill', isDirectory: () => false, isSymbolicLink: () => true },
      { name: 'notes.txt', isDirectory: () => false, isSymbolicLink: () => false },
    ])

    const installedSkills = await listInstalledSkills(ports, 'cursor', false)

    expect(installedSkills).toEqual(['alpha-skill', 'beta-skill'])
  })

  it('returns an empty array when the skills directory does not exist', async () => {
    const { ports, readdirMock } = createPorts()

    readdirMock.mockRejectedValueOnce(new Error('missing directory'))

    const installedSkills = await listInstalledSkills(ports, 'cursor', false)

    expect(installedSkills).toEqual([])
  })
})

describe('isSkillInstalled', () => {
  it('returns true when the installed skill path exists', async () => {
    const { ports, lstatMock } = createPorts()

    lstatMock.mockResolvedValueOnce({
      isDirectory: () => true,
      isSymbolicLink: () => false,
    })

    await expect(isSkillInstalled(ports, 'my-skill', 'cursor')).resolves.toBe(true)
  })

  it('returns false when the installed skill path does not exist', async () => {
    const { ports } = createPorts()

    await expect(isSkillInstalled(ports, 'missing-skill', 'cursor')).resolves.toBe(false)
  })
})
