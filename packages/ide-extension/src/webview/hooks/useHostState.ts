import { useEffect, useState } from 'react'
import type { ExtensionMessage, ScopePolicyStatePayload } from '../../shared/messages'
import type { ActionRequest, ActionState, AvailableAgent, LifecycleScope, SkillRegistry } from '../../shared/types'
import { onMessage, postMessage } from '../lib/vscode-api'

export type AppStatus = 'loading' | 'ready' | 'error' | 'offline'

export interface BatchResult {
  success: boolean
  failedSkills?: string[]
  errorMessage?: string
  results?: Array<{
    skillName: string
    success: boolean
    errorMessage?: string
    scope?: LifecycleScope
    message?: string
  }>
  action?: 'install' | 'remove' | 'update'
}

export interface LastBatchContext {
  action: 'install' | 'remove' | 'update'
  skills: string[]
  agents: string[]
  scope: ActionRequest['scope']
  method?: 'copy' | 'symlink'
}

export function useHostState() {
  const [actionState, setActionState] = useState<ActionState>({
    status: 'idle',
    actionId: null,
    action: null,
    currentStep: null,
    errorMessage: null,
    request: null,
    results: [],
    logs: [],
    rejectionMessage: null,
  })
  const [registry, setRegistry] = useState<SkillRegistry | null>(null)
  const [status, setStatus] = useState<AppStatus>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)
  const [availableAgents, setAvailableAgents] = useState<AvailableAgent[]>([])
  const [allAgents, setAllAgents] = useState<AvailableAgent[]>([])
  const [isTrusted, setIsTrusted] = useState(true)
  const [policy, setPolicy] = useState<ScopePolicyStatePayload | null>(null)
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null)
  const [isRefreshingForUpdate, setIsRefreshingForUpdate] = useState(false)

  useEffect(() => {
    const dispose = onMessage((message: ExtensionMessage) => {
      switch (message.type) {
        case 'initialize':
          setAvailableAgents(message.payload.availableAgents)
          setAllAgents(message.payload.allAgents)
          break
        case 'registryUpdate':
          setStatus(message.payload.status as AppStatus)
          setRegistry(message.payload.registry)
          setErrorMessage(message.payload.errorMessage || null)
          setFromCache(message.payload.fromCache || false)
          break
        case 'trustState':
          setIsTrusted(message.payload.isTrusted)
          break
        case 'policyState':
          setPolicy(message.payload)
          break
        case 'refreshForUpdateComplete':
          setIsRefreshingForUpdate(false)
          break
        case 'actionState':
          setActionState(message.payload)
          if (message.payload.status === 'running') {
            setBatchResult(null)
            break
          }

          if (message.payload.status === 'completed') {
            const failedResults = message.payload.results.filter((result) => !result.success)
            const failedSkills = failedResults.map((result) => result.skillName)

            setBatchResult({
              success: failedResults.length === 0,
              failedSkills: failedSkills.length > 0 ? failedSkills : undefined,
              errorMessage: message.payload.errorMessage ?? undefined,
              results: message.payload.results,
              action: message.payload.action ?? undefined,
            })
          }
          break
      }
    })

    postMessage({ type: 'webviewDidMount' })
    return dispose
  }, [])

  return {
    registry,
    status,
    errorMessage,
    fromCache,
    availableAgents,
    allAgents,
    isTrusted,
    policy,
    actionState,
    isBatchProcessing: actionState.status === 'running',
    batchResult,
    isRefreshingForUpdate,
    startRefreshForUpdate: () => setIsRefreshingForUpdate(true),
  }
}
