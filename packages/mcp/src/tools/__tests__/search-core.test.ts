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
