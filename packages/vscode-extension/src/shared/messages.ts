import type {
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
 */
export type WebviewMessage =
  | { type: 'webviewDidMount' }
  | { type: 'requestRefresh' } // User clicked Retry/Refresh button
  | { type: 'installSkill'; payload: InstallSkillPayload }
  | { type: 'removeSkill'; payload: RemoveSkillPayload }
  | { type: 'executeBatch'; payload: ExecuteBatchPayload }
  | { type: 'updateSkill'; payload: UpdateSkillPayload }
  | { type: 'cancelOperation'; payload: CancelOperationPayload }
  | { type: 'requestAgentPick'; payload: RequestAgentPickPayload }
  | { type: 'requestScopePick'; payload: RequestScopePickPayload }
  | { type: 'repairSkill'; payload: RepairSkillPayload }

/**
 * Messages sent FROM the Extension Host TO the Webview.
 * Each variant represents a state update or response.
 */
export type ExtensionMessage =
  | { type: 'initialize'; payload: InitializePayload }
  | { type: 'registryUpdate'; payload: RegistryUpdatePayload } // Registry state push
  | { type: 'operationStarted'; payload: OperationStartedPayload }
  | { type: 'operationProgress'; payload: OperationProgressPayload }
  | { type: 'operationCompleted'; payload: OperationCompletedPayload }
  | { type: 'batchCompleted'; payload: BatchCompletedPayload }
  | { type: 'reconcileState'; payload: ReconcileStatePayload }
  | { type: 'agentPickResult'; payload: AgentPickResultPayload }
  | { type: 'scopePickResult'; payload: ScopePickResultPayload }
  | { type: 'trustState'; payload: TrustStatePayload }
  | { type: 'policyState'; payload: ScopePolicyStatePayload }

/**
 * Payload for initialize message.
 */
export interface InitializePayload {
  version: string
  availableAgents: AvailableAgent[]
  hasWorkspace: boolean
}

/**
 * Payload for registryUpdate messages.
 */
export interface RegistryUpdatePayload {
  status: 'loading' | 'ready' | 'error' | 'offline'
  registry: SkillRegistry | null
  errorMessage?: string // Present when status is 'error'
  fromCache?: boolean // True if data is from cache (stale or offline)
}

/**
 * Payload for installSkill message (Webview → Extension).
 */
export interface InstallSkillPayload {
  skillName: string
  agents: string[] // Selected agent identifiers (supports multi-select)
  scope: 'local' | 'global' | 'all'
}

/**
 * Payload for removeSkill message (Webview → Extension).
 */
export interface RemoveSkillPayload {
  skillName: string
  agents: string[] // Selected agent identifiers (supports multi-select)
  scope: 'local' | 'global' | 'all'
}

/**
 * Payload for executeBatch message (Webview → Extension).
 */
export interface ExecuteBatchPayload {
  action: OperationType
  skills: string[]
  agents: string[]
  scope: 'local' | 'global'
}

/**
 * Payload for updateSkill message (Webview → Extension).
 */
export interface UpdateSkillPayload {
  skillName: string
}

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
 * Payload for operationProgress message (Extension → Webview).
 */
export interface OperationProgressPayload {
  operationId: string
  message: string
  increment?: number // Optional progress percentage increment
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
 * Payload for batchCompleted message (Extension → Webview).
 */
export interface BatchCompletedPayload {
  batchId: string
  success: boolean
  failedSkills?: string[]
  errorMessage?: string
}

/**
 * Payload for reconcileState message (Extension → Webview).
 * Pushes the full installed skills map from disk scan.
 */
export interface ReconcileStatePayload {
  installedSkills: InstalledSkillsMap
}

/**
 * Payload for requestAgentPick message (Webview → Extension).
 * Asks the extension host to show vscode.window.showQuickPick for agent selection.
 */
export interface RequestAgentPickPayload {
  skillName: string
  action: 'add' | 'remove'
}

/**
 * Payload for requestScopePick message (Webview → Extension).
 * Asks the extension host to show vscode.window.showQuickPick for scope selection.
 */
export interface RequestScopePickPayload {
  skillName: string
  action: 'add' | 'remove'
  agents: string[] // Previously selected agents
}

/**
 * Result from agent quick pick (Extension → Webview).
 */
export interface AgentPickResultPayload {
  skillName: string
  action: 'add' | 'remove'
  agents: string[] | null // null if user cancelled
}

/**
 * Result from scope quick pick (Extension → Webview).
 */
export interface ScopePickResultPayload {
  skillName: string
  action: 'add' | 'remove'
  agents: string[]
  scope: 'local' | 'global' | 'all' | null // null if user cancelled
}

/**
 * Payload for repairSkill message (Webview → Extension).
 */
export interface RepairSkillPayload {
  skillName: string
  agents: string[]
  scope: 'local' | 'global'
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
