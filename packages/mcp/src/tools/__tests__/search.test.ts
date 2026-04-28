import { buildIndexes } from '../../registry'
import type { Registry, SkillEntry } from '../../types'

describe('search result scoring', () => {
  it('should return high score for exact name match', () => {
    const registry = createRegistry([
      { name: 'coding-guidelines', description: 'Guidelines for writing code.' },
      { name: 'aws-advisor', description: 'AWS cloud advisor.' },
    ])

    const { fuse } = buildIndexes(registry)
    const results = fuse.search('coding-guidelines')

    expect(results.length).toBeGreaterThan(0)
    expect(results[0].item.name).toBe('coding-guidelines')

    const score = mapScore(results[0].score)
    expect(score).toBeGreaterThanOrEqual(70)
  })

  it('should return higher score for name match than description match', () => {
    const registry = createRegistry([
      { name: 'react-best-practices', description: 'Performance optimization for React.' },
      { name: 'coding-guidelines', description: 'React patterns and coding best practices.' },
    ])

    const { fuse } = buildIndexes(registry)
    const results = fuse.search('react')

    expect(results.length).toBeGreaterThan(0)
    expect(results[0].item.name).toBe('react-best-practices')
  })

  it('should boost trigger keyword matches', () => {
    const registry = createRegistry([
      { name: 'aws-advisor', description: 'Expert advisor. Triggers on AWS, Lambda, S3, EC2. Architecture guidance.' },
      { name: 'cloud-deploy', description: 'Deploy to multiple cloud providers including AWS, GCP, Azure.' },
    ])

    const { fuse } = buildIndexes(registry)
    const results = fuse.search('Lambda')

    expect(results.length).toBeGreaterThan(0)
    // aws-advisor has "Lambda" in triggers (extracted), so it should rank first
    expect(results[0].item.name).toBe('aws-advisor')
  })
})

describe('search result format', () => {
  const registry = createRegistry([
    {
      name: 'coding-guidelines',
      description: 'Apply when writing code. Behavioral guidelines to reduce LLM mistakes.',
      category: 'development',
    },
    { name: 'aws-advisor', description: 'Expert AWS Cloud Advisor. Triggers on AWS, Lambda, S3.', category: 'cloud' },
  ])

  it('should include all fields needed by the search tool output', () => {
    const { fuse } = buildIndexes(registry)
    const results = fuse.search('aws')

    expect(results.length).toBeGreaterThan(0)

    const result = results[0]
    const score = mapScore(result.score)

    const output = {
      name: result.item.name,
      description: result.item.description,
      category: result.item.category,
      usage_hint: result.item.usage_hint,
      score,
      match_quality: getMatchQuality(score),
    }

    expect(output.name).toBe('aws-advisor')
    expect(output.category).toBe('cloud')
    expect(output.description).toContain('AWS')
    expect(output.usage_hint).toBeDefined()
    expect(output.score).toBeGreaterThan(0)
    expect(output.score).toBeLessThanOrEqual(100)
    expect(['exact', 'strong', 'partial', 'weak']).toContain(output.match_quality)
  })
})

describe('match quality mapping', () => {
  it.each([
    [100, 'exact'],
    [90, 'exact'],
    [85, 'exact'],
    [84, 'strong'],
    [70, 'strong'],
    [65, 'strong'],
    [64, 'partial'],
    [50, 'partial'],
    [45, 'partial'],
    [44, 'weak'],
    [20, 'weak'],
    [0, 'weak'],
  ] as const)('score %d should map to %s', (score, expected) => {
    expect(getMatchQuality(score)).toBe(expected)
  })
})

function mapScore(fuseScore: number | undefined): number {
  return Math.round((1 - (fuseScore ?? 0)) * 100)
}

type MatchQuality = 'exact' | 'strong' | 'partial' | 'weak'

function getMatchQuality(score: number): MatchQuality {
  if (score >= 85) return 'exact'
  if (score >= 65) return 'strong'
  if (score >= 45) return 'partial'
  return 'weak'
}

function createRegistry(skills: Partial<SkillEntry>[]): Registry {
  return {
    version: '1.0.0',
    categories: {
      development: { name: 'Development', description: 'Dev skills' },
      cloud: { name: 'Cloud', description: 'Cloud skills' },
      quality: { name: 'Quality', description: 'Quality skills' },
      architecture: { name: 'Architecture', description: 'Architecture skills' },
      security: { name: 'Security', description: 'Security skills' },
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
