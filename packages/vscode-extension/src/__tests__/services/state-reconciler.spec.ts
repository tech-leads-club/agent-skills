import { jest } from '@jest/globals'

// Mock dependencies
const mockWatcher = {
  onDidCreate: jest.fn(),
  onDidDelete: jest.fn(),
  onDidChange: jest.fn(),
  dispose: jest.fn(),
}

const mockVscode = {
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/workspace' } }],
    createFileSystemWatcher: jest.fn(() => mockWatcher),
    isTrusted: true,
    onDidGrantWorkspaceTrust: jest.fn(() => ({ dispose: jest.fn() })),
  },
  window: {
    onDidChangeWindowState: jest.fn(() => ({ dispose: jest.fn() })),
  },
}

const mockScanner = { scan: jest.fn<() => Promise<any>>().mockResolvedValue({}) }
const mockRegistry = { getRegistry: jest.fn<() => Promise<any>>().mockResolvedValue({ skills: [] }) }
const mockLogger = { info: jest.fn(), debug: jest.fn(), error: jest.fn() }

jest.unstable_mockModule('vscode', () => mockVscode)
jest.unstable_mockModule('../../services/installed-skills-scanner', () => ({
  InstalledSkillsScanner: jest.fn(() => mockScanner),
}))
jest.unstable_mockModule('../../services/skill-registry-service', () => ({
  SkillRegistryService: jest.fn(() => mockRegistry),
}))
jest.unstable_mockModule('../../services/logging-service', () => ({
  LoggingService: jest.fn(() => mockLogger),
}))

const { StateReconciler } = await import('../../services/state-reconciler')

describe('StateReconciler', () => {
  let reconciler: InstanceType<typeof StateReconciler>

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockVscode.workspace.isTrusted = true
    reconciler = new StateReconciler(mockScanner as any, mockRegistry as any, mockLogger as any)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should create local watchers if workspace is trusted', () => {
    reconciler.start()
    expect(mockVscode.workspace.createFileSystemWatcher).toHaveBeenCalled()
  })

  it('should NOT create local watchers if workspace is untrusted', () => {
    mockVscode.workspace.isTrusted = false
    reconciler.start()
    expect(mockVscode.workspace.createFileSystemWatcher).not.toHaveBeenCalled()
  })

  it('should create watchers when trust is granted', () => {
    mockVscode.workspace.isTrusted = false
    reconciler.start()

    // Simulate trust grant
    const handler = (mockVscode.workspace.onDidGrantWorkspaceTrust as jest.Mock).mock.calls[0][0] as any
    mockVscode.workspace.isTrusted = true
    handler()

    expect(mockVscode.workspace.createFileSystemWatcher).toHaveBeenCalled()
  })

  it('should reconcile on watcher events (debounced)', async () => {
    reconciler.start()

    // Simulate event
    const changeHandler = (mockWatcher.onDidChange as jest.Mock).mock.calls[0][0] as any
    changeHandler()
    changeHandler() // Debounce check

    expect(mockScanner.scan).not.toHaveBeenCalled() // Not yet

    await jest.runAllTimersAsync()

    expect(mockScanner.scan).toHaveBeenCalledTimes(2) // Initial + 1 debounced
  })
})
