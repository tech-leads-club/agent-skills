import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import type { LastBatchContext } from '../hooks/useHostState'
import { postMessage } from '../lib/vscode-api'
import { useAppStateContext } from './app-state-context'
import { useHostStateContext } from './host-state-context'

interface ActionsContextValue {
  handleRunAction: (method?: 'copy' | 'symlink') => void
  handleExecuteUpdate: (skills: string[]) => void
  handleUpdateFromHome: () => void
  handleRetry: () => void
}

const ActionsContext = createContext<ActionsContextValue | null>(null)

export function ActionsProvider({ children }: { children: ReactNode }) {
  const [lastBatchContext, setLastBatchContext] = useState<LastBatchContext | null>(null)
  const appState = useAppStateContext()
  const hostState = useHostStateContext()

  const handleRunAction = useCallback(
    (method?: 'copy' | 'symlink') => {
      const action =
        appState.currentAction === 'install' ? 'install' : appState.currentAction === 'update' ? 'update' : 'remove'
      const agents = action === 'update' ? [] : appState.selectedAgents
      if (
        (action !== 'update' && (appState.selectedSkills.length === 0 || agents.length === 0)) ||
        (action === 'update' && appState.selectedSkills.length === 0)
      )
        return

      const batchContext: LastBatchContext = {
        action,
        skills: appState.selectedSkills,
        agents,
        scope: appState.activeScope,
        method: action === 'install' ? (method ?? appState.installMethod) : undefined,
      }

      setLastBatchContext(batchContext)
      appState.goToStatus()
      postMessage({ type: 'requestRunAction', payload: batchContext })
    },
    [appState],
  )

  const handleExecuteUpdate = useCallback(
    (skills: string[]) => {
      const batchContext: LastBatchContext = { action: 'update', skills, agents: [], scope: appState.activeScope }
      setLastBatchContext(batchContext)
      appState.goToStatus()
      postMessage({ type: 'requestRunAction', payload: batchContext })
    },
    [appState],
  )

  const handleUpdateFromHome = useCallback(() => {
    hostState.startRefreshForUpdate()
    appState.goToOutdatedSkills()
    postMessage({ type: 'requestRefreshForUpdate' })
  }, [appState, hostState.startRefreshForUpdate])

  const handleRetry = useCallback(() => {
    if (!lastBatchContext || !hostState.batchResult?.failedSkills?.length) return
    const retrySkills =
      lastBatchContext.action === 'update'
        ? hostState.batchResult.failedSkills
        : hostState.batchResult.failedSkills.filter((skill) => lastBatchContext.skills.includes(skill))
    if (retrySkills.length === 0) return

    postMessage({ type: 'requestRunAction', payload: { ...lastBatchContext, skills: retrySkills } })
  }, [hostState.batchResult, lastBatchContext])

  return (
    <ActionsContext.Provider value={{ handleRunAction, handleExecuteUpdate, handleUpdateFromHome, handleRetry }}>
      {children}
    </ActionsContext.Provider>
  )
}

export function useActionsContext(): ActionsContextValue {
  const ctx = useContext(ActionsContext)
  if (!ctx) throw new Error('useActionsContext must be used within ActionsProvider')
  return ctx
}
