import { jest } from '@jest/globals'
import type { AgentType } from '@tech-leads-club/core'

const mockDetectInstalledAgents = jest.fn<() => AgentType[]>()
jest.unstable_mockModule('@tech-leads-club/core', () => ({
  AGENT_TYPES: ['cursor', 'github-copilot', 'cline'] as AgentType[],
  detectInstalledAgents: mockDetectInstalledAgents,
}))

const mockLoadConfig = jest.fn<() => Promise<{ targetAgents: AgentType[] }>>()
const mockSaveConfig = jest.fn<(config: { targetAgents: AgentType[] }) => Promise<void>>()
jest.unstable_mockModule('../../services/config', () => ({
  loadConfig: mockLoadConfig,
  saveConfig: mockSaveConfig,
}))

jest.unstable_mockModule('../../ports', () => ({
  ports: {},
}))

jest.unstable_mockModule('chalk', () => ({
  default: {
    red: (s: string) => s,
    green: (s: string) => s,
    yellow: (s: string) => s,
    dim: (s: string) => s,
    bold: (s: string) => s,
    blue: (s: string) => s,
  },
}))

const { runCliAgents } = await import('../agents')

describe('runCliAgents CLI', () => {
  let mockExit: jest.SpiedFunction<typeof process.exit>
  let mockConsoleLog: jest.SpiedFunction<typeof console.log>
  let mockConsoleError: jest.SpiedFunction<typeof console.error>
  let mockConsoleWarn: jest.SpiedFunction<typeof console.warn>

  beforeEach(() => {
    jest.clearAllMocks()

    mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit: ${code}`)
    })

    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {})
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {})

    mockLoadConfig.mockResolvedValue({ targetAgents: ['cursor'] })
  })

  afterAll(() => {
    mockExit.mockRestore()
    mockConsoleLog.mockRestore()
    mockConsoleError.mockRestore()
    mockConsoleWarn.mockRestore()
  })

  describe('Validation', () => {
    it('should throw an error and exit if multiple options are provided (conflicting flags)', async () => {
      await expect(runCliAgents({ add: ['cursor'], set: ['cline'] })).rejects.toThrow('process.exit: 1')

      expect(mockConsoleError).toHaveBeenCalledWith('❌ Only one option can be used at a time')
      expect(mockLoadConfig).not.toHaveBeenCalled()
    })

    it('should throw an error and exit if unknown agents are provided', async () => {
      await expect(runCliAgents({ add: ['unknown-agent'] })).rejects.toThrow('process.exit: 1')

      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('❌ Unknown agent(s): unknown-agent'))
      expect(mockSaveConfig).not.toHaveBeenCalled()
    })

    it('should throw an error and exit if a mix of valid and invalid agents are provided', async () => {
      await expect(runCliAgents({ add: ['cursor', 'invalid-agent'] })).rejects.toThrow('process.exit: 1')

      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('❌ Unknown agent(s): invalid-agent'))
      expect(mockSaveConfig).not.toHaveBeenCalled()
    })
  })

  describe('Options', () => {
    it('should handle --add and append to existing config', async () => {
      mockLoadConfig.mockResolvedValue({ targetAgents: ['cursor'] })

      await runCliAgents({ add: ['cline'] })

      expect(mockSaveConfig).toHaveBeenCalledWith({ targetAgents: ['cursor', 'cline'] })
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('✅ Target agents updated with: cline'))
    })

    it('should handle --add without duplicating agents', async () => {
      mockLoadConfig.mockResolvedValue({ targetAgents: ['cursor'] })

      await runCliAgents({ add: ['cursor', 'cline'] })

      expect(mockSaveConfig).toHaveBeenCalledWith({ targetAgents: ['cursor', 'cline'] })
    })

    it('should handle flags passed with empty arrays without modifying the config', async () => {
      mockLoadConfig.mockResolvedValue({ targetAgents: ['cursor'] })

      await runCliAgents({ add: [] })

      expect(mockSaveConfig).toHaveBeenCalledWith({ targetAgents: ['cursor'] })
    })

    it('should handle --set and overwrite existing config', async () => {
      mockLoadConfig.mockResolvedValue({ targetAgents: ['cursor'] })

      await runCliAgents({ set: ['github-copilot'] })

      expect(mockSaveConfig).toHaveBeenCalledWith({ targetAgents: ['github-copilot'] })
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('✅ Target agents set to: github-copilot'))
    })

    it('should handle --remove and filter existing config', async () => {
      mockLoadConfig.mockResolvedValue({ targetAgents: ['cursor', 'cline'] })

      await runCliAgents({ remove: ['cursor'] })

      expect(mockSaveConfig).toHaveBeenCalledWith({ targetAgents: ['cline'] })
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('✅ Target agents removed: cursor'))
    })

    it('should skip saving and warn if the removed agent is not in the current config', async () => {
      mockLoadConfig.mockResolvedValue({ targetAgents: ['cline'] })

      await runCliAgents({ remove: ['cursor'] })

      expect(mockSaveConfig).not.toHaveBeenCalled()
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('⚠️  None of the specified agents were in your target list.'),
      )
    })

    it('should handle --clear and empty config', async () => {
      await runCliAgents({ clear: true })

      expect(mockSaveConfig).toHaveBeenCalledWith({ targetAgents: [] })
      expect(mockConsoleLog).toHaveBeenCalledWith('🧹 Target agents cleared')
    })

    it('should handle --show when config has agents', async () => {
      mockLoadConfig.mockResolvedValue({ targetAgents: ['cursor', 'cline'] })

      await runCliAgents({ show: true })

      expect(mockConsoleLog).toHaveBeenCalledWith('Target agents:')
      expect(mockConsoleLog).toHaveBeenCalledWith('  cursor, cline')
    })

    it('should handle --show when config is empty', async () => {
      mockLoadConfig.mockResolvedValue({ targetAgents: [] })

      await runCliAgents({ show: true })

      expect(mockConsoleLog).toHaveBeenCalledWith('  (None set)')
    })
  })

  describe('--auto detection', () => {
    it('should detect agents and save them successfully', async () => {
      mockDetectInstalledAgents.mockReturnValue(['cursor', 'cline'])

      await runCliAgents({ auto: true })

      expect(mockSaveConfig).toHaveBeenCalledWith({ targetAgents: ['cursor', 'cline'] })
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('✅ Auto-detected and set target agents: cursor, cline'),
      )
    })

    it('should log a WARNING and exit if detection is empty BUT current config exists', async () => {
      mockLoadConfig.mockResolvedValue({ targetAgents: ['cursor'] })
      mockDetectInstalledAgents.mockReturnValue([])

      await expect(runCliAgents({ auto: true })).rejects.toThrow('process.exit: 1')

      expect(mockConsoleWarn).toHaveBeenCalledWith('⚠️  No supported agents detected. Keeping existing configuration.')
      expect(mockSaveConfig).not.toHaveBeenCalled()
    })

    it('should log an ERROR and exit if detection is empty AND current config is empty', async () => {
      mockLoadConfig.mockResolvedValue({ targetAgents: [] })
      mockDetectInstalledAgents.mockReturnValue([])

      await expect(runCliAgents({ auto: true })).rejects.toThrow('process.exit: 1')

      expect(mockConsoleError).toHaveBeenCalledWith('❌ No supported agents detected.')
      expect(mockSaveConfig).not.toHaveBeenCalled()
    })
  })

  describe('Default Behavior', () => {
    it('should print the help menu when no valid options are provided', async () => {
      await runCliAgents({})

      expect(mockConsoleLog).toHaveBeenCalledWith('Target agents management')
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Options:'))
      expect(mockSaveConfig).not.toHaveBeenCalled()
    })
  })
})
