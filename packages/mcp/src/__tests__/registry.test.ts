import Fuse from 'fuse.js'

import { buildIndexes } from '../registry'
import type { IndexSkill, Registry, SkillEntry } from '../types'

describe('buildIndexes', () => {
  it('should create a Fuse index and a Map from registry skills', () => {
    const registry = createRegistry([
      { name: 'coding-guidelines', description: 'Guidelines for coding.' },
      { name: 'aws-advisor', description: 'AWS cloud advisor.' },
    ])
    const indexes = buildIndexes(registry)
    expect(indexes.fuse).toBeInstanceOf(Fuse)
    expect(indexes.map).toBeInstanceOf(Map)
    expect(indexes.map.size).toBe(2)
    expect(indexes.map.get('coding-guidelines')).toBeDefined()
    expect(indexes.map.get('aws-advisor')).toBeDefined()
  })

  it('should include category in slim skills', () => {
    const registry = createRegistry([{ name: 'aws-advisor', category: 'cloud', description: 'Cloud advisor.' }])
    const indexes = buildIndexes(registry)
    const results = indexes.fuse.search('aws')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].item.category).toBe('cloud')
  })

  it('should include score in results', () => {
    const registry = createRegistry([{ name: 'test-skill', description: 'A test.' }])
    const indexes = buildIndexes(registry)
    const results = indexes.fuse.search('test-skill')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].score).toBeDefined()
    expect(typeof results[0].score).toBe('number')
  })
})

describe('trigger extraction (via buildIndexes)', () => {
  it('should extract "Triggers on" keywords', () => {
    const registry = createRegistry([
      {
        name: 'aws-advisor',
        description: 'Expert AWS advisor. Triggers on AWS, Lambda, S3, EC2, ECS. More details here.',
      },
    ])
    const indexes = buildIndexes(registry)
    const results = indexes.fuse.search('aws')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].item.triggers).toContain('AWS')
    expect(results[0].item.triggers).toContain('Lambda')
  })

  it('should extract "Use when asked to" keywords', () => {
    const registry = createRegistry([
      {
        name: 'accessibility',
        description:
          'Audit web accessibility. Use when asked to "improve accessibility", "a11y audit", "WCAG compliance". Coverage includes forms.',
      },
    ])
    const indexes = buildIndexes(registry)
    const results = indexes.fuse.search('a11y')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].item.triggers).not.toContain('"')
    expect(results[0].item.triggers).toContain('improve accessibility')
  })

  it('should extract "Keywords -" patterns', () => {
    const registry = createRegistry([
      {
        name: 'nx-workspace',
        description: 'Configure Nx monorepo workspaces. Keywords - nx, monorepo, workspace, targets. Extra info.',
      },
    ])
    const indexes = buildIndexes(registry)
    const results = indexes.fuse.search('monorepo')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].item.triggers).toContain('monorepo')
  })

  it('should return empty triggers for descriptions without patterns', () => {
    const registry = createRegistry([{ name: 'simple-skill', description: 'A simple skill that does things.' }])
    const indexes = buildIndexes(registry)
    const results = indexes.fuse.search('simple')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].item.triggers).toBe('')
  })
})

describe('usage_hint extraction (via buildIndexes)', () => {
  it('should extract text before "Use when"', () => {
    const registry = createRegistry([
      {
        name: 'test-skill',
        description: 'Audit web accessibility following WCAG 2.1. Use when asked to improve accessibility.',
      },
    ])
    const indexes = buildIndexes(registry)
    const results = indexes.fuse.search('test-skill')
    expect(results[0].item.usage_hint).toBe('Audit web accessibility following WCAG 2.1.')
  })

  it('should extract first sentence when no "Use when" pattern', () => {
    const registry = createRegistry([
      { name: 'test-skill', description: 'Expert AWS Cloud Advisor. Provides architecture guidance.' },
    ])
    const indexes = buildIndexes(registry)
    const results = indexes.fuse.search('test-skill')
    expect(results[0].item.usage_hint).toBe('Expert AWS Cloud Advisor')
  })
})

describe('search behavior', () => {
  const registry = createRegistry([
    {
      name: 'coding-guidelines',
      description: 'Apply when writing, modifying, or reviewing code. Behavioral guidelines.',
      category: 'development',
    },
    {
      name: 'aws-advisor',
      description:
        'Expert AWS Cloud Advisor. Triggers on AWS, Lambda, S3, EC2, ECS, DynamoDB. Architecture and security.',
      category: 'cloud',
    },
    {
      name: 'react-best-practices',
      description: 'React and Next.js performance optimization. Use when refactoring React components.',
      category: 'quality',
    },
    {
      name: 'security-best-practices',
      description: 'Security reviews for any codebase. Triggers on vulnerability, CVE, OWASP.',
      category: 'quality',
    },
    {
      name: 'web-accessibility',
      description: 'Audit web accessibility. Use when asked to improve accessibility, a11y audit.',
      category: 'quality',
    },
  ])

  let indexes: ReturnType<typeof buildIndexes>

  beforeAll(() => {
    indexes = buildIndexes(registry)
  })

  it('should return results sorted by relevance (exact name match first)', () => {
    const results = indexes.fuse.search('aws-advisor')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].item.name).toBe('aws-advisor')
  })

  it('should match trigger keywords with high relevance', () => {
    const results = indexes.fuse.search('Lambda')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].item.name).toBe('aws-advisor')
  })

  it('should return no results for unrelated queries', () => {
    const results = indexes.fuse.search('kubernetes-helm-chart')
    expect(results.length).toBe(0)
  })

  it('should limit results to max 5 when sliced', () => {
    const results = indexes.fuse.search('code').slice(0, 5)
    expect(results.length).toBeLessThanOrEqual(5)
  })

  it('should match category field', () => {
    const results = indexes.fuse.search('cloud')
    const cloudResults = results.filter((r) => r.item.category === 'cloud')
    expect(cloudResults.length).toBeGreaterThan(0)
  })

  it('should include all IndexSkill fields in results', () => {
    const results = indexes.fuse.search('react')
    expect(results.length).toBeGreaterThan(0)
    const item: IndexSkill = results[0].item
    expect(item).toHaveProperty('name')
    expect(item).toHaveProperty('description')
    expect(item).toHaveProperty('usage_hint')
    expect(item).toHaveProperty('category')
    expect(item).toHaveProperty('triggers')
  })
})

// Helper
function createRegistry(skills: Partial<SkillEntry>[]): Registry {
  return {
    version: '1.0.0',
    categories: {
      development: { name: 'Development', description: 'Dev skills' },
      cloud: { name: 'Cloud', description: 'Cloud skills' },
      quality: { name: 'Quality', description: 'Quality skills' },
    },
    skills: skills.map((s) => ({
      name: s.name ?? 'test-skill',
      description: s.description ?? 'A test skill.',
      category: s.category ?? 'development',
      path: s.path ?? '(development)/test-skill',
      files: s.files ?? ['SKILL.md'],
      contentHash: s.contentHash ?? 'abc123',
      ...s,
    })),
    deprecated: [],
  }
}
