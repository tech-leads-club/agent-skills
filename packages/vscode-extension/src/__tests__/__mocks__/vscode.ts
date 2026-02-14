import { jest } from '@jest/globals'

export const window = {
  createOutputChannel: jest.fn(() => ({
    appendLine: jest.fn(),
    dispose: jest.fn(),
  })),
  showInformationMessage: jest.fn(),
  showErrorMessage: jest.fn(),
  showWarningMessage: jest.fn(),
}

export const commands = {
  registerCommand: jest.fn(),
}

export const Uri = {
  file: (path: string) => ({ fsPath: path }),
}

export const ExtensionContext = jest.fn()
