import { jest } from '@jest/globals'
import type { AgentType } from '@tech-leads-club/core'

const mockDetectInstalledAgents = jest.fn<() => AgentType[]>()
jest.unstable_mockModule('@tech-leads-club/core', () => ({
  detectInstalledAgents: mockDetectInstalledAgents,
}))

const mockLoadConfig = jest.fn<() => Promise<{ targetAgents: AgentType[] }>>()
jest.unstable_mockModule('../config', () => ({
  loadConfig: mockLoadConfig,
}))

jest.unstable_mockModule('../../ports', () => ({
  ports: {},
}))

jest.unstable_mockModule('chalk', () => ({
  default: {
    red: (s: string) => s,
    dim: (s: string) => s,
  },
}))

const { getTargetAgents, reportNoTargetAgents } = await import('../target-agents')

describe('getTargetAgents', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('uses the CLI flag when agents are passed explicitly', async () => {
    mockLoadConfig.mockResolvedValue({ targetAgents: ['cline'] })

    const result = await getTargetAgents(['cursor', 'windsurf'])

    expect(result).toEqual({ agents: ['cursor', 'windsurf'], source: 'CLI flag' })
    expect(mockDetectInstalledAgents).not.toHaveBeenCalled()
  })

  it('falls back to user configuration when no CLI flag is passed', async () => {
    mockLoadConfig.mockResolvedValue({ targetAgents: ['cline'] })

    const result = await getTargetAgents(undefined)

    expect(result).toEqual({ agents: ['cline'], source: 'user configuration' })
    expect(mockDetectInstalledAgents).not.toHaveBeenCalled()
  })

  it('falls back to auto-detection when there is no CLI flag or configuration', async () => {
    mockLoadConfig.mockResolvedValue({ targetAgents: [] })
    mockDetectInstalledAgents.mockReturnValue(['github-copilot'])

    const result = await getTargetAgents([])

    expect(result).toEqual({ agents: ['github-copilot'], source: 'auto-detection' })
  })

  it('returns an empty result when nothing is configured, passed, or detected', async () => {
    mockLoadConfig.mockResolvedValue({ targetAgents: [] })
    mockDetectInstalledAgents.mockReturnValue([])

    const result = await getTargetAgents()

    expect(result).toEqual({ agents: [], source: '' })
  })
})

describe('reportNoTargetAgents', () => {
  let mockExit: jest.SpiedFunction<typeof process.exit>
  let mockConsoleError: jest.SpiedFunction<typeof console.error>

  beforeEach(() => {
    jest.clearAllMocks()
    mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit: ${code}`)
    })
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    mockExit.mockRestore()
    mockConsoleError.mockRestore()
  })

  it('reports the command-specific message and exits with code 1', () => {
    expect(() => reportNoTargetAgents('remove', 'removal')).toThrow('process.exit: 1')

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining('No agents specified and none could be detected or found in configuration.'),
    )
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining('"agent-skills remove" command to specify the target agents for this removal.'),
    )
  })
})
