import { createHash } from 'node:crypto'

import { buildCdnNpmBase, buildRegistryUrl, buildSkillsBaseUrl, resolveCdnRef } from '../cdn'
import { computeContentHash, decodeSkillText, fetchAndVerifySkillFiles } from '../integrity'

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
      async () => Buffer.from('# ok'),
    )

    expect(decodeSkillText(verified.get('SKILL.md') as Uint8Array)).toBe('# ok')
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
        async () => Buffer.from('# tampered'),
      ),
    ).rejects.toThrow(/Checksum mismatch/)
  })

  it('accepts binary bytes that are not valid UTF-8', async () => {
    const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0x00, 0xc0])
    const files = new Map<string, Uint8Array>([['assets/docker/wallpaper.jpg', jpeg]])
    const contentHash = computeContentHash(files)

    const verified = await fetchAndVerifySkillFiles(
      {
        name: 'demo',
        path: '(web-automation)/demo',
        files: ['assets/docker/wallpaper.jpg'],
        contentHash,
      },
      'https://cdn.example/skills/',
      async () => jpeg,
    )

    expect(Buffer.from(verified.get('assets/docker/wallpaper.jpg') as Uint8Array)).toEqual(Buffer.from(jpeg))
  })
})

describe('cdn pinning', () => {
  afterEach(() => {
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
