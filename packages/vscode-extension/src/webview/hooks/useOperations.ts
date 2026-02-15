import { useEffect, useState } from 'react'
import type {
  ExtensionMessage,
  OperationCompletedPayload,
  OperationProgressPayload,
  OperationStartedPayload,
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
}

/**
 * Hook to track in-flight operations and their progress messages.
 * Listens for 'operationStarted', 'operationProgress', and 'operationCompleted'.
 */
export function useOperations() {
  const [operations, setOperations] = useState<Map<string, OperationState>>(new Map())

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
          // Remove operation regardless of success/failure
          // In a real app, we might want to show error state, but here we clear it
          // as the toast notification handles the result feedback.
          // Wait, if we clear it, the UI won't show anything. But the card has no ongoing op.
          next.delete(payload.skillName)
          return next
        })
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

  return { operations, isOperating, getMessage }
}
