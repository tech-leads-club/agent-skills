---
name: vscode-extension-patterns
description: Documents core architectural patterns for developing robust VS Code extensions, focusing on dependency injection, singleton management, webview communication, state management, and testing.
license: MIT
metadata:
  author: edmarpaulino
  version: '0.0.1'
---

# VS Code Extension Development Patterns

This skill documents core architectural patterns for developing robust VS Code extensions, focusing on dependency injection, singleton management, webview communication, state management, and testing.

## 1. Extension Lifecycle & Architecture

The extension entry point is typically `src/extension.ts`. A well-structured extension delegates logic to services and providers rather than keeping it all in the activation function.

### Activation Pattern (Dependency Injection Root)

The `activate` function acts as the Composition Root, where services are initialized and dependencies are injected.

```typescript
// src/extension.ts
import * as vscode from 'vscode'
import { WebviewProvider } from './providers/WebviewProvider'
import { GlobalStateService } from './services/GlobalStateService'
import { OutputService } from './services/OutputService'
import { registerCommands } from './commands'

export async function activate(context: vscode.ExtensionContext) {
  // 1. Initialize core infrastructure (Output, State)
  const outputChannel = vscode.window.createOutputChannel('My Extension')
  const outputService = new OutputService(outputChannel)
  const stateService = new GlobalStateService(context.globalState)

  // 2. Initialize domain services
  // const myService = new MyService(stateService, outputService)

  // 3. Initialize Webview Provider (Dependency Injection)
  const sidebarProvider = new WebviewProvider(context.extensionUri, stateService)

  // 4. Register the provider
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(WebviewProvider.viewType, sidebarProvider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
  )

  // 5. Register commands (injecting dependencies)
  registerCommands({ context, sidebarProvider, outputService })
}

export function deactivate() {}
```

## 2. Webview Provider Pattern

For extensions with a UI, the Webview View Provider pattern allows you to render HTML content in the sidebar or panel.

### Provider Class Structure

Implement `vscode.WebviewViewProvider` to manage the webview lifecycle.

```typescript
// src/providers/WebviewProvider.ts
import * as vscode from 'vscode'
import { GlobalStateService } from '../services/GlobalStateService'

export class WebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'myExtension.sidebarView'
  private view?: vscode.WebviewView

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly stateService: GlobalStateService,
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this.view = webviewView

    // 1. Configure webview options
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    }

    // 2. Set HTML content
    webviewView.webview.html = this.getHtmlContent(webviewView.webview)

    // 3. Set up message listener (Webview -> Extension)
    this.setWebviewMessageListener(webviewView.webview)
  }

  private getHtmlContent(webview: vscode.Webview): string {
    // ... generate HTML with nonce and CSP ...
    return `<!DOCTYPE html>...`
  }
}
```

## 3. Message Passing (Extension <-> Webview)

Decouple the UI from the extension logic using a strict message-passing protocol.

### Extension -> Webview

Use `postMessage` to push state or events to the UI.

```typescript
// Define message types
interface ExtensionMessage {
    type: "state" | "action"
    payload: any
}

// In WebviewProvider
public async postMessageToWebview(message: ExtensionMessage) {
    if (this.view?.visible) {
        await this.view.webview.postMessage(message)
    }
}

// Usage: Sync state
public async updateState() {
    const state = this.stateService.getState()
    await this.postMessageToWebview({ type: "state", payload: state })
}
```

### Webview -> Extension

Handle user interactions from the UI.

```typescript
// In WebviewProvider
private setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(async (message: any) => {
        switch (message.type) {
            case "onCommand":
                await vscode.commands.executeCommand(message.command)
                break
            case "onUpdateSetting":
                await this.stateService.update(message.key, message.value)
                break
        }
    })
}
```

## 4. State Management (Wrapper Pattern)

Wrap `vscode.Memento` (globalState/workspaceState) to provide a typed, consistent API.

```typescript
// src/services/GlobalStateService.ts
import * as vscode from 'vscode'

export class GlobalStateService {
  constructor(private readonly globalState: vscode.Memento) {}

  public get<T>(key: string): T | undefined {
    return this.globalState.get<T>(key)
  }

  public async update(key: string, value: any): Promise<void> {
    await this.globalState.update(key, value)
    // Optional: Emit event to notify listeners of state change
  }
}
```

## 5. Singleton Pattern (Service Access)

For services that must be unique (e.g., Telemetry, Output), use the Singleton pattern, but prefer passing the instance via constructor (DI) when possible for better testability.

```typescript
export class OutputService {
  private static instance: OutputService

  public static getInstance(): OutputService {
    if (!OutputService.instance) {
      // In reality, this should be initialized with the channel in activate()
      throw new Error('OutputService not initialized')
    }
    return OutputService.instance
  }

  // Better: Initialize in activate and pass down
  constructor(private channel: vscode.OutputChannel) {}

  log(message: string) {
    this.channel.appendLine(message)
  }
}
```

## 6. Testing Strategies

Use a testing framework like Vitest to unit test your extension logic.

### Dependency Injection & Mocking

By injecting dependencies (like `GlobalStateService`) into your classes, you can easily mock them during tests.

```typescript
// src/providers/WebviewProvider.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WebviewProvider } from './WebviewProvider'
import { GlobalStateService } from '../services/GlobalStateService'
import * as vscode from 'vscode'

// Mock VS Code API
vi.mock('vscode')

describe('WebviewProvider', () => {
  let provider: WebviewProvider
  let mockStateService: GlobalStateService

  beforeEach(() => {
    // Mock State Service
    mockStateService = {
      get: vi.fn(),
      update: vi.fn(),
    } as unknown as GlobalStateService

    const mockUri = { fsPath: '/path' } as vscode.Uri
    provider = new WebviewProvider(mockUri, mockStateService)
  })

  it('should resolve webview view', () => {
    const mockWebviewView = {
      webview: {
        options: {},
        html: '',
        onDidReceiveMessage: vi.fn(),
      },
    } as unknown as vscode.WebviewView

    provider.resolveWebviewView(mockWebviewView, {} as any, {} as any)

    expect(mockWebviewView.webview.options.enableScripts).toBe(true)
    expect(mockWebviewView.webview.onDidReceiveMessage).toHaveBeenCalled()
  })
})
```

### Mocking VS Code API

When testing code that imports `vscode`, use `vi.mock("vscode")` with a `__mocks__/vscode.ts` file or inline factory.

```typescript
// __mocks__/vscode.ts or inline
vi.mock('vscode', () => ({
  window: {
    createOutputChannel: vi.fn(() => ({ appendLine: vi.fn() })),
    showErrorMessage: vi.fn(),
  },
  Uri: {
    file: (path: string) => ({ fsPath: path }),
    parse: (path: string) => ({ fsPath: path }),
  },
  // ... other mocks
}))
```

## 7. Best Practices

1.  **Disposable Pattern:** Always add disposables (commands, providers, listeners) to `context.subscriptions` to ensure proper cleanup on deactivation.
2.  **State Synchronization:** When state changes, push the _full_ relevant state to the webview to keep the UI in sync, rather than sending incremental updates which can get out of sync.
3.  **Security:** Always use a Content Security Policy (CSP) in your webview HTML.
4.  **Error Handling:** Wrap command executions in try/catch blocks and use a centralized output channel for logging errors.
