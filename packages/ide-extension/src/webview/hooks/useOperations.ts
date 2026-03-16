import { useCallback, useEffect, useState } from 'react'
import type {
  ExtensionMessage,
  OperationCompletedPayload,
  OperationProgressPayload,
  OperationStartedPayload,
  ProgressLogSeverity,
} from '../../shared/messages'
import type { OperationType } from '../../shared/types'

/**
 * Tracks the state of a running lifecycle operation.
 */
export interface OperationState {
  /** The unique identifier of the operation. */
  operationId: string
  /** The type of operation being performed. */
  operation: OperationType
  /** The name of the skill being targeted. */
  skillName: string
  /** The latest status message from the extension host. */
  message: string
  /** The progress percentage increment, if applicable. */
  increment?: number
}

/**
 * Single entry in the real-time log timeline shown during batch operations.
 */
export interface LogTimelineEntry {
  operationId: string
  skillName: string
  operation: OperationType
  message: string
  severity: ProgressLogSeverity
  timestamp: number
}

/**
 * Hook to track in-flight operations and their progress messages.
 * Listens for 'operationStarted', 'operationProgress', and 'operationCompleted'.
 *
 * @returns Operation state map plus helpers for status lookup and timeline logging.
 *
 * @example
 * ```tsx
 * const { operations, clearLogTimeline } = useOperations();
 * ```
 */
export function useOperations() {
  const [operations, setOperations] = useState<Map<string, OperationState>>(new Map())
  const [logTimeline, setLogTimeline] = useState<LogTimelineEntry[]>([])

  const appendLogEntry = useCallback((entry: Omit<LogTimelineEntry, 'timestamp'>) => {
    setLogTimeline((prev) => [...prev, { ...entry, timestamp: Date.now() }])
  }, [])

  const clearLogTimeline = useCallback(() => {
    setLogTimeline([])
  }, [])

  useEffect(() => {
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
        appendLogEntry({
          operationId: payload.operationId,
          skillName: payload.skillName,
          operation: payload.operation,
          message: 'Starting...',
          severity: 'info',
        })
      } else if (message.type === 'operationProgress') {
        const payload = message.payload as OperationProgressPayload
        let resolvedSkillName: string | undefined = payload.skillName
        let resolvedOperation: OperationType = payload.operation ?? 'install'
        setOperations((prev) => {
          if (!resolvedSkillName) {
            for (const [key, state] of prev.entries()) {
              if (state.operationId === payload.operationId) {
                resolvedSkillName = key
                resolvedOperation = state.operation
                break
              }
            }
          }
          if (resolvedSkillName) {
            const state = prev.get(resolvedSkillName)
            if (state) {
              const next = new Map(prev)
              next.set(resolvedSkillName!, {
                ...state,
                message: payload.message,
                increment: payload.increment,
              })
              return next
            }
          }
          return prev
        })
        if (resolvedSkillName) {
          appendLogEntry({
            operationId: payload.operationId,
            skillName: resolvedSkillName,
            operation: resolvedOperation,
            message: payload.message,
            severity: payload.severity ?? 'info',
          })
        }
      } else if (message.type === 'operationCompleted') {
        const payload = message.payload as OperationCompletedPayload
        setOperations((prev) => {
          const next = new Map(prev)
          next.delete(payload.skillName)
          return next
        })
        appendLogEntry({
          operationId: payload.operationId,
          skillName: payload.skillName,
          operation: payload.operation,
          message: payload.success ? 'Completed' : `Failed: ${payload.errorMessage ?? 'Unknown error'}`,
          severity: payload.success ? 'info' : 'error',
        })
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [appendLogEntry])

  const isOperating = (skillName: string) => operations.has(skillName)
  const getMessage = (skillName: string) => operations.get(skillName)?.message

  return { operations, logTimeline, clearLogTimeline, isOperating, getMessage }
}
