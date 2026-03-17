import type {
  ActionRequest,
  ActionState,
  AllowedScopesSetting,
  AvailableAgent,
  BlockedReason,
  InstalledSkillsMap,
  LifecycleScope,
  OperationBatchMetadata,
  OperationType,
  SkillRegistry,
} from './types'

/**
 * Messages sent FROM the Webview TO the Extension Host.
 * Each variant represents a user action or lifecycle event.
 *
 * **Active (WebView flow)**: webviewDidMount, requestRefresh, installSkill, removeSkill,
 * updateSkill, requestRunAction, cancelOperation.
 */
export type WebviewMessage =
  | { type: 'webviewDidMount' }
  | { type: 'requestRefresh' }
  | { type: 'installSkill'; payload: InstallSkillPayload }
  | { type: 'removeSkill'; payload: RemoveSkillPayload }
  | { type: 'requestRunAction'; payload: RequestRunActionPayload }
  | { type: 'executeBatch'; payload: ExecuteBatchPayload }
  | { type: 'updateSkill'; payload: UpdateSkillPayload }
  | { type: 'cancelOperation'; payload: CancelOperationPayload }

/**
 * Messages sent FROM the Extension Host TO the Webview.
 * Each variant represents a state update or response.
 *
 * **Active (WebView flow)**: initialize, registryUpdate, actionState,
 * reconcileState, trustState, policyState.
 */
export type ExtensionMessage =
  | { type: 'initialize'; payload: InitializePayload }
  | { type: 'registryUpdate'; payload: RegistryUpdatePayload }
  | { type: 'actionState'; payload: ActionStatePayload }
  | { type: 'operationStarted'; payload: OperationStartedPayload }
  | { type: 'operationProgress'; payload: OperationProgressPayload }
  | { type: 'operationCompleted'; payload: OperationCompletedPayload }
  | { type: 'batchCompleted'; payload: BatchCompletedPayload }
  | { type: 'reconcileState'; payload: ReconcileStatePayload }
  | { type: 'trustState'; payload: TrustStatePayload }
  | { type: 'policyState'; payload: ScopePolicyStatePayload }

/**
 * Payload for initialize message.
 */
export interface InitializePayload {
  version: string
  availableAgents: AvailableAgent[]
  allAgents: AvailableAgent[]
  hasWorkspace: boolean
}

/**
 * Payload for registryUpdate messages.
 */
export interface RegistryUpdatePayload {
  status: 'loading' | 'ready' | 'error' | 'offline'
  registry: SkillRegistry | null
  errorMessage?: string
  fromCache?: boolean
}

/**
 * Payload for installSkill message (Webview → Extension).
 */
export interface InstallSkillPayload {
  skillName: string
  agents: string[]
  scope: 'local' | 'global' | 'all'
}

/**
 * Payload for removeSkill message (Webview → Extension).
 */
export interface RemoveSkillPayload {
  skillName: string
  agents: string[]
  scope: 'local' | 'global' | 'all'
}

/**
 * Payload for requestRunAction message (Webview → Extension).
 */
export type RequestRunActionPayload = ActionRequest

/**
 * Payload for executeBatch message (Webview → Extension).
 * Legacy alias kept during the phase-4 contract migration.
 */
export type ExecuteBatchPayload = ActionRequest

/**
 * Payload for updateSkill message (Webview → Extension).
 */
export interface UpdateSkillPayload {
  skillName: string
}

/**
 * Payload for actionState message (Extension → Webview).
 */
export type ActionStatePayload = ActionState

/**
 * Payload for cancelOperation message (Webview → Extension).
 */
export interface CancelOperationPayload {
  operationId: string
}

/**
 * Payload for operationStarted message (Extension → Webview).
 */
export interface OperationStartedPayload {
  operationId: string
  operation: OperationType
  skillName: string
  metadata?: OperationBatchMetadata
}

/**
 * Severity level for structured progress/log entries.
 */
export type ProgressLogSeverity = 'info' | 'warn' | 'error'

/**
 * Payload for operationProgress message (Extension → Webview).
 */
export interface OperationProgressPayload {
  operationId: string
  message: string
  skillName?: string
  operation?: OperationType
  increment?: number
  /** Severity for timeline display (errors shown in real time). */
  severity?: ProgressLogSeverity
  metadata?: OperationBatchMetadata
}

/**
 * Payload for operationCompleted message (Extension → Webview).
 */
export interface OperationCompletedPayload {
  operationId: string
  operation: OperationType
  skillName: string
  success: boolean
  errorMessage?: string
  metadata?: OperationBatchMetadata
}

/**
 * Single result line for batch operations (CLI-style display).
 */
export interface BatchResultLine {
  skillName: string
  success: boolean
  errorMessage?: string
}

/**
 * Payload for batchCompleted message (Extension → Webview).
 */
export interface BatchCompletedPayload {
  batchId: string
  success: boolean
  failedSkills?: string[]
  errorMessage?: string
  /** Per-operation results for CLI-style listing. */
  results?: BatchResultLine[]
  /** Action type for CLI-style message formatting. */
  action?: 'install' | 'remove' | 'update'
}

/**
 * Payload for reconcileState message (Extension → Webview).
 * Pushes the full installed skills map from disk scan.
 */
export interface ReconcileStatePayload {
  installedSkills: InstalledSkillsMap
}

/**
 * Payload for trustState message (Extension → Webview).
 */
export interface TrustStatePayload {
  isTrusted: boolean
}

/**
 * Payload for policyState message (Extension → Webview).
 */
export interface ScopePolicyStatePayload {
  allowedScopes: AllowedScopesSetting
  effectiveScopes: LifecycleScope[]
  blockedReason?: BlockedReason
}
