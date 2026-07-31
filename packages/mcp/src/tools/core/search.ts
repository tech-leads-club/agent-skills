import type { FuseResult } from 'fuse.js'

import type { IndexSkill } from '../../types'
import { getMatchQuality } from '../../utils'

const NO_MATCH_MESSAGE = 'No skills matched your query. Try different keywords.'

type SearchResponse = {
  results: Array<{
    name: string
    category: string
    usage_hint: string
    score: number
    match_quality: 'exact' | 'strong' | 'partial' | 'weak'
  }>
  message?: string
}

export function buildSearchSkillsResponse(results: Array<FuseResult<IndexSkill>>): SearchResponse {
  const scored = results
    .map((result) => {
      const score = Math.round((1 - (result.score ?? 0)) * 100)
      // why: usage_hint already carries the gist; the full description doubled the
      // payload of every search call for content the agent gets from read_skill anyway.
      return {
        name: result.item.name,
        category: result.item.category,
        usage_hint: result.item.usage_hint,
        score,
        match_quality: getMatchQuality(score),
      }
    })
    // why: fuzzy matching returns a ranked list for any query, including one nothing in the
    // registry answers. Dropping the lowest band lets the agent conclude no skill applies
    // instead of acting on a near-zero score. Anchored on the label, not a duplicated cutoff.
    .filter((result) => result.match_quality !== 'weak')

  if (scored.length === 0) return { results: [], message: NO_MATCH_MESSAGE }

  return { results: scored }
}
