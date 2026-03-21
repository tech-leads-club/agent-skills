import { createContext, useContext } from 'react'
import type { useAppState } from '../hooks/useAppState'

export type AppStateContextValue = ReturnType<typeof useAppState>

export const AppStateContext = createContext<AppStateContextValue | null>(null)

/**
 * Returns the nearest AppStateContext value, throwing if no provider is found.
 * Covers navigation state and selection helpers for the webview flow.
 */
export function useAppStateContext(): AppStateContextValue {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppStateContext must be used inside AppStateContext.Provider')
  return ctx
}
