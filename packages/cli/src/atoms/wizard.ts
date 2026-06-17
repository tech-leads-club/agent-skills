import { atom } from 'jotai'

import type { AgentType, SkillInfo } from '../types'

export const selectedAgentsAtom = atom<AgentType[]>([])
export const selectedSkillsAtom = atom<SkillInfo[]>([])
