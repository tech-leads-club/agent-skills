import type { AvailableAgent, InstalledSkillsMap, OperationType, SkillRegistry } from './types'

/**
 * Messages sent FROM the Webview TO the Extension Host.
 * Each variant represents a user action or lifecycle event.
 */
export type WebviewMessage =
  | { type: 'webviewDidMount' }
  | { type: 'requestRefresh' } // User clicked Retry/Refresh button
  | { type: 'installSkill'; payload: InstallSkillPayload }
  | { type: 'removeSkill'; payload: RemoveSkillPayload }
  | { type: 'updateSkill'; payload: UpdateSkillPayload }
  | { type: 'cancelOperation'; payload: CancelOperationPayload }

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
  | { type: 'reconcileState'; payload: ReconcileStatePayload }

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
  agent: string // Selected agent identifier
  scope: 'local' | 'global' | 'all'
}

/**
 * Payload for removeSkill message (Webview → Extension).
 */
export interface RemoveSkillPayload {
  skillName: string
  agent: string // Selected agent identifier
  scope: 'local' | 'global' | 'all'
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
}

/**
 * Payload for operationProgress message (Extension → Webview).
 */
export interface OperationProgressPayload {
  operationId: string
  message: string
  increment?: number // Optional progress percentage increment
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
}

/**
 * Payload for reconcileState message (Extension → Webview).
 * Pushes the full installed skills map from disk scan.
 */
export interface ReconcileStatePayload {
  installedSkills: InstalledSkillsMap
}
