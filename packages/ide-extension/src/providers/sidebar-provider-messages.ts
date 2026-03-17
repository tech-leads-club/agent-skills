import type { RegistryStoreSnapshot } from '../services/registry-store'
import type { ExtensionMessage, ScopePolicyStatePayload } from '../shared/messages'
import type { ScopePolicyEvaluation } from '../shared/types'

const toPolicyStatePayload = (policy: ScopePolicyEvaluation): ScopePolicyStatePayload => ({
  allowedScopes: policy.allowedScopes,
  effectiveScopes: policy.effectiveScopes,
  blockedReason: policy.blockedReason,
})

export const toPolicyStateMessage = (policy: ScopePolicyEvaluation): ExtensionMessage => ({
  type: 'policyState',
  payload: toPolicyStatePayload(policy),
})

export const toRegistryUpdateMessage = (snapshot: RegistryStoreSnapshot): ExtensionMessage => ({
  type: 'registryUpdate',
  payload: {
    status: snapshot.status === 'idle' ? 'loading' : snapshot.status,
    registry: snapshot.registry,
    fromCache: snapshot.fromCache,
    ...(snapshot.errorMessage ? { errorMessage: snapshot.errorMessage } : {}),
  },
})
