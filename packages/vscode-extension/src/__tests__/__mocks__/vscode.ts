import { jest } from '@jest/globals'

export const window = {
  createOutputChannel: jest.fn(() => ({
    appendLine: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    dispose: jest.fn(),
  })),
  registerWebviewViewProvider: jest.fn(() => ({ dispose: jest.fn() })),
  showInformationMessage: jest.fn(),
  showErrorMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  showQuickPick: jest.fn(),
  createQuickPick: jest.fn(() => {
    const changeHandlers: Array<(value: string) => void> = []
    const acceptHandlers: Array<() => void> = []
    const hideHandlers: Array<() => void> = []

    const mockQuickPick = {
      canSelectMany: false,
      title: '',
      placeholder: '',
      matchOnDescription: false,
      matchOnDetail: false,
      selectedItems: [] as Array<{
        label: string
        skillName: string
        categoryId: string
      }>,
      items: [] as Array<{
        label: string
        detail?: string
        description?: string
        skillName: string
        categoryId: string
      }>,
      show: jest.fn(),
      hide: jest.fn(() => {
        hideHandlers.forEach((handler) => handler())
      }),
      onDidChangeValue: jest.fn((handler: (value: string) => void) => {
        changeHandlers.push(handler)
        return { dispose: jest.fn() }
      }),
      onDidAccept: jest.fn((handler: () => void) => {
        acceptHandlers.push(handler)
        return { dispose: jest.fn() }
      }),
      onDidHide: jest.fn((handler: () => void) => {
        hideHandlers.push(handler)
        return { dispose: jest.fn() }
      }),
      dispose: jest.fn(),
      triggerChangeValue(value: string) {
        changeHandlers.forEach((handler) => handler(value))
      },
      triggerAccept() {
        acceptHandlers.forEach((handler) => handler())
      },
      triggerHide() {
        hideHandlers.forEach((handler) => handler())
      },
    }

    return mockQuickPick
  }),
}

export const commands = {
  registerCommand: jest.fn(() => ({ dispose: jest.fn() })),
  executeCommand: jest.fn(),
}

export const workspace = {
  getConfiguration: jest.fn(() => ({
    get: jest.fn((_key: string, defaultValue: unknown) => defaultValue),
  })),
  onDidGrantWorkspaceTrust: jest.fn(() => ({ dispose: jest.fn() })),
  isTrusted: true,
  workspaceFolders: [{ uri: { fsPath: '/test/workspace' }, name: 'test', index: 0 }],
}

export const Uri = {
  file: (path: string) => ({ fsPath: path }),
  joinPath: (...parts: unknown[]) => ({
    fsPath: (parts as Array<{ fsPath?: string } | string>)
      .map((p) => (typeof p === 'string' ? p : (p.fsPath ?? '')))
      .join('/'),
  }),
}

export const ExtensionContext = jest.fn()

export const version = '1.96.0'
