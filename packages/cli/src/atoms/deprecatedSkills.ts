import { atom } from 'jotai'
import { unwrap } from 'jotai/utils'

import { getDeprecatedMap } from '../services/registry'
import type { DeprecatedEntry } from '../types'

const deprecatedSkillsAsyncAtom = atom(async (): Promise<Map<string, DeprecatedEntry>> => {
  return getDeprecatedMap()
})

export const deprecatedSkillsAtom = unwrap(deprecatedSkillsAsyncAtom, (prev) => prev ?? new Map())
