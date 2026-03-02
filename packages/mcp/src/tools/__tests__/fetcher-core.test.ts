import { fetchReferenceFileContents, getInvalidReferencePaths } from '../core/fetcher'
import { createSkillEntry } from './helpers'

describe('fetcher-core', () => {
  it('should return invalid paths that are outside optional references', () => {
    const skill = createSkillEntry({
      files: ['SKILL.md', 'references/a.md', 'scripts/run.sh', 'assets/icon.svg'],
    })
    const invalid = getInvalidReferencePaths(skill, ['references/a.md', 'invalid/file.md'])
    expect(invalid).toEqual(['invalid/file.md'])
  })

  it('should build output for successful fetches', async () => {
    const skill = createSkillEntry({
      path: '(development)/demo',
      files: ['SKILL.md', 'references/a.md', 'scripts/run.sh'],
    })

    const output = await fetchReferenceFileContents(skill, ['references/a.md', 'scripts/run.sh'], async (url) => {
      if (url.endsWith('references/a.md')) return 'alpha'
      return 'script'
    })

    expect(output).toContain('## references/a.md')
    expect(output).toContain('alpha')
    expect(output).toContain('## scripts/run.sh')
    expect(output).toContain('script')
  })

  it('should include failed paths note on partial failure', async () => {
    const skill = createSkillEntry({
      path: '(development)/demo',
      files: ['SKILL.md', 'references/a.md', 'scripts/bad.sh'],
    })

    const output = await fetchReferenceFileContents(skill, ['references/a.md', 'scripts/bad.sh'], async (url) => {
      if (url.endsWith('scripts/bad.sh')) throw new Error('boom')
      return 'ok'
    })

    expect(output).toContain('## references/a.md')
    expect(output).toContain('ok')
    expect(output).toContain('Failed to fetch: scripts/bad.sh')
  })

  it('should return failure note only when all files fail', async () => {
    const skill = createSkillEntry({
      path: '(development)/demo',
      files: ['SKILL.md', 'scripts/a.sh'],
    })

    const output = await fetchReferenceFileContents(skill, ['scripts/a.sh'], async () => {
      throw new Error('boom')
    })

    expect(output).toBe('Failed to fetch: scripts/a.sh')
  })
})
