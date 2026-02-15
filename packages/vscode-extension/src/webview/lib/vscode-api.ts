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

export function postMessage(msg: WebviewMessage): void {
  vscodeApi.postMessage(msg)
}

export function onMessage(handler: (msg: ExtensionMessage) => void): () => void {
  const listener = (event: MessageEvent) => {
    handler(event.data as ExtensionMessage)
  }
  window.addEventListener('message', listener)
  return () => window.removeEventListener('message', listener)
}

export function getState<T>(): T | undefined {
  return vscodeApi.getState<T>()
}

export function setState<T>(state: T): void {
  vscodeApi.setState(state)
}
