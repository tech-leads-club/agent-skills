import { z } from 'zod'

import type {
  ActionRequest,
  ActionState,
  AllowedScopesSetting,
  AvailableAgent,
  BlockedReason,
  InstalledSkillsMap,
  SkillRegistry,
} from './types'

export const webviewMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('webviewDidMount') }),
  z.object({ type: z.literal('requestRefresh') }),
  z.object({ type: z.literal('requestRefreshForUpdate') }),
  z.object({
    type: z.literal('requestRunAction'),
    payload: z.object({
      action: z.enum(['install', 'remove', 'update']),
      skills: z.array(z.string()),
      agents: z.array(z.string()),
      scope: z.enum(['local', 'global', 'all']),
      method: z.enum(['copy', 'symlink']).optional(),
    }),
  }),
  z.object({
    type: z.literal('requestPreviewSkill'),
    payload: z.object({ skillName: z.string() }),
  }),
  z.object({
    type: z.literal('webviewError'),
    payload: z.object({
      message: z.string(),
      stack: z.string().optional(),
      componentStack: z.string().optional(),
    }),
  }),
])

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
