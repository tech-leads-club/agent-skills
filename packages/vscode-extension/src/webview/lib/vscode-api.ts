import type { ExtensionMessage, WebviewMessage } from '../../shared/messages'

interface VsCodeApi {
  postMessage(msg: unknown): void
  getState<T>(): T | undefined
  setState<T>(state: T): void
}

declare function acquireVsCodeApi(): VsCodeApi

// acquireVsCodeApi() can only be called ONCE per Webview session.
// This module-level variable ensures singleton behavior.
const vscodeApi: VsCodeApi = (
  typeof acquireVsCodeApi === 'function'
    ? acquireVsCodeApi()
    : { postMessage: () => {}, getState: () => undefined, setState: () => {} }
) as VsCodeApi

/**
 * Sends a strongly-typed message to the extension host.
 */
export function postMessage(msg: WebviewMessage): void {
  vscodeApi.postMessage(msg)
}

/**
 * Subscribes to messages sent from the extension host.
 */
export function onMessage(handler: (msg: ExtensionMessage) => void): () => void {
  const listener = (event: MessageEvent) => {
    handler(event.data as ExtensionMessage)
  }
  window.addEventListener('message', listener)
  return () => window.removeEventListener('message', listener)
}

/**
 * Returns the cached webview state previously persisted via `setState`.
 */
export function getState<T>(): T | undefined {
  return vscodeApi.getState<T>()
}

/**
 * Persists data in the webview state for future reloads.
 */
export function setState<T>(state: T): void {
  vscodeApi.setState(state)
}
