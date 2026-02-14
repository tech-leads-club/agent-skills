import * as vscode from 'vscode'
import { activate, deactivate } from '../extension'
import { SidebarProvider } from '../providers/sidebar-provider'
import { LoggingService } from '../services/logging-service'

jest.mock('../services/logging-service')
jest.mock('../providers/sidebar-provider', () => {
  const MockSidebarProvider = jest.fn()
  // @ts-expect-error - we are assigning a static property to a mock function
  MockSidebarProvider.viewType = 'agentSkillsSidebar'
  return { SidebarProvider: MockSidebarProvider }
})

describe('Extension Activation', () => {
  let context: vscode.ExtensionContext
  let mockLoggingService: { info: jest.Mock; dispose: jest.Mock }
  let mockSidebarProvider: Record<string, unknown>

  beforeEach(() => {
    jest.clearAllMocks()

    context = {
      subscriptions: [],
      extensionUri: { fsPath: '/mock/path' },
      extension: {
        packageJSON: {
          version: '1.2.3',
        },
      },
    } as unknown as vscode.ExtensionContext

    mockLoggingService = {
      info: jest.fn(),
      dispose: jest.fn(),
    }
    ;(LoggingService as jest.Mock).mockImplementation(() => mockLoggingService)

    mockSidebarProvider = {}
    ;(SidebarProvider as unknown as jest.Mock).mockImplementation(() => mockSidebarProvider)
  })

  it('should create services and register webview provider', () => {
    activate(context)

    // Verify LoggingService
    expect(vscode.window.createOutputChannel).toHaveBeenCalledWith('Agent Skills')
    expect(LoggingService).toHaveBeenCalledTimes(1)
    expect(context.subscriptions).toContain(mockLoggingService)

    // Verify SidebarProvider
    expect(SidebarProvider).toHaveBeenCalledWith(context, mockLoggingService)
    expect(vscode.window.registerWebviewViewProvider).toHaveBeenCalledWith('agentSkillsSidebar', mockSidebarProvider)
    // Check if the disposable from registerWebviewViewProvider is in subscriptions
    // The mock returns an object with dispose, we can check logic or just count
    expect(context.subscriptions.length).toBeGreaterThanOrEqual(2)
  })

  it('should register extension commands', () => {
    activate(context)

    expect(vscode.commands.registerCommand).toHaveBeenCalledWith('agentSkills.refresh', expect.any(Function))
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith('agentSkills.openSettings', expect.any(Function))
    expect(context.subscriptions.length).toBeGreaterThanOrEqual(4)
  })

  it('should log diagnostic info on activation', () => {
    activate(context)

    expect(mockLoggingService.info).toHaveBeenCalledWith(expect.stringContaining('v1.2.3 activated'))
    expect(mockLoggingService.info).toHaveBeenCalledWith(expect.stringContaining('VS Code'))
    expect(mockLoggingService.info).toHaveBeenCalledWith(expect.stringContaining('Workspace trusted'))
  })

  it('should handle agentSkills.refresh command', () => {
    activate(context)
    const calls = (vscode.commands.registerCommand as jest.Mock).mock.calls
    const refreshCall = calls.find((c: unknown[]) => c[0] === 'agentSkills.refresh')
    const handler = refreshCall?.[1] as (...args: unknown[]) => unknown

    handler()

    expect(mockLoggingService.info).toHaveBeenCalledWith('Refresh command invoked')
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Agent Skills: Refreshing...')
  })

  it('should handle agentSkills.openSettings command', () => {
    activate(context)
    const calls = (vscode.commands.registerCommand as jest.Mock).mock.calls
    const settingsCall = calls.find((c: unknown[]) => c[0] === 'agentSkills.openSettings')
    const handler = settingsCall?.[1] as (...args: unknown[]) => unknown

    handler()

    expect(mockLoggingService.info).toHaveBeenCalledWith('Open Settings command invoked')
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
      'workbench.action.openSettings',
      '@ext:tech-leads-club.vscode-extension',
    )
  })

  it('should deactivate without error', () => {
    expect(() => deactivate()).not.toThrow()
  })
})
