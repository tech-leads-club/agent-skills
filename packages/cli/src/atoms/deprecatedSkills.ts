import type { DeprecatedEntry } from '@tech-leads-club/core'
import { getDeprecatedMap } from '@tech-leads-club/core'
import { atom } from 'jotai'
import { unwrap } from 'jotai/utils'

import { ports } from '../ports'

const deprecatedSkillsAsyncAtom = atom(async (): Promise<Map<string, DeprecatedEntry>> => {
  return getDeprecatedMap(ports)
})

export const deprecatedSkillsAtom = unwrap(deprecatedSkillsAsyncAtom, (prev) => prev ?? new Map())
