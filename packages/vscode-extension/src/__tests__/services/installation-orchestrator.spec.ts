import { jest } from '@jest/globals'

// Mock dependencies
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}

// Helper type for mocked async function
type MockAsyncFn<T = any> = jest.Mock<() => Promise<T>>

const mockVerifier = {
  verify: jest.fn<() => Promise<any>>(),
}

const mockQueue = {
  enqueue: jest.fn(),
  cancel: jest.fn(),
  onJobStarted: jest.fn(),
  onJobCompleted: jest.fn(),
  onJobProgress: jest.fn(),
  dispose: jest.fn(),
}

// VS Code mock
const mockVscode = {
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/workspace' } }],
  },
  window: {
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn<() => Promise<string | undefined>>(),
    showInformationMessage: jest.fn(),
    withProgress: jest.fn((options: any, callback: any) => {
      const token = { onCancellationRequested: jest.fn() }
      return callback({ report: jest.fn() }, token)
    }),
  },
  ProgressLocation: { Notification: 15 },
  CancellationTokenSource: jest.fn(() => ({
    token: { onCancellationRequested: jest.fn() },
    cancel: jest.fn(),
    dispose: jest.fn(),
  })),
}

jest.unstable_mockModule('vscode', () => mockVscode)
jest.unstable_mockModule('../../services/logging-service', () => ({
  LoggingService: jest.fn(() => mockLogger),
}))
jest.unstable_mockModule('../../services/operation-queue', () => ({
  OperationQueue: jest.fn(() => mockQueue),
}))
jest.unstable_mockModule('../../services/post-install-verifier', () => ({
  PostInstallVerifier: jest.fn(() => mockVerifier),
}))

const { InstallationOrchestrator } = await import('../../services/installation-orchestrator')

describe('InstallationOrchestrator', () => {
  let orchestrator: InstanceType<typeof InstallationOrchestrator>

  beforeEach(() => {
    jest.clearAllMocks()
    orchestrator = new InstallationOrchestrator(mockQueue as any, mockVerifier as any, mockLogger as any)
  })

  it('should enqueue install job with correct args', async () => {
    await orchestrator.install('skill', 'local', ['agent1'])

    expect(mockQueue.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'install',
        skillName: 'skill',
        args: ['install', '-s', 'skill', '-a', 'agent1'],
        cwd: '/workspace',
      }),
    )
  })

  it('should enqueue global install job with -g flag', async () => {
    await orchestrator.install('skill', 'global', ['agent1'])

    expect(mockQueue.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        args: ['install', '-s', 'skill', '-a', 'agent1', '-g'],
      }),
    )
  })

  it('should enqueue repair job with -f flag', async () => {
    await orchestrator.repair('skill', 'local', ['agent1'])

    expect(mockQueue.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'repair',
        args: ['install', '-s', 'skill', '-a', 'agent1', '-f'],
      }),
    )
  })

  it('should block operations if CLI is unhealthy', async () => {
    orchestrator.setCliHealthy(false)
    await orchestrator.install('skill', 'local', ['agent1'])

    expect(mockQueue.enqueue).not.toHaveBeenCalled()
    expect(mockVscode.window.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('CLI is not available'),
      expect.anything(),
    )
  })

  it('should perform post-install verification on success', async () => {
    // Simulate install started (stores metadata)
    await orchestrator.install('skill', 'local', ['agent1'])
    const job = (mockQueue.enqueue as jest.Mock).mock.calls[0][0] as any
    const opId = job.operationId

    // Simulate completion
    const completeHandler = (mockQueue.onJobCompleted as jest.Mock).mock.calls[0][0]

    // Verification pass
    ;(mockVerifier.verify as MockAsyncFn).mockResolvedValue({ ok: true, corrupted: [] })

    await (completeHandler as any)({
      operationId: opId,
      operation: 'install',
      skillName: 'skill',
      status: 'completed',
    })

    expect(mockVerifier.verify).toHaveBeenCalledWith('skill', ['agent1'], 'local', '/workspace')
    expect(mockVscode.window.showInformationMessage).toHaveBeenCalledWith(expect.stringContaining('completed'))
  })

  it('should warn and offer repair if post-install verification fails', async () => {
    await orchestrator.install('skill', 'local', ['agent1'])
    const job = (mockQueue.enqueue as jest.Mock).mock.calls[0][0] as any
    const opId = job.operationId

    const completeHandler = (mockQueue.onJobCompleted as jest.Mock).mock.calls[0][0]

    // Verification fails
    ;(mockVerifier.verify as MockAsyncFn).mockResolvedValue({
      ok: false,
      corrupted: [{ agent: 'agent1', scope: 'local', expectedPath: '...' }],
    })

    // Simulate user clicking "Repair"
    ;(mockVscode.window.showWarningMessage as MockAsyncFn).mockResolvedValue('Repair')

    await (completeHandler as any)({
      operationId: opId,

      operation: 'install',
      skillName: 'skill',
      status: 'completed',
    })

    expect(mockVscode.window.showWarningMessage).toHaveBeenCalledWith(expect.stringContaining('corrupted'), 'Repair')
    expect(mockQueue.enqueue).toHaveBeenCalledTimes(2) // 1 install + 1 repair
    const repairJob = (mockQueue.enqueue as jest.Mock).mock.calls[1][0] as any
    expect(repairJob.operation).toBe('repair')
  })
})
