import { MAX_REFERENCE_RESPONSE_CHARS, buildReferenceFilesOutput, getInvalidReferencePaths } from '../core/fetcher'
import { createSkillEntry } from './helpers'

describe('fetcher-core', () => {
  it('should return invalid paths that are outside optional references', () => {
    const skill = createSkillEntry({
      files: ['SKILL.md', 'references/a.md', 'scripts/run.sh', 'assets/icon.svg'],
    })
    const invalid = getInvalidReferencePaths(skill, ['references/a.md', 'invalid/file.md'])
    expect(invalid).toEqual(['invalid/file.md'])
  })

  it('should build output for every requested file', () => {
    const output = buildReferenceFilesOutput(
      ['references/a.md', 'scripts/run.sh'],
      new Map([
        ['references/a.md', 'alpha'],
        ['scripts/run.sh', 'script'],
      ]),
    )

    expect(output).toContain('## references/a.md')
    expect(output).toContain('alpha')
    expect(output).toContain('## scripts/run.sh')
    expect(output).toContain('script')
  })

  it('should include failed paths note on partial failure', () => {
    const output = buildReferenceFilesOutput(
      ['references/a.md', 'scripts/bad.sh'],
      new Map([['references/a.md', 'ok']]),
    )

    expect(output).toContain('## references/a.md')
    expect(output).toContain('ok')
    expect(output).toContain('Failed to fetch: scripts/bad.sh')
  })

  it('should return failure note only when all files are missing', () => {
    const output = buildReferenceFilesOutput(['scripts/a.sh'], new Map())
    expect(output).toBe('Failed to fetch: scripts/a.sh')
  })

  it('should keep the whole response within the character budget', () => {
    const contents = new Map([
      ['references/a.md', 'a'.repeat(40)],
      ['references/b.md', 'b'.repeat(40)],
    ])

    const output = buildReferenceFilesOutput(['references/a.md', 'references/b.md'], contents, 50)

    expect(output).toContain('## references/a.md')
    expect(output).not.toContain('## references/b.md')
    expect(output).toContain('not returned: references/b.md')
    expect(output).toContain('Call fetch_skill_files again with fewer paths')
  })

  it('should truncate a file that overflows the budget and say so', () => {
    const contents = new Map([['references/big.md', 'x'.repeat(10_000)]])

    const output = buildReferenceFilesOutput(['references/big.md'], contents, 3_000)

    expect(output).toContain('[truncated: first 3000 of 10000 chars]')
    expect(output).toContain("'references/big.md' was cut short")
    expect(output).not.toContain('x'.repeat(3_001))
  })

  it('should not truncate below the useful threshold, omitting instead', () => {
    const contents = new Map([
      ['references/a.md', 'a'.repeat(2_900)],
      ['references/b.md', 'b'.repeat(5_000)],
    ])

    const output = buildReferenceFilesOutput(['references/a.md', 'references/b.md'], contents, 3_000)

    expect(output).toContain('## references/a.md')
    expect(output).toContain('not returned: references/b.md')
    expect(output).not.toContain('truncated')
  })

  it('should expose a budget that stays under the 25k-token tool response cap', () => {
    expect(MAX_REFERENCE_RESPONSE_CHARS).toBeLessThanOrEqual(100_000)
  })
})
