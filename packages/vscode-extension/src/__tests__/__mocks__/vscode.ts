import { jest } from '@jest/globals'

export const window = {
  createOutputChannel: jest.fn(() => ({
    appendLine: jest.fn(),
    dispose: jest.fn(),
  })),
  registerWebviewViewProvider: jest.fn(() => ({ dispose: jest.fn() })),
  showInformationMessage: jest.fn(),
  showErrorMessage: jest.fn(),
  showWarningMessage: jest.fn(),
}

export const commands = {
  registerCommand: jest.fn(() => ({ dispose: jest.fn() })),
  executeCommand: jest.fn(),
}

export const workspace = {
  getConfiguration: jest.fn(() => ({
    get: jest.fn((_key: string, defaultValue: unknown) => defaultValue),
  })),
  isTrusted: true,
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
