import { createHash } from 'node:crypto'

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
import type { AgentType, SkillLockFile } from '../../types'

import { updateSkills } from '../update.service'

/**
 * why: this suite drives the real updateSkills against fake ports rather than mocking the modules
 * it imports. jest.unstable_mockModule is inert in this setup — it hands back the real export, so
 * a module-mocked suite silently exercised production code and only passed while the errors were
 * swallowed downstream. Fake ports are also how registry.service.spec.ts is written.
 */
const SKILL = 'tlc-spec-driven'
const HOME = '/home/tester'
const CACHE_DIR = `${HOME}/.cache/agent-skills`
const SKILL_CACHE = `${CACHE_DIR}/skills/${SKILL}`
const SKILL_BODY = '# spec driven\n'

// why: downloads are checksum-verified against the registry, so the fixture hash has to be the
// real one for the fetched bytes — mirrors computeSkillContentHash (sorted path, then bytes).
const CONTENT_HASH = createHash('sha256').update('SKILL.md').update(SKILL_BODY).digest('hex')

const REGISTRY = {
  version: '1.0.0',
  categories: { development: { name: 'Development', description: 'Dev skills' } },
  skills: [
    {
      name: SKILL,
      description: 'Feature planning skill',
      category: 'development',
      path: `(development)/${SKILL}`,
      files: ['SKILL.md'],
      contentHash: CONTENT_HASH,
    },
  ],
  deprecated: [],
}

const makeLock = (agents: AgentType[], global: boolean): SkillLockFile => ({
  version: 2,
  skills: {
    [SKILL]: {
      name: SKILL,
      source: 'local',
      contentHash: 'old-hash',
      installedAt: '2026-03-13T15:45:30.404Z',
      updatedAt: '2026-03-13T15:45:30.404Z',
      agents,
      method: 'copy',
      global,
    },
  },
})

const createPorts = (locks: { local?: SkillLockFile; global?: SkillLockFile } = {}) => {
  const virtualFs = new Map<string, string>()
  const dirs = new Set<string>([CACHE_DIR, `${CACHE_DIR}/skills`])

  if (locks.local) virtualFs.set('/project/.agents/.skill-lock.json', JSON.stringify(locks.local))
  if (locks.global) virtualFs.set(`${HOME}/.agents/.skill-lock.json`, JSON.stringify(locks.global))

  const fs = {
    // hazard: a blanket "true" here makes isSkillCached() claim every skill is cached, which
    // silently turns a registry miss into a success. Existence tracks the virtual fs only.
    // '/project/package.json' is the marker findProjectRoot walks up looking for.
    existsSync: jest.fn(
      (path: string) =>
        virtualFs.has(path) ||
        dirs.has(path) ||
        path === '/project/package.json' ||
        [...virtualFs.keys()].some((key) => key.startsWith(`${path}/`)),
    ),
    mkdirSync: jest.fn((path: string) => void dirs.add(path)),
    rmSync: jest.fn((path: string) => {
      virtualFs.delete(path)
      for (const key of [...virtualFs.keys()]) if (key.startsWith(`${path}/`)) virtualFs.delete(key)
    }),
    readFileSync: jest.fn((path: string) => {
      const found = virtualFs.get(path)
      if (found === undefined) throw new Error(`ENOENT: ${path}`)
      return found
    }),
    writeFileSync: jest.fn((path: string, content: string) => void virtualFs.set(path, content)),
    readdirSync: jest.fn(() => []),
    // async half of the port: lockfile and installer services use these, not the *Sync variants
    readFile: jest.fn(async (path: string) => {
      const found = virtualFs.get(path)
      if (found === undefined) throw new Error(`ENOENT: ${path}`)
      return found
    }),
    writeFile: jest.fn(async (path: string, content: string) => void virtualFs.set(path, content)),
    appendFile: jest.fn(async (path: string, content: string) => {
      virtualFs.set(path, (virtualFs.get(path) ?? '') + content)
    }),
    mkdir: jest.fn(async (path: string) => void dirs.add(path)),
    rm: jest.fn(async (path: string) => {
      virtualFs.delete(path)
      for (const key of [...virtualFs.keys()]) if (key.startsWith(`${path}/`)) virtualFs.delete(key)
    }),
    rename: jest.fn(async (from: string, to: string) => {
      virtualFs.set(to, virtualFs.get(from) ?? '')
      virtualFs.delete(from)
    }),
    cp: jest.fn(async (from: string, to: string) => {
      virtualFs.set(to, virtualFs.get(from) ?? '')
      for (const [key, value] of [...virtualFs.entries()]) {
        if (key.startsWith(`${from}/`)) virtualFs.set(key.replace(from, to), value)
      }
    }),
    symlink: jest.fn(async () => undefined),
    readlink: jest.fn(async (path: string) => path),
    lstat: jest.fn(async () => ({ isDirectory: () => false, isSymbolicLink: () => false })),
    readdir: jest.fn(async () => []),
  } as unknown as FileSystemPort

  // serves the registry always, and skill files only for skills the registry knows
  const respond = (url: string) => {
    if (url.includes('skills-registry.json')) {
      return { ok: true, status: 200, json: async () => REGISTRY, text: async () => JSON.stringify(REGISTRY) }
    }
    const known = REGISTRY.skills.some((skill) => url.includes(skill.path))
    return known
      ? { ok: true, status: 200, json: async () => REGISTRY, text: async () => SKILL_BODY }
      : { ok: false, status: 404, json: async () => REGISTRY, text: async () => '' }
  }

  const ports: CorePorts = {
    fs,
    http: { getWithFallback: jest.fn(async (url: string) => respond(url)) } as unknown as HttpPort,
    env: {
      cwd: jest.fn(() => '/project'),
      homedir: jest.fn(() => HOME),
      platform: jest.fn(() => 'linux'),
      getEnv: jest.fn((key: string) => (key === 'SKILLS_CDN_REF' ? 'main' : undefined)),
    } as unknown as EnvPort,
    logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() } as unknown as LoggerPort,
    packageResolver: { getLatestVersion: jest.fn(async () => '9.9.9') } as unknown as PackageResolverPort,
    paths: {
      getWorkspaceRoot: jest.fn(() => '/project'),
      getSkillsCatalogPath: jest.fn(() => '/project/packages/skills-catalog/skills'),
      getLocalSkillsDirectory: jest.fn(() => null),
    } as unknown as PathsPort,
    shell: {} as ShellPort,
  }

  return { ports, virtualFs }
}

describe('updateSkills', () => {
  it('force-downloads fresh content into the cache', async () => {
    const { ports, virtualFs } = createPorts({ local: makeLock(['cursor'], false) })

    await updateSkills(ports, [SKILL])

    expect(virtualFs.get(`${SKILL_CACHE}/SKILL.md`)).toBe(SKILL_BODY)
  })

  it('refreshes the cache even when no lockfile records the skill', async () => {
    const { ports, virtualFs } = createPorts()

    const results = await updateSkills(ports, [SKILL])

    expect(results).toEqual([])
    expect(virtualFs.get(`${SKILL_CACHE}/SKILL.md`)).toBe(SKILL_BODY)
  })

  it('reinstalls for the agents recorded in the local lockfile', async () => {
    const { ports } = createPorts({ local: makeLock(['cursor', 'claude-code'], false) })

    const results = await updateSkills(ports, [SKILL])

    expect(results.length).toBeGreaterThan(0)
    expect(results.every((result) => result.skill === SKILL)).toBe(true)
  })

  it('reinstalls for the global scope when the skill is globally installed', async () => {
    const localOnly = createPorts({ local: makeLock(['cursor'], false) })
    const bothScopes = createPorts({ local: makeLock(['cursor'], false), global: makeLock(['cursor'], true) })

    const localResults = await updateSkills(localOnly.ports, [SKILL])
    const bothResults = await updateSkills(bothScopes.ports, [SKILL])

    expect(bothResults.length).toBeGreaterThan(localResults.length)
  })

  it('reports a failure result when the skill cannot be downloaded', async () => {
    const { ports } = createPorts({ local: makeLock(['cursor'], false) })
    // registry resolves, but the skill's files do not
    ports.http.getWithFallback = jest.fn(async (url: string) =>
      url.includes('skills-registry.json')
        ? { ok: true, status: 200, json: async () => REGISTRY, text: async () => JSON.stringify(REGISTRY) }
        : { ok: false, status: 500, json: async () => REGISTRY, text: async () => '' },
    ) as unknown as HttpPort['getWithFallback']

    const results = await updateSkills(ports, [SKILL])

    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({ skill: SKILL, success: false })
    expect(results[0].error).toContain(SKILL)
  })

  it('processes several skills and aggregates their results', async () => {
    const { ports } = createPorts({ local: makeLock(['cursor'], false) })

    const results = await updateSkills(ports, [SKILL, 'not-in-registry'])

    expect(results.some((result) => result.skill === 'not-in-registry' && !result.success)).toBe(true)
  })
})
