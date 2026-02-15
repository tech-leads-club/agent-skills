/**
 * Messages sent FROM the Webview TO the Extension Host.
 * Each variant represents a user action or lifecycle event.
 */
export type WebviewMessage = { type: 'webviewDidMount' }

/**
 * Messages sent FROM the Extension Host TO the Webview.
 * Each variant represents a state update or response.
 */
export type ExtensionMessage = { type: 'initialize'; payload: { version: string } }
