# VS Code Extension Architecture: The Kilo Code Pattern

This guide outlines a robust, scalable architecture for building complex VS Code extensions. It is based on the patterns and best practices established in the Kilo Code codebase. This guide is designed to lead Large Language Models (LLMs) and developers in implementing extensions that are maintainable, testable, and performant.

## 1. High-Level Architecture

The architecture follows a **Client-Server** model within the VS Code environment, organized as a **Monorepo**.

### 1.1 Client-Server Model

- **Server (Extension Host)**: Runs in the VS Code Node.js environment. It handles:
    - File System access.
    - Terminal execution.
    - LLM Provider communication.
    - Heavy computational logic (The "Brain").
- **Client (Webview UI)**: A React application running in a sandboxed `<iframe>`. It handles:
    - User Interface (Chat, Settings).
    - State rendering.
    - User input.

### 1.2 Monorepo Structure

A monorepo (managed by `pnpm` and `turbo`) is recommended to separate concerns while sharing code.

- `apps/`: User-facing applications (e.g., the Webview UI, CLI, E2E tests).
- `packages/`: Shared libraries (e.g., types, shared utilities, IPC definitions).
- `src/`: The main VS Code Extension logic (Extension Host).

---

## 2. Core Patterns & Best Practices

### 2.1 Dependency Injection (Composition Root)

Avoid global state and side effects in module scope. Use the `activate` function in `src/extension.ts` as the **Composition Root**.

**Pattern:**

1.  Initialize core services (Output, Secrets, State) first.
2.  Inject these services into domain-specific classes (Providers, Managers).
3.  Register disposables in `context.subscriptions`.

```typescript
export async function activate(context: vscode.ExtensionContext) {
	const outputChannel = vscode.window.createOutputChannel("My Extension")
	const provider = new MyProvider(context, outputChannel) // Dependency Injection

	context.subscriptions.push(vscode.window.registerWebviewViewProvider(MyProvider.viewType, provider))
}
```

### 2.2 State Management: Single Source of Truth

The **Extension Host** is the single source of truth. The Webview is a reactive view of the state.

**Pattern:**

1.  **State Change**: Event occurs in Extension (e.g., task update).
2.  **Push**: Extension sends the _full_ `ExtensionState` object to the Webview.
3.  **Render**: Webview receives the state and re-renders (using React/Jotai).
4.  **User Action**: User interacts with Webview -> Webview sends a `Message` to Extension.

**Do not** manage independent state in the Webview that isn't synced or acknowledged by the Extension.

### 2.3 Typed Message Passing

Communication between Webview and Extension must be typed and strict.

**Pattern:**

- Define a shared `ExtensionMessage` type (Extension -> Webview).
- Define a shared `WebviewMessage` type (Webview -> Extension).
- Use a centralized handler (e.g., `webviewMessageHandler.ts`) to route messages.

```typescript
// Shared Types
type ExtensionMessage = { type: "state"; state: ExtensionState } | { type: "action"; action: any }
type WebviewMessage = { type: "webviewDidLaunch" } | { type: "ask"; text: string }
```

### 2.4 The Agent Loop (Task Pattern)

For complex, multi-step operations (like coding tasks), use a **Task** class to encapsulate the session lifecycle.

**Pattern:**

1.  **Initialization**: `Task` is created with the user's prompt and necessary services.
2.  **Execution Loop**:
    - Send history to LLM.
    - Receive response (Text + Tool Calls).
    - Execute Tools (see 2.5).
    - Update history with results.
    - Repeat until completion or user interrupt.
3.  **Context Management**: The `Task` manages the context window, optimizing what is sent to the LLM (truncation, summarization).

### 2.5 Tool System

Encapsulate capabilities as discrete, stateless **Tools**.

**Pattern:**

- **Definition**: JSON Schema defining the tool's input (for the LLM).
- **Implementation**: A class or function that takes the input and returns a string result.
- **Execution**: The `Task` loop matches LLM tool calls to implementations.

---

## 3. Recommended Directory Structure

This structure promotes separation of concerns and testability.

```text
root/
├── apps/
│   ├── webview-ui/         # React Frontend
│   │   ├── src/
│   │   │   ├── components/ # UI Components
│   │   │   ├── lib/        # State management (Jotai), utils
│   │   │   └── App.tsx     # Main entry
├── packages/               # Shared Code
│   ├── types/              # Shared interfaces (ExtensionState, Messages)
│   └── ...
├── src/                    # Extension Host (Backend)
│   ├── api/                # LLM Provider Integrations (Anthropic, OpenAI)
│   ├── core/
│   │   ├── prompts/        # System Prompts & Tool Definitions
│   │   ├── task/           # Agent Loop Logic (Task.ts)
│   │   └── tools/          # Tool Implementations (ReadFile, etc.)
│   ├── services/           # Singleton/Utility Services
│   │   ├── browser/        # Puppeteer automation
│   │   ├── mcp/            # MCP Integration
│   │   └── ...
│   ├── activate/           # Activation helpers (commands, etc.)
│   ├── extension.ts        # Entry Point
│   └── exports/            # Public API (if any)
└── package.json
```

---

## 4. Implementation Guide

### Adding a New Feature

#### 1. Define the Interface

If the feature involves UI, start by defining the `WebviewMessage` and `ExtensionState` changes in `packages/types/`.

#### 2. Implement the Service

Create a service class in `src/services/` to handle the business logic.

- _Guideline_: Keep it testable. Inject dependencies via constructor.

#### 3. Register the Service

Instantiate the service in `src/extension.ts` (or a `ServiceManager`) and pass it to the `ClineProvider` or `Task` as needed.

#### 4. Update the UI

Implement the React component in `apps/webview-ui/`. Dispatch messages to the extension to trigger actions.

### Adding a New Tool

1.  **Define**: Add the tool's JSON schema in `src/core/prompts/tools/`.
2.  **Implement**: Create the tool class in `src/core/tools/`. It should accept the arguments defined in the schema and return a string.
3.  **Register**: Add the tool to the `Task`'s tool registry.

---

## 5. Testing Strategy

- **Unit Tests**: Use `vitest`. Place tests alongside source files (e.g., `MyService.test.ts`).
- **Mocking**: Heavily mock VS Code APIs (`vscode`) and external services.
- **Integration Tests**: Use a dedicated suite to test the Agent Loop with mock LLM responses.

### Example: Mocking VS Code

```typescript
// __mocks__/vscode.ts
export const window = {
	createOutputChannel: vi.fn(() => ({ appendLine: vi.fn() })),
	showInformationMessage: vi.fn(),
}
export const Uri = { file: (path: string) => ({ fsPath: path }) }
```

---

## 6. Guidelines for AI Assistants

When implementing features in this codebase:

1.  **Respect the Architecture**: Do not put business logic in React components. Do not put UI code in the Extension Host.
2.  **Follow the Data Flow**: `User -> Webview -> Message -> Extension -> Task -> LLM -> Tool -> Extension -> State Update -> Webview`.
3.  **Type Safety**: Always update shared types in `packages/types/` first.
4.  **Test First**: Write a test for the new tool or service before integrating it.
