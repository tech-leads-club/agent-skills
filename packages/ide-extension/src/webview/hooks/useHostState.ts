import { useEffect, useState } from 'react'
import type { ExtensionMessage, ScopePolicyStatePayload } from '../../shared/messages'
import type { AvailableAgent, LifecycleScope, SkillRegistry } from '../../shared/types'
import { onMessage, postMessage } from '../lib/vscode-api'

export type AppStatus = 'loading' | 'ready' | 'error' | 'offline'

export interface BatchResult {
  success: boolean
  failedSkills?: string[]
  errorMessage?: string
  results?: Array<{ skillName: string; success: boolean; errorMessage?: string }>
  action?: 'install' | 'remove' | 'update'
}

export interface LastBatchContext {
  action: 'install' | 'remove' | 'update'
  skills: string[]
  agents: string[]
  scope: LifecycleScope
  method?: 'copy' | 'symlink'
}

export function useHostState() {
  const [registry, setRegistry] = useState<SkillRegistry | null>(null)
  const [status, setStatus] = useState<AppStatus>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)
  const [availableAgents, setAvailableAgents] = useState<AvailableAgent[]>([])
  const [allAgents, setAllAgents] = useState<AvailableAgent[]>([])
  const [isTrusted, setIsTrusted] = useState(true)
  const [policy, setPolicy] = useState<ScopePolicyStatePayload | null>(null)
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null)

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
        case 'batchCompleted':
          setIsBatchProcessing(false)
          setBatchResult({
            success: message.payload.success,
            failedSkills: message.payload.failedSkills,
            errorMessage: message.payload.errorMessage,
            results: message.payload.results,
            action: message.payload.action,
          })
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
    isBatchProcessing,
    batchResult,
    setIsBatchProcessing,
    setBatchResult,
  }
}
