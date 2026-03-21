import type { LifecycleScope, LifecycleScopeHint } from './policy'

/**
 * Client-side view routing.
 */
export type ViewRoute =
  | 'home'
  | 'selectSkills'
  | 'selectAgents'
  | 'installConfig'
  | 'removeConfirm'
  | 'status'
  | 'selectOutdatedSkills'

/**
 * Install method for skill installation.
 */
export type InstallMethod = 'copy' | 'symlink'

/**
 * Actions that navigate to skill selection.
 */
export type WebviewAction = 'install' | 'uninstall'

/**
 * Flow action for sidebar navigation (includes update).
 */
export type FlowAction = WebviewAction | 'update'

export type LifecycleAction = 'install' | 'remove' | 'update'

/**
 * Type of lifecycle operation being performed.
 * **Active flows**: install, remove, update. repair is deferred (no-op in orchestrator).
 */
export type OperationType = 'install' | 'remove' | 'update' | 'repair'

/**
 * CLI health status result from CliHealthChecker.
 */
export type CliHealthStatus =
  | { status: 'ok'; version: string }
  | { status: 'outdated'; version: string; minVersion: string }
  | { status: 'cli-missing' }
  | { status: 'npx-missing' }
  | { status: 'unknown'; error: string }

/**
 * Classified error information from ErrorClassifier.
 */
export interface ErrorInfo {
  category: ErrorCategory
  message: string
  retryable: boolean
  action?: {
    label: string
    command: string
  }
}

/**
 * Known error categories for classification.
 */
export type ErrorCategory =
  | 'cancelled'
  | 'terminated'
  | 'file-locked'
  | 'npx-missing'
  | 'disk-full'
  | 'permission-denied'
  | 'cli-missing'
  | 'cli-error'
  | 'unknown'

export interface ActionRequest {
  action: LifecycleAction
  skills: string[]
  agents: string[]
  scope: LifecycleScope | 'all'
  method?: InstallMethod
}

export interface ActionLogEntry {
  operation: LifecycleAction
  skillName: string
  scope?: LifecycleScope
  message: string
  severity: 'info' | 'warn' | 'error'
}

export interface ActionResultLine {
  skillName: string
  operation: LifecycleAction
  success: boolean
  scope?: LifecycleScope
  errorMessage?: string
  message?: string
}

export interface ActionState {
  status: 'idle' | 'running' | 'completed'
  actionId: string | null
  action: LifecycleAction | null
  currentStep: string | null
  errorMessage: string | null
  request: ActionRequest | null
  results: ActionResultLine[]
  logs: ActionLogEntry[]
  rejectionMessage: string | null
}

/**
 * Intent representing a batch lifecycle request originating from UI selections.
 */
export interface LifecycleBatchSelection {
  action: OperationType
  skills: string[]
  agents?: string[]
  scope: LifecycleScopeHint
  source: 'card' | 'command-palette'
  updateAll?: boolean
  /** Install method (copy/symlink). Only for install action. */
  method?: InstallMethod
}

/**
 * Metadata preserved on queued jobs for grouped feedback.
 */
export interface OperationBatchMetadata {
  batchId: string
  batchSize: number
  skillNames: string[]
  scope: LifecycleScopeHint
  agents: string[]
  /** Install method (copy/symlink). Only for install operations. */
  method?: InstallMethod
}
