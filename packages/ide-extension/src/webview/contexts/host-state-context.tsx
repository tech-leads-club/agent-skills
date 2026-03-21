import { createContext, useContext } from 'react'
import type { BatchResult } from '../hooks/useHostState'
import type { AppStatus } from '../hooks/useHostState'
import type { ScopePolicyStatePayload } from '../../shared/messages'
import type { ActionState, AvailableAgent, InstalledSkillsMap, SkillRegistry } from '../../shared/types'

export interface HostStateContextValue {
  registry: SkillRegistry | null
  status: AppStatus
  errorMessage: string | null
  fromCache: boolean
  availableAgents: AvailableAgent[]
  allAgents: AvailableAgent[]
  isTrusted: boolean
  policy: ScopePolicyStatePayload | null
  actionState: ActionState
  isBatchProcessing: boolean
  batchResult: BatchResult | null
  isRefreshingForUpdate: boolean
  installedSkills: InstalledSkillsMap
  startRefreshForUpdate: () => void
}

export const HostStateContext = createContext<HostStateContextValue | null>(null)

/**
 * Returns the nearest HostStateContext value, throwing if no provider is found.
 * Covers extension-pushed state: registry, agents, policy, installed skills, and batch status.
 */
export function useHostStateContext(): HostStateContextValue {
  const ctx = useContext(HostStateContext)
  if (!ctx) throw new Error('useHostStateContext must be used inside HostStateContext.Provider')
  return ctx
}
