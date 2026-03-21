import { useEffect, useReducer } from 'react'
import type {
  ExtensionMessage,
  InitializePayload,
  RegistryUpdatePayload,
  ScopePolicyStatePayload,
} from '../../shared/messages'
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

interface HostState {
  actionState: ActionState
  registry: SkillRegistry | null
  status: AppStatus
  errorMessage: string | null
  fromCache: boolean
  availableAgents: AvailableAgent[]
  allAgents: AvailableAgent[]
  isTrusted: boolean
  policy: ScopePolicyStatePayload | null
  batchResult: BatchResult | null
  isRefreshingForUpdate: boolean
}

export type HostStateAction =
  | { type: 'INITIALIZE'; payload: InitializePayload }
  | { type: 'REGISTRY_UPDATE'; payload: RegistryUpdatePayload }
  | { type: 'TRUST_STATE'; payload: { isTrusted: boolean } }
  | { type: 'POLICY_UPDATE'; payload: ScopePolicyStatePayload }
  | { type: 'ACTION_STATE'; payload: ActionState }
  | { type: 'REFRESH_FOR_UPDATE_STARTED' }
  | { type: 'REFRESH_FOR_UPDATE_COMPLETE' }

const initialState: HostState = {
  actionState: {
    status: 'idle',
    actionId: null,
    action: null,
    currentStep: null,
    errorMessage: null,
    request: null,
    results: [],
    logs: [],
    rejectionMessage: null,
  },
  registry: null,
  status: 'loading',
  errorMessage: null,
  fromCache: false,
  availableAgents: [],
  allAgents: [],
  isTrusted: true,
  policy: null,
  batchResult: null,
  isRefreshingForUpdate: false,
}

function deriveBatchResult(payload: ActionState): BatchResult | null {
  if (payload.status !== 'completed') return null
  const failedResults = payload.results.filter((r) => !r.success)
  return {
    success: failedResults.length === 0,
    failedSkills: failedResults.length > 0 ? failedResults.map((r) => r.skillName) : undefined,
    errorMessage: payload.errorMessage ?? undefined,
    results: payload.results,
    action: payload.action ?? undefined,
  }
}

function hostStateReducer(state: HostState, action: HostStateAction): HostState {
  switch (action.type) {
    case 'INITIALIZE':
      return { ...state, availableAgents: action.payload.availableAgents, allAgents: action.payload.allAgents }
    case 'REGISTRY_UPDATE':
      return {
        ...state,
        status: action.payload.status as AppStatus,
        registry: action.payload.registry,
        errorMessage: action.payload.errorMessage ?? null,
        fromCache: action.payload.fromCache ?? false,
      }
    case 'TRUST_STATE':
      return { ...state, isTrusted: action.payload.isTrusted }
    case 'POLICY_UPDATE':
      return { ...state, policy: action.payload }
    case 'ACTION_STATE': {
      const batchResult = action.payload.status === 'running' ? null : deriveBatchResult(action.payload)
      return { ...state, actionState: action.payload, batchResult }
    }
    case 'REFRESH_FOR_UPDATE_STARTED':
      return { ...state, isRefreshingForUpdate: true }
    case 'REFRESH_FOR_UPDATE_COMPLETE':
      return { ...state, isRefreshingForUpdate: false }
  }
}

export function useHostState() {
  const [state, dispatch] = useReducer(hostStateReducer, initialState)

  useEffect(() => {
    const dispose = onMessage((message: ExtensionMessage) => {
      switch (message.type) {
        case 'initialize':
          dispatch({ type: 'INITIALIZE', payload: message.payload })
          break
        case 'registryUpdate':
          dispatch({ type: 'REGISTRY_UPDATE', payload: message.payload })
          break
        case 'trustState':
          dispatch({ type: 'TRUST_STATE', payload: message.payload })
          break
        case 'policyState':
          dispatch({ type: 'POLICY_UPDATE', payload: message.payload })
          break
        case 'refreshForUpdateComplete':
          dispatch({ type: 'REFRESH_FOR_UPDATE_COMPLETE' })
          break
        case 'actionState':
          dispatch({ type: 'ACTION_STATE', payload: message.payload })
          break
      }
    })

    postMessage({ type: 'webviewDidMount' })
    return dispose
  }, [])

  return {
    registry: state.registry,
    status: state.status,
    errorMessage: state.errorMessage,
    fromCache: state.fromCache,
    availableAgents: state.availableAgents,
    allAgents: state.allAgents,
    isTrusted: state.isTrusted,
    policy: state.policy,
    actionState: state.actionState,
    isBatchProcessing: state.actionState.status === 'running',
    batchResult: state.batchResult,
    isRefreshingForUpdate: state.isRefreshingForUpdate,
    startRefreshForUpdate: () => dispatch({ type: 'REFRESH_FOR_UPDATE_STARTED' }),
  }
}
