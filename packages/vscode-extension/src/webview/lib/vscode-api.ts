import type { ExtensionMessage, WebviewMessage } from '../../shared/messages'

/**
 * The API exposed by the VS Code webview environment.
 */
interface VsCodeApi {
  postMessage(msg: unknown): void
  getState<T>(): T | undefined
  setState<T>(state: T): void
}

declare function acquireVsCodeApi(): VsCodeApi

/**
 * A singleton instance of the VS Code API to ensure it is only acquired once.
 */
const vscodeApi: VsCodeApi = (
  typeof acquireVsCodeApi === 'function'
    ? acquireVsCodeApi()
    : { postMessage: () => {}, getState: () => undefined, setState: () => {} }
) as VsCodeApi

/**
 * Sends a strongly-typed message to the extension host.
 *
 * @param msg - Message payload sent from webview to extension host.
 * @returns Nothing.
 */
export function postMessage(msg: WebviewMessage): void {
  vscodeApi.postMessage(msg)
}

/**
 * Subscribes to messages sent from the extension host.
 *
 * @param handler - Callback invoked for each extension-to-webview message.
 * @returns Unsubscribe function that removes the message listener.
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
 *
 * @returns Persisted webview state of type `T`, or `undefined` if unset.
 */
export function getState<T>(): T | undefined {
  return vscodeApi.getState<T>()
}

/**
 * Persists data in the webview state for future reloads.
 *
 * @param state - Serializable state payload to persist.
 * @returns Nothing.
 */
export function setState<T>(state: T): void {
  vscodeApi.setState(state)
}
