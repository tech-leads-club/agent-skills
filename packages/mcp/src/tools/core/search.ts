import type { FuseResult } from 'fuse.js'

import type { IndexSkill } from '../../types'
import { getMatchQuality } from '../../utils'

type SearchResponse = {
  results: Array<{
    name: string
    description: string
    category: string
    usage_hint: string
    score: number
    match_quality: 'exact' | 'strong' | 'partial' | 'weak'
  }>
  message?: string
}

export function buildSearchSkillsResponse(results: Array<FuseResult<IndexSkill>>): SearchResponse {
  if (results.length === 0) return { results: [], message: 'No skills matched your query. Try different keywords.' }

  return {
    results: results.map((result) => {
      const score = Math.round((1 - (result.score ?? 0)) * 100)
      return {
        name: result.item.name,
        description: result.item.description,
        category: result.item.category,
        usage_hint: result.item.usage_hint,
        score,
        match_quality: getMatchQuality(score),
      }
    }),
  }
}
