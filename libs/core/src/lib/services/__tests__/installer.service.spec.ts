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

import { getCanonicalPath, getInstallPath, installSkills } from '../installer.service'

type TestPorts = {
  ports: CorePorts
  appendFileMock: jest.MockedFunction<(path: string, content: string, encoding: string) => Promise<void>>
  cpMock: jest.MockedFunction<(src: string, dest: string, options?: { recursive?: boolean }) => Promise<void>>
  existsSyncMock: jest.MockedFunction<(path: string) => boolean>
  mkdirMock: jest.MockedFunction<(path: string, options?: { recursive?: boolean }) => Promise<void>>
  readFileMock: jest.MockedFunction<(path: string, encoding: string) => Promise<string>>
  renameMock: jest.MockedFunction<(oldPath: string, newPath: string) => Promise<void>>
  rmMock: jest.MockedFunction<(path: string, options?: { recursive?: boolean; force?: boolean }) => Promise<void>>
  writeFileMock: jest.MockedFunction<(path: string, content: string, encoding: string) => Promise<void>>
}

const createInstallOptions = (overrides: Partial<InstallOptions> = {}): InstallOptions => ({
  global: false,
  method: 'copy',
  agents: ['cursor'],
  skills: ['my-skill'],
  projectRoot: '/workspace/project',
  homeDir: '/home/tester',
  ...overrides,
})

const createPorts = (): TestPorts => {
  const appendFileMock = jest.fn<(path: string, content: string, encoding: string) => Promise<void>>()
  const cpMock = jest.fn<(src: string, dest: string, options?: { recursive?: boolean }) => Promise<void>>()
  const existsSyncMock = jest.fn<(path: string) => boolean>()
  const mkdirMock = jest.fn<(path: string, options?: { recursive?: boolean }) => Promise<void>>()
  const readFileMock = jest.fn<(path: string, encoding: string) => Promise<string>>()
  const renameMock = jest.fn<(oldPath: string, newPath: string) => Promise<void>>()
  const rmMock = jest.fn<(path: string, options?: { recursive?: boolean; force?: boolean }) => Promise<void>>()
  const writeFileMock = jest.fn<(path: string, content: string, encoding: string) => Promise<void>>()

  appendFileMock.mockResolvedValue(undefined)
  cpMock.mockResolvedValue(undefined)
  existsSyncMock.mockImplementation((path) => path === '/workspace/project/package.json')
  mkdirMock.mockResolvedValue(undefined)
  readFileMock.mockRejectedValue(new Error('missing'))
  renameMock.mockResolvedValue(undefined)
  rmMock.mockResolvedValue(undefined)
  writeFileMock.mockResolvedValue(undefined)

  const fs = {
    appendFile: appendFileMock,
    cp: cpMock,
    existsSync: existsSyncMock,
    lstat: jest.fn(async () => {
      const error = new Error('missing') as Error & { code?: string }
      error.code = 'ENOENT'
      throw error
    }),
    mkdir: mkdirMock,
    readFile: readFileMock,
    readFileSync: jest.fn(() => ''),
    readdir: jest.fn(async () => []),
    readdirSync: jest.fn(() => []),
    readlink: jest.fn(async () => ''),
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
    mkdirMock,
    readFileMock,
    renameMock,
    rmMock,
    writeFileMock,
  }
}

describe('installer service path helpers', () => {
  it('returns the expected local install path for an agent', () => {
    expect(getInstallPath('my-skill', 'cursor', createInstallOptions())).toBe(
      '/workspace/project/.cursor/skills/my-skill',
    )
  })

  it('returns the expected canonical local path', () => {
    expect(getCanonicalPath('my-skill', createInstallOptions())).toBe('/workspace/project/.agents/skills/my-skill')
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

    expect(cpMock).toHaveBeenCalledWith('/tmp/catalog/my-skill', '/workspace/project/skills/my-skill', {
      recursive: true,
    })
    expect(symlinkMock).toHaveBeenCalledWith(
      '../../skills/my-skill',
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
