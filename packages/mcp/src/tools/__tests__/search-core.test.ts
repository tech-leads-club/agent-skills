import type { FuseResult } from 'fuse.js'

import type { IndexSkill } from '../../types'
import { buildSearchSkillsResponse } from '../core/search'

describe('search-core', () => {
  it('should return empty results with message when no matches', () => {
    const output = buildSearchSkillsResponse([])
    expect(output.results).toEqual([])
    expect(output.message).toContain('No skills matched')
  })

  it('should map fuse results to tool response format', () => {
    const output = buildSearchSkillsResponse([createResult('react-best-practices', 'quality', 0.12)])
    expect(output.results).toHaveLength(1)
    expect(output.results[0]).toMatchObject({
      name: 'react-best-practices',
      category: 'quality',
    })
    expect(output.results[0].score).toBe(88)
    expect(output.results[0].match_quality).toBe('exact')
  })

  it('should drop weak matches so an unanswerable query returns no results', () => {
    // why: fuse scores near 1.0 map to near-zero relevance — the ranked-but-irrelevant tail
    // that fuzzy matching returns for a query nothing answers
    const output = buildSearchSkillsResponse([
      createResult('unrelated-a', 'tooling', 0.96),
      createResult('unrelated-b', 'quality', 0.97),
    ])
    expect(output.results).toEqual([])
    expect(output.message).toContain('No skills matched')
  })

  it('should keep relevant matches and drop only the weak ones', () => {
    const output = buildSearchSkillsResponse([
      createResult('docs-writer', 'documentation', 0.48),
      createResult('unrelated-noise', 'tooling', 0.96),
    ])
    expect(output.results.map((r) => r.name)).toEqual(['docs-writer'])
    expect(output.message).toBeUndefined()
  })
})

function createResult(name: string, category: string, score: number): FuseResult<IndexSkill> {
  return {
    item: {
      name,
      description: 'Sample description.',
      usage_hint: 'Sample usage.',
      category,
      triggers: 'sample',
    },
    refIndex: 0,
    score,
  }
}
