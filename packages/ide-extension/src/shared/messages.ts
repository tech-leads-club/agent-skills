import type {
  ActionRequest,
  ActionState,
  AllowedScopesSetting,
  AvailableAgent,
  BlockedReason,
  InstalledSkillsMap,
  SkillRegistry,
} from './types'

export type WebviewMessage =
  | { type: 'webviewDidMount' }
  | { type: 'requestRefresh' }
  | { type: 'requestRefreshForUpdate' }
  | { type: 'requestRunAction'; payload: ActionRequest }
  | { type: 'requestPreviewSkill'; payload: { skillName: string } }
  | { type: 'webviewError'; payload: { message: string; stack?: string; componentStack?: string } }

export type ExtensionMessage =
  | { type: 'initialize'; payload: InitializePayload }
  | { type: 'registryUpdate'; payload: RegistryUpdatePayload }
  | { type: 'actionState'; payload: ActionState }
  | { type: 'reconcileState'; payload: ReconcileStatePayload }
  | { type: 'trustState'; payload: TrustStatePayload }
  | { type: 'policyState'; payload: ScopePolicyStatePayload }
  | { type: 'refreshForUpdateComplete' }

export interface InitializePayload {
  version: string
  availableAgents: AvailableAgent[]
  allAgents: AvailableAgent[]
  hasWorkspace: boolean
}

export interface RegistryUpdatePayload {
  status: 'loading' | 'ready' | 'error' | 'offline'
  registry: SkillRegistry | null
  errorMessage?: string
  fromCache?: boolean
}

export interface ReconcileStatePayload {
  installedSkills: InstalledSkillsMap
}

export interface TrustStatePayload {
  isTrusted: boolean
}

export interface ScopePolicyStatePayload {
  allowedScopes: AllowedScopesSetting
  effectiveScopes: Array<'local' | 'global'>
  blockedReason?: BlockedReason
}
