import { describe, expect, it, jest } from '@jest/globals'

import type { CorePorts, EnvPort, FileSystemPort, HttpPort, LoggerPort, PackageResolverPort, PathsPort, ShellPort } from '../../ports'

import { scanInstalledSkills } from '../skill-scanner.service'

const createPorts = (opts: {
  existingPaths?: Set<string>
  dirEntries?: Record<string, string[]>
  lockfileLocal?: Record<string, unknown>
  lockfileGlobal?: Record<string, unknown>
} = {}): CorePorts => {
  const { existingPaths = new Set(), dirEntries = {} } = opts

  const localLockfile = {
    version: 2,
    skills: opts.lockfileLocal ?? {},
  }
  const globalLockfile = {
    version: 2,
    skills: opts.lockfileGlobal ?? {},
  }

  const fs = {
    existsSync: jest.fn((p: string) => existingPaths.has(p)),
    readFile: jest.fn(async (p: string) => {
      if (p === '/workspace/.agents/.skill-lock.json') return JSON.stringify(localLockfile)
      if (p === '/home/tester/.agents/.skill-lock.json') return JSON.stringify(globalLockfile)
      throw new Error('not found')
    }),
    readdir: jest.fn(async (p: string) => {
      const names = dirEntries[p] ?? []
      return names.map((name) => ({ name, isDirectory: () => true }))
    }),
  } as unknown as FileSystemPort

  const env = {
    cwd: jest.fn(() => '/workspace'),
    homedir: jest.fn(() => '/home/tester'),
    platform: jest.fn(() => 'linux'),
    getEnv: jest.fn(() => undefined),
  } as unknown as EnvPort

  return {
    fs,
    env,
    http: {} as HttpPort,
    logger: {} as LoggerPort,
    packageResolver: {} as PackageResolverPort,
    paths: {} as PathsPort,
    shell: {} as ShellPort,
  }
}

describe('scanInstalledSkills', () => {
  it('returns empty results when no skill directories exist', async () => {
    const ports = createPorts({
      existingPaths: new Set(['/workspace/package.json']),
    })

    const result = await scanInstalledSkills(ports, { includeGlobal: false })

    expect(result.skills).toEqual([])
    expect(result.orphans).toEqual([])
  })

  it('discovers skills on disk that match lockfile entries', async () => {
    const ports = createPorts({
      existingPaths: new Set(['/workspace/package.json', '/workspace/.cursor/skills']),
      dirEntries: {
        '/workspace/.cursor/skills': ['accessibility'],
      },
      lockfileLocal: {
        accessibility: {
          name: 'accessibility',
          source: 'registry',
          installedAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          agents: ['cursor'],
          method: 'copy',
          global: false,
        },
      },
    })

    const result = await scanInstalledSkills(ports, { includeGlobal: false })

    expect(result.skills).toHaveLength(1)
    expect(result.skills[0].name).toBe('accessibility')
    expect(result.skills[0].agent).toBe('cursor')
    expect(result.skills[0].inLockfile).toBe(true)
    expect(result.skills[0].physicallyPresent).toBe(true)
    expect(result.orphans).toEqual([])
  })

  it('detects orphaned skills (on disk but not in lockfile)', async () => {
    const ports = createPorts({
      existingPaths: new Set(['/workspace/package.json', '/workspace/.cursor/skills']),
      dirEntries: {
        '/workspace/.cursor/skills': ['mystery-skill'],
      },
    })

    const result = await scanInstalledSkills(ports, { includeGlobal: false })

    expect(result.skills).toHaveLength(1)
    expect(result.skills[0].inLockfile).toBe(false)
    expect(result.orphans).toHaveLength(1)
    expect(result.orphans[0].skillName).toBe('mystery-skill')
  })

  it('includes lockfile-only skills (not physically present)', async () => {
    const ports = createPorts({
      existingPaths: new Set(['/workspace/package.json']),
      lockfileLocal: {
        'ghost-skill': {
          name: 'ghost-skill',
          source: 'registry',
          installedAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          agents: ['cursor'],
          method: 'copy',
          global: false,
        },
      },
    })

    const result = await scanInstalledSkills(ports, { includeGlobal: false })

    const ghostSkill = result.skills.find((s) => s.name === 'ghost-skill')
    expect(ghostSkill).toBeDefined()
    expect(ghostSkill?.physicallyPresent).toBe(false)
    expect(ghostSkill?.inLockfile).toBe(true)
  })

  it('skips global directories when includeGlobal is false', async () => {
    const ports = createPorts({
      existingPaths: new Set(['/workspace/package.json', '/home/tester/.cursor/skills']),
      dirEntries: {
        '/home/tester/.cursor/skills': ['global-skill'],
      },
    })

    const result = await scanInstalledSkills(ports, { includeGlobal: false })

    expect(result.skills.filter((s) => s.name === 'global-skill')).toHaveLength(0)
  })

  it('includes global skills when includeGlobal is true', async () => {
    const ports = createPorts({
      existingPaths: new Set(['/workspace/package.json', '/home/tester/.cursor/skills']),
      dirEntries: {
        '/home/tester/.cursor/skills': ['global-skill'],
      },
    })

    const result = await scanInstalledSkills(ports, { includeGlobal: true })

    const globalSkill = result.skills.find((s) => s.name === 'global-skill' && s.location === 'global')
    expect(globalSkill).toBeDefined()
  })
})
