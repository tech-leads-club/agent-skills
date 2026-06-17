import { describe, expect, it, jest } from '@jest/globals'

import type { CorePorts, EnvPort, FileSystemPort, HttpPort, LoggerPort, PackageResolverPort, PathsPort, ShellPort } from '../../ports'

import { generateAuditReport } from '../report.service'

const createPorts = (opts: {
  existingPaths?: Set<string>
  dirEntries?: Record<string, string[]>
  fileContents?: Record<string, string>
  lockfileLocal?: Record<string, unknown>
} = {}): CorePorts => {
  const { existingPaths = new Set(), dirEntries = {}, fileContents = {} } = opts

  const localLockfile = { version: 2, skills: opts.lockfileLocal ?? {} }
  const globalLockfile = { version: 2, skills: {} }

  existingPaths.add('/workspace/package.json')

  for (const dir of Object.keys(dirEntries)) {
    existingPaths.add(dir)
  }

  const fileExtensions = new Set(['.md', '.json', '.ts', '.js', '.txt', '.yaml', '.yml'])

  const fs = {
    existsSync: jest.fn((p: string) => existingPaths.has(p)),
    readFile: jest.fn(async (p: string) => {
      if (p === '/workspace/.agents/.skill-lock.json') return JSON.stringify(localLockfile)
      if (p === '/home/tester/.agents/.skill-lock.json') return JSON.stringify(globalLockfile)
      if (fileContents[p] !== undefined) return fileContents[p]
      throw new Error('not found')
    }),
    readdir: jest.fn(async (p: string) => {
      const names = dirEntries[p] ?? []
      return names.map((name) => {
        const hasExt = fileExtensions.has(name.slice(name.lastIndexOf('.')))
        return { name, isDirectory: () => !hasExt }
      })
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

describe('generateAuditReport', () => {
  it('generates an empty report when no integrations exist', async () => {
    const ports = createPorts()

    const report = await generateAuditReport(ports, { includeGlobal: false })

    expect(report.skills).toEqual([])
    expect(report.mcpServers).toEqual([])
    expect(report.recommendations).toEqual([])
    expect(report.summary.totalSkillsInstalled).toBe(0)
    expect(report.summary.totalMcpServers).toBe(0)
    expect(report.generatedAt).toBeDefined()
    expect(report.projectRoot).toBe('/workspace')
  })

  it('includes skills and computes token estimates', async () => {
    const skillContent = 'a'.repeat(2000)
    const ports = createPorts({
      existingPaths: new Set(['/workspace/.cursor/skills']),
      dirEntries: {
        '/workspace/.cursor/skills': ['my-skill'],
        '/workspace/.cursor/skills/my-skill': ['SKILL.md'],
      },
      fileContents: {
        '/workspace/.cursor/skills/my-skill/SKILL.md': skillContent,
      },
      lockfileLocal: {
        'my-skill': {
          name: 'my-skill',
          source: 'registry',
          installedAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          agents: ['cursor'],
        },
      },
    })

    const report = await generateAuditReport(ports, { includeGlobal: false })

    expect(report.skills.length).toBeGreaterThanOrEqual(1)
    const cursorSkill = report.skills.find((s) => s.name === 'my-skill' && s.agent === 'cursor')
    expect(cursorSkill).toBeDefined()

    expect(report.tokenEstimates.length).toBeGreaterThanOrEqual(1)
    const estimate = report.tokenEstimates.find((e) => e.skillName === 'my-skill')
    expect(estimate).toBeDefined()
    expect(estimate?.totalTokens).toBeGreaterThan(0)
    expect(estimate?.descriptionTokens).toBeGreaterThanOrEqual(0)
    expect(estimate?.bodyTokens).toBeGreaterThanOrEqual(0)

    expect(report.costEstimates.length).toBeGreaterThan(0)
    expect(report.summary.alwaysOnTokens).toBeGreaterThanOrEqual(0)
  })

  it('generates recommendations for orphaned skills', async () => {
    const ports = createPorts({
      existingPaths: new Set(['/workspace/.cursor/skills']),
      dirEntries: {
        '/workspace/.cursor/skills': ['orphan-skill'],
        '/workspace/.cursor/skills/orphan-skill': [],
      },
    })

    const report = await generateAuditReport(ports, { includeGlobal: false })

    const orphanRecs = report.recommendations.filter((r) => r.type === 'orphaned')
    expect(orphanRecs.length).toBeGreaterThanOrEqual(1)
    expect(orphanRecs[0].severity).toBe('warning')
  })

  it('generates recommendations for high-cost skills', async () => {
    const bigContent = 'This is a realistic skill body with varied content for testing. '.repeat(500)
    const ports = createPorts({
      existingPaths: new Set(['/workspace/.cursor/skills']),
      dirEntries: {
        '/workspace/.cursor/skills': ['big-skill'],
        '/workspace/.cursor/skills/big-skill': ['SKILL.md'],
      },
      fileContents: {
        '/workspace/.cursor/skills/big-skill/SKILL.md': bigContent,
      },
      lockfileLocal: {
        'big-skill': {
          name: 'big-skill',
          source: 'registry',
          installedAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          agents: ['cursor'],
        },
      },
    })

    const report = await generateAuditReport(ports, { includeGlobal: false, highCostThreshold: 5000 })

    const highCostRecs = report.recommendations.filter((r) => r.type === 'high-cost')
    expect(highCostRecs.length).toBeGreaterThanOrEqual(1)
    expect(report.summary.highCostSkillCount).toBeGreaterThanOrEqual(1)
  })

  it('detects duplicate skills across agents', async () => {
    const ports = createPorts({
      existingPaths: new Set(['/workspace/.cursor/skills', '/workspace/.claude/skills']),
      dirEntries: {
        '/workspace/.cursor/skills': ['shared-skill'],
        '/workspace/.claude/skills': ['shared-skill'],
        '/workspace/.cursor/skills/shared-skill': [],
        '/workspace/.claude/skills/shared-skill': [],
      },
      lockfileLocal: {
        'shared-skill': {
          name: 'shared-skill',
          source: 'registry',
          installedAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          agents: ['cursor', 'claude-code'],
        },
      },
    })

    const report = await generateAuditReport(ports, { includeGlobal: false })

    expect(report.duplicates.length).toBeGreaterThanOrEqual(1)
    const dup = report.duplicates.find((d) => d.skillName === 'shared-skill')
    expect(dup?.agents.length).toBeGreaterThanOrEqual(2)
  })

  it('sorts recommendations by severity (error > warning > info)', async () => {
    const bigContent = 'This is a realistic skill body with varied content for testing. '.repeat(500)
    const ports = createPorts({
      existingPaths: new Set(['/workspace/.cursor/skills']),
      dirEntries: {
        '/workspace/.cursor/skills': ['orphan', 'big'],
        '/workspace/.cursor/skills/orphan': [],
        '/workspace/.cursor/skills/big': ['SKILL.md'],
      },
      fileContents: {
        '/workspace/.cursor/skills/big/SKILL.md': bigContent,
      },
      lockfileLocal: {
        big: {
          name: 'big',
          source: 'registry',
          installedAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          agents: ['cursor'],
        },
      },
    })

    const report = await generateAuditReport(ports, { includeGlobal: false })

    const severities = report.recommendations.map((r) => r.severity)
    const order = { error: 0, warning: 1, info: 2 }
    for (let i = 1; i < severities.length; i++) {
      expect(order[severities[i]]).toBeGreaterThanOrEqual(order[severities[i - 1]])
    }
  })
})
