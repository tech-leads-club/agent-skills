import { useCallback, useEffect, useState } from 'react'
import type {
  AgentPickResultPayload,
  ExtensionMessage,
  OperationCompletedPayload,
  OperationProgressPayload,
  OperationStartedPayload,
  ScopePickResultPayload,
} from '../../shared/messages'
import type { ProgressLogSeverity } from '../../shared/messages'
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
  /** Whether the operation is awaiting user input (e.g., QuickPick). */
  pending?: boolean
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
 * @returns Operation state map plus helpers for status lookup and pending markers.
 *
 * @example
 * ```tsx
 * const { operations, markPending, clearPending } = useOperations();
 * ```
 */
export function useOperations() {
  const [operations, setOperations] = useState<Map<string, OperationState>>(new Map())
  const [logTimeline, setLogTimeline] = useState<LogTimelineEntry[]>([])

  const appendLogEntry = useCallback(
    (entry: Omit<LogTimelineEntry, 'timestamp'>) => {
      setLogTimeline((prev) => [...prev, { ...entry, timestamp: Date.now() }])
    },
    [],
  )

  const clearLogTimeline = useCallback(() => {
    setLogTimeline([])
  }, [])

  /**
   * Marks a skill as "pending" (awaiting QuickPick selection).
   * Called by the UI immediately when Add/Remove/Repair is clicked.
   *
   * @param skillName - Skill currently awaiting picker completion.
   * @param action - Pending user action requested for the skill.
   * @returns Nothing.
   *
   * @example
   * ```typescript
   * markPending('my-skill', 'add');
   * ```
   */
  const markPending = useCallback((skillName: string, action: 'add' | 'remove' | 'repair') => {
    setOperations((prev) => {
      const next = new Map(prev)
      let operation: OperationType

      switch (action) {
        case 'add':
          operation = 'install'
          break
        case 'remove':
          operation = 'remove'
          break
        case 'repair':
          operation = 'repair'
          break
      }

      next.set(skillName, {
        operationId: '',
        operation,
        skillName,
        message: 'Selecting...',
        pending: true,
      })
      return next
    })
  }, [])

  /**
   * Clears the pending state for a skill (e.g. user cancelled QuickPick).
   *
   * @param skillName - Skill whose pending state should be removed.
   * @returns Nothing.
   *
   * @example
   * ```typescript
   * clearPending('my-skill');
   * ```
   */
  const clearPending = useCallback((skillName: string) => {
    setOperations((prev) => {
      const current = prev.get(skillName)
      if (current?.pending) {
        const next = new Map(prev)
        next.delete(skillName)
        return next
      }
      return prev
    })
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
      } else if (message.type === 'agentPickResult') {
        const payload = message.payload as AgentPickResultPayload
        if (payload.agents === null) {
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
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [appendLogEntry])

  const isOperating = (skillName: string) => operations.has(skillName)
  const getMessage = (skillName: string) => operations.get(skillName)?.message

  return { operations, logTimeline, clearLogTimeline, isOperating, getMessage, markPending, clearPending }
}
