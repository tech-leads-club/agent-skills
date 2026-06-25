import { describe, expect, it, jest } from '@jest/globals'

import type { CorePorts, EnvPort, FileSystemPort, HttpPort, LoggerPort, PackageResolverPort, PathsPort, ShellPort } from '../../ports'

import {
  DEFAULT_PROVIDERS,
  estimateCosts,
  estimateSkillTokens,
  estimateTokensFromChars,
  estimateTokensFromText,
} from '../token-estimator.service'

const createPorts = (fileMap: Record<string, string> = {}): CorePorts => {
  const dirEntries: Record<string, { name: string; isDirectory: () => boolean }[]> = {}

  for (const path of Object.keys(fileMap)) {
    const parts = path.split('/')
    const dir = parts.slice(0, -1).join('/')
    const name = parts[parts.length - 1]
    if (!dirEntries[dir]) dirEntries[dir] = []
    dirEntries[dir].push({ name, isDirectory: () => false })
  }

  const existingPaths = new Set([...Object.keys(fileMap), ...Object.keys(dirEntries)])

  const fs = {
    existsSync: jest.fn((p: string) => existingPaths.has(p)),
    readFile: jest.fn(async (p: string) => {
      if (fileMap[p] !== undefined) return fileMap[p]
      throw new Error('not found')
    }),
    readdir: jest.fn(async (p: string) => dirEntries[p] ?? []),
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

describe('estimateTokensFromChars', () => {
  it('returns 0 for 0 chars', () => {
    expect(estimateTokensFromChars(0)).toBe(0)
  })

  it('returns 0 for negative chars', () => {
    expect(estimateTokensFromChars(-10)).toBe(0)
  })

  it('returns ceil(charCount / 4)', () => {
    expect(estimateTokensFromChars(1)).toBe(1)
    expect(estimateTokensFromChars(4)).toBe(1)
    expect(estimateTokensFromChars(5)).toBe(2)
    expect(estimateTokensFromChars(100)).toBe(25)
    expect(estimateTokensFromChars(101)).toBe(26)
  })
})

describe('estimateTokensFromText', () => {
  it('returns 0 for empty string', () => {
    expect(estimateTokensFromText('')).toBe(0)
  })

  it('returns accurate BPE token count for English text', () => {
    const tokens = estimateTokensFromText('Hello, world!')
    expect(tokens).toBe(4)
  })

  it('handles markdown with code blocks', () => {
    const text = '# Heading\n\nSome paragraph text.\n\n```js\nconst x = 1;\n```'
    const tokens = estimateTokensFromText(text)
    expect(tokens).toBeGreaterThan(0)
  })
})

describe('estimateSkillTokens', () => {
  it('returns zero tokens for a missing directory', async () => {
    const ports = createPorts({})
    const result = await estimateSkillTokens(ports, '/missing', 'test', 'cursor', 'local')

    expect(result.descriptionTokens).toBe(0)
    expect(result.bodyTokens).toBe(0)
    expect(result.resourceTokens).toBe(0)
    expect(result.totalTokens).toBe(0)
    expect(result.isHighCost).toBe(false)
  })

  it('separates description, body, and resource tokens', async () => {
    const desc = 'A skill that does things and stuff for testing purposes.'
    const body = 'Some instructions here.'
    const skillMd = `---\nname: test\ndescription: ${desc}\n---\n${body}`
    const refContent = 'Reference material here.'

    const ports = createPorts({
      '/skills/test/SKILL.md': skillMd,
      '/skills/test/references/REF.md': refContent,
    })

    const result = await estimateSkillTokens(ports, '/skills/test', 'test', 'cursor', 'local')

    expect(result.descriptionTokens).toBe(estimateTokensFromText(desc))
    expect(result.bodyTokens).toBe(estimateTokensFromText(body))
    expect(result.resourceTokens).toBe(estimateTokensFromText(refContent))
    expect(result.totalTokens).toBe(result.descriptionTokens + result.bodyTokens + result.resourceTokens)
  })

  it('flags high-cost skills based on total tokens', async () => {
    const bigBody = 'This is a realistic skill body with varied content for testing. '.repeat(500)
    const skillMd = `---\nname: big\ndescription: A big skill.\n---\n${bigBody}`
    const ports = createPorts({
      '/skills/big/SKILL.md': skillMd,
    })

    const result = await estimateSkillTokens(ports, '/skills/big', 'big', 'cursor', 'local', 5000)

    expect(result.totalTokens).toBeGreaterThan(5000)
    expect(result.isHighCost).toBe(true)
  })

  it('handles SKILL.md without frontmatter', async () => {
    const ports = createPorts({
      '/skills/plain/SKILL.md': 'Just some plain text instructions.',
    })

    const result = await estimateSkillTokens(ports, '/skills/plain', 'plain', 'cursor', 'local')

    expect(result.descriptionTokens).toBe(0)
    expect(result.bodyTokens).toBeGreaterThan(0)
  })
})

describe('estimateCosts', () => {
  it('calculates cost for default providers', () => {
    const costs = estimateCosts(1_000_000)

    expect(costs).toHaveLength(DEFAULT_PROVIDERS.length)
    expect(costs[0].estimatedInputCost).toBe(15)
    expect(costs[1].estimatedInputCost).toBe(3)
    expect(costs[2].estimatedInputCost).toBe(2.5)
  })

  it('returns zero cost for zero tokens', () => {
    const costs = estimateCosts(0)

    for (const cost of costs) {
      expect(cost.estimatedInputCost).toBe(0)
    }
  })

  it('uses custom providers', () => {
    const customProviders = [
      { name: 'Custom', model: 'test', inputCostPerMTok: 10, outputCostPerMTok: 20 },
    ]
    const costs = estimateCosts(500_000, customProviders)

    expect(costs).toHaveLength(1)
    expect(costs[0].estimatedInputCost).toBe(5)
  })
})
