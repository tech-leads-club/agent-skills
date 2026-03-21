import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { ScopePolicyStatePayload } from '../../shared/messages'
import type { ActionState, AvailableAgent, InstalledSkillsMap, SkillRegistry } from '../../shared/types'
import type { AppStatus, BatchResult } from '../hooks/useHostState'
import { useHostState } from '../hooks/useHostState'
import { useInstalledState } from '../hooks/useInstalledState'

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

export function HostStateProvider({ children }: { children: ReactNode }) {
  const hostState = useHostState()
  const { installedSkills } = useInstalledState()

  const value = useMemo<HostStateContextValue>(
    () => ({
      registry: hostState.registry,
      status: hostState.status,
      errorMessage: hostState.errorMessage,
      fromCache: hostState.fromCache,
      availableAgents: hostState.availableAgents,
      allAgents: hostState.allAgents,
      isTrusted: hostState.isTrusted,
      policy: hostState.policy,
      actionState: hostState.actionState,
      isBatchProcessing: hostState.isBatchProcessing,
      batchResult: hostState.batchResult,
      isRefreshingForUpdate: hostState.isRefreshingForUpdate,
      installedSkills,
      startRefreshForUpdate: hostState.startRefreshForUpdate,
    }),
    [hostState, installedSkills],
  )

  return <HostStateContext.Provider value={value}>{children}</HostStateContext.Provider>
}
