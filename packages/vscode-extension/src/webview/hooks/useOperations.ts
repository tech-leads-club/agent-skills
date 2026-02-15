import { useCallback, useEffect, useState } from 'react'
import type {
  AgentPickResultPayload,
  ExtensionMessage,
  OperationCompletedPayload,
  OperationProgressPayload,
  OperationStartedPayload,
  ScopePickResultPayload,
} from '../../shared/messages'
import type { OperationType } from '../../shared/types'

/**
 * Tracks the state of a running lifecycle operation.
 */
export interface OperationState {
  operationId: string
  operation: OperationType
  skillName: string
  message: string // Progress message
  increment?: number // Optional progress %
  pending?: boolean // True when awaiting QuickPick selection
}

/**
 * Hook to track in-flight operations and their progress messages.
 * Listens for 'operationStarted', 'operationProgress', and 'operationCompleted'.
 */
export function useOperations() {
  const [operations, setOperations] = useState<Map<string, OperationState>>(new Map())

  /**
   * Marks a skill as "pending" (awaiting QuickPick selection).
   * Called by the UI immediately when Add/Remove is clicked.
   */
  const markPending = useCallback((skillName: string, action: 'add' | 'remove') => {
    setOperations((prev) => {
      const next = new Map(prev)
      next.set(skillName, {
        operationId: '', // No real operation yet
        operation: action === 'add' ? 'install' : 'remove',
        skillName,
        message: 'Selecting...',
        pending: true,
      })
      return next
    })
  }, [])

  /**
   * Clears the pending state for a skill (e.g. user cancelled QuickPick).
   */
  const clearPending = useCallback((skillName: string) => {
    setOperations((prev) => {
      const current = prev.get(skillName)
      // Only clear if still in pending state (not yet replaced by a real operation)
      if (current?.pending) {
        const next = new Map(prev)
        next.delete(skillName)
        return next
      }
      return prev
    })
  }, [])

  useEffect(() => {
    // Handler for incoming messages
    const handleMessage = (event: MessageEvent) => {
      const message = event.data as ExtensionMessage

      if (message.type === 'operationStarted') {
        const payload = message.payload as OperationStartedPayload
        setOperations((prev) => {
          const next = new Map(prev)
          next.set(payload.skillName, {
            operationId: payload.operationId,
            operation: payload.operation,
            skillName: payload.skillName,
            message: 'Starting...',
          })
          return next
        })
      } else if (message.type === 'operationProgress') {
        const payload = message.payload as OperationProgressPayload
        setOperations((prev) => {
          // Find operation by ID (value), not key (skillName)
          // Since we track by skillName for UI lookups, we iterate
          let skillName: string | undefined
          for (const [key, state] of prev.entries()) {
            if (state.operationId === payload.operationId) {
              skillName = key
              break
            }
          }

          if (skillName) {
            const next = new Map(prev)
            const state = next.get(skillName)!
            next.set(skillName, {
              ...state,
              message: payload.message,
              increment: payload.increment,
            })
            return next
          }
          return prev
        })
      } else if (message.type === 'operationCompleted') {
        const payload = message.payload as OperationCompletedPayload
        setOperations((prev) => {
          const next = new Map(prev)
          next.delete(payload.skillName)
          return next
        })
      } else if (message.type === 'agentPickResult') {
        const payload = message.payload as AgentPickResultPayload
        if (payload.agents === null) {
          // User cancelled agent pick → clear pending state
          setOperations((prev) => {
            const current = prev.get(payload.skillName)
            if (current?.pending) {
              const next = new Map(prev)
              next.delete(payload.skillName)
              return next
            }
            return prev
          })
        }
      } else if (message.type === 'scopePickResult') {
        const payload = message.payload as ScopePickResultPayload
        if (payload.scope === null) {
          // User cancelled scope pick → clear pending state
          setOperations((prev) => {
            const current = prev.get(payload.skillName)
            if (current?.pending) {
              const next = new Map(prev)
              next.delete(payload.skillName)
              return next
            }
            return prev
          })
        }
        // If scope is selected, the pending state will be replaced by operationStarted
      }
    }

    // Add listener
    window.addEventListener('message', handleMessage)

    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  const isOperating = (skillName: string) => operations.has(skillName)
  const getMessage = (skillName: string) => operations.get(skillName)?.message

  return { operations, isOperating, getMessage, markPending, clearPending }
}
