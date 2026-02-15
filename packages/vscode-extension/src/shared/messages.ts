import type { SkillRegistry } from './types'

/**
 * Messages sent FROM the Webview TO the Extension Host.
 * Each variant represents a user action or lifecycle event.
 */
export type WebviewMessage = { type: 'webviewDidMount' } | { type: 'requestRefresh' } // User clicked Retry/Refresh button

/**
 * Messages sent FROM the Extension Host TO the Webview.
 * Each variant represents a state update or response.
 */
export type ExtensionMessage =
  | { type: 'initialize'; payload: { version: string } }
  | { type: 'registryUpdate'; payload: RegistryUpdatePayload } // Registry state push

/**
 * Payload for registryUpdate messages.
 */
export interface RegistryUpdatePayload {
  status: 'loading' | 'ready' | 'error' | 'offline'
  registry: SkillRegistry | null
  errorMessage?: string // Present when status is 'error'
  fromCache?: boolean // True if data is from cache (stale or offline)
}
