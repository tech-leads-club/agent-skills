import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { CommandPaletteFlowService, type CommandPaletteFlowContext } from '../../services/command-palette-flow-service'
import type { InstallationOrchestrator } from '../../services/installation-orchestrator'

describe('CommandPaletteFlowService', () => {
  let context: CommandPaletteFlowContext
  let orchestrator: jest.Mocked<InstallationOrchestrator>

  let runQueueActionMock: jest.Mock<
    (action: 'install' | 'remove' | 'update' | 'repair', work: () => Promise<void>) => Promise<void>
  >

  beforeEach(() => {
    runQueueActionMock = jest.fn(async (_action, work) => work())

    context = {
      getPolicy: () => undefined,
      checkPolicyBlocking: () => false,
      loadRegistryForCommand: async () => ({ version: '1', categories: {}, skills: [] }),
      getInstalledSkills: async () => ({}),
      getInstalledHashes: async () => ({}),
      getAvailableAgents: async () => [{ agent: 'cursor', displayName: 'Cursor', company: 'A' }],
      pickSkills: async () => ['skill-a'],
      pickAgentsForSkills: async () => ['cursor'],
      pickScopeForSkills: async () => ({ label: 'Globally', scopeId: 'global' }),
      doesSkillNeedActionForScope: () => true,
      getAgentDisplayNames: () => ['Cursor'],
      confirmLifecycleAction: async () => true,
      resolveSelectionScope: () => 'global',
      runQueueAction: runQueueActionMock,
    }

    orchestrator = {
      installMany: jest.fn(async () => undefined),
      removeMany: jest.fn(async () => undefined),
      updateMany: jest.fn(async () => undefined),
      repairMany: jest.fn(async () => undefined),
    } as unknown as jest.Mocked<InstallationOrchestrator>
  })

  it('runs add flow through queue action', async () => {
    const service = new CommandPaletteFlowService(orchestrator, context)

    await service.runAddFlow()

    expect(runQueueActionMock).toHaveBeenCalledWith('install', expect.any(Function))
    expect(orchestrator.installMany).toHaveBeenCalledWith(['skill-a'], 'global', ['cursor'], 'command-palette')
  })

  it('runs update flow through queue action', async () => {
    const service = new CommandPaletteFlowService(orchestrator, context)

    await service.runUpdateFlow()

    expect(runQueueActionMock).toHaveBeenCalledWith('update', expect.any(Function))
    expect(orchestrator.updateMany).toHaveBeenCalledWith(['skill-a'], 'command-palette')
  })
})
