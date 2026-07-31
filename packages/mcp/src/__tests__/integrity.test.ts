import { createHash } from 'node:crypto'

import { computeContentHash, fetchAndVerifySkillFiles } from '../integrity'
import { buildCdnNpmBase, buildRegistryUrl, buildSkillsBaseUrl, resetCdnRefForTests, resolveCdnRef } from '../cdn'

describe('computeContentHash', () => {
  it('matches the registry algorithm for sorted path + bytes', () => {
    const files = new Map<string, string>([
      ['references/a.md', 'ref'],
      ['SKILL.md', '# hello'],
    ])

    const expected = createHash('sha256')
    expected.update('SKILL.md')
    expected.update('# hello')
    expected.update('references/a.md')
    expected.update('ref')

    expect(computeContentHash(files)).toBe(expected.digest('hex'))
  })

  it('does not match hashing only SKILL.md body (fork approach)', () => {
    const files = new Map<string, string>([
      ['SKILL.md', '# hello'],
      ['references/a.md', 'ref'],
    ])
    const forkHash = createHash('sha256').update('# hello', 'utf8').digest('hex')
    expect(computeContentHash(files)).not.toBe(forkHash)
  })
})

describe('fetchAndVerifySkillFiles', () => {
  it('returns verified files when hash matches', async () => {
    const files = new Map<string, string>([['SKILL.md', '# ok']])
    const contentHash = computeContentHash(files)

    const verified = await fetchAndVerifySkillFiles(
      {
        name: 'demo',
        path: '(quality)/demo',
        files: ['SKILL.md'],
        contentHash,
      },
      'https://cdn.example/skills/',
      async () => '# ok',
    )

    expect(verified.get('SKILL.md')).toBe('# ok')
  })

  it('rejects checksum mismatch', async () => {
    await expect(
      fetchAndVerifySkillFiles(
        {
          name: 'demo',
          path: '(quality)/demo',
          files: ['SKILL.md'],
          contentHash: 'deadbeef',
        },
        'https://cdn.example/skills/',
        async () => '# tampered',
      ),
    ).rejects.toThrow(/Checksum mismatch/)
  })
})

describe('cdn pinning', () => {
  afterEach(() => {
    resetCdnRefForTests()
    delete process.env.SKILLS_CDN_REF
  })

  it('uses SKILLS_CDN_REF when set', async () => {
    process.env.SKILLS_CDN_REF = '1.2.3'
    await expect(resolveCdnRef()).resolves.toBe('1.2.3')
    expect(buildRegistryUrl('1.2.3')).toBe(
      'https://cdn.jsdelivr.net/npm/@tech-leads-club/skills-catalog@1.2.3/skills-registry.json',
    )
    expect(buildSkillsBaseUrl('1.2.3')).toBe(
      'https://cdn.jsdelivr.net/npm/@tech-leads-club/skills-catalog@1.2.3/skills/',
    )
    expect(buildCdnNpmBase('1.2.3')).not.toContain('@latest')
  })
})
