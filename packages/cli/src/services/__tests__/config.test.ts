import { jest } from '@jest/globals'
import { join } from 'node:path'

const mockMkdir = jest.fn<() => Promise<void>>()
const mockReadFile = jest.fn<(path: string, encoding: string) => Promise<string>>()
const mockWriteFile = jest.fn<(path: string, data: string, encoding: string) => Promise<void>>()
const mockHomedir = jest.fn<() => string>()

const mockRename = jest.fn<(oldPath: string, newPath: string) => Promise<void>>()
const mockRm = jest.fn<(path: string, options?: { force?: boolean }) => Promise<void>>()

jest.unstable_mockModule('node:fs/promises', () => ({
  mkdir: mockMkdir,
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  rename: mockRename,
  rm: mockRm,
}))

jest.unstable_mockModule('node:os', () => ({
  homedir: mockHomedir,
}))

const {
  loadConfig,
  saveConfig,
  isFirstLaunch,
  markFirstLaunchComplete,
  hasShortcutsBeenDismissed,
  markShortcutsDismissed,
} = await import('../config')

describe('config service', () => {
  const mockHome = '/home/testuser'
  const expectedConfigPath = join(mockHome, '.agent-skills', 'config.json')

  beforeEach(() => {
    jest.clearAllMocks()
    mockHomedir.mockReturnValue(mockHome)
  })

  describe('loadConfig', () => {
    it('should return default config when file does not exist', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT: no such file'))
      const config = await loadConfig()
      expect(config).toEqual({ firstLaunchComplete: false, shortcutsOverlayDismissed: false, version: '1.0.0' })
    })

    it('should load and validate existing config', async () => {
      const existingConfig = { firstLaunchComplete: true, shortcutsOverlayDismissed: true, version: '1.0.0' }
      mockReadFile.mockResolvedValue(JSON.stringify(existingConfig))
      const config = await loadConfig()
      expect(mockReadFile).toHaveBeenCalledWith(expectedConfigPath, 'utf-8')
      expect(config).toEqual(existingConfig)
    })

    it('should merge with defaults when config is incomplete', async () => {
      const partialConfig = { firstLaunchComplete: true }
      mockReadFile.mockResolvedValue(JSON.stringify(partialConfig))
      const config = await loadConfig()
      expect(config).toEqual({ firstLaunchComplete: true, shortcutsOverlayDismissed: false, version: '1.0.0' })
    })

    it('should return defaults when config is invalid JSON', async () => {
      mockReadFile.mockResolvedValue('invalid json{')
      const config = await loadConfig()
      expect(config).toEqual({ firstLaunchComplete: false, shortcutsOverlayDismissed: false, version: '1.0.0' })
    })

    it('should return defaults when config is not an object', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify('string value'))
      const config = await loadConfig()
      expect(config).toEqual({ firstLaunchComplete: false, shortcutsOverlayDismissed: false, version: '1.0.0' })
    })
  })

  describe('saveConfig', () => {
    it('should create directory, save config to temp file, and rename', async () => {
      const existingConfig = { firstLaunchComplete: false, shortcutsOverlayDismissed: false, version: '1.0.0' }
      mockReadFile.mockResolvedValue(JSON.stringify(existingConfig))
      mockMkdir.mockResolvedValue(undefined)
      mockWriteFile.mockResolvedValue(undefined)
      mockRename.mockResolvedValue(undefined)
      await saveConfig({ firstLaunchComplete: true })
      expect(mockMkdir).toHaveBeenCalledWith(join(mockHome, '.agent-skills'), { recursive: true })

      expect(mockWriteFile).toHaveBeenCalledTimes(1)
      const writeCall = mockWriteFile.mock.calls[0] as [string, string, string]
      expect(writeCall[0]).toBe(`${expectedConfigPath}.tmp`)
      const savedConfig = JSON.parse(writeCall[1])
      expect(savedConfig).toEqual({ firstLaunchComplete: true, shortcutsOverlayDismissed: false, version: '1.0.0' })
      expect(mockRename).toHaveBeenCalledWith(`${expectedConfigPath}.tmp`, expectedConfigPath)
    })

    it('should merge partial updates with existing config', async () => {
      const existingConfig = { firstLaunchComplete: true, shortcutsOverlayDismissed: false, version: '1.0.0' }
      mockReadFile.mockResolvedValue(JSON.stringify(existingConfig))
      mockMkdir.mockResolvedValue(undefined)
      mockWriteFile.mockResolvedValue(undefined)
      mockRename.mockResolvedValue(undefined)
      await saveConfig({ shortcutsOverlayDismissed: true })
      expect(mockWriteFile).toHaveBeenCalledTimes(1)
      const writeCall = mockWriteFile.mock.calls[0] as [string, string, string]

      const savedConfig = JSON.parse(writeCall[1])
      expect(savedConfig).toEqual({ firstLaunchComplete: true, shortcutsOverlayDismissed: true, version: '1.0.0' })
      expect(mockRename).toHaveBeenCalledWith(`${expectedConfigPath}.tmp`, expectedConfigPath)
    })
  })

  describe('isFirstLaunch', () => {
    it('should return true when firstLaunchComplete is false', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({ firstLaunchComplete: false, shortcutsOverlayDismissed: false, version: '1.0.0' }),
      )
      const result = await isFirstLaunch()
      expect(result).toBe(true)
    })

    it('should return false when firstLaunchComplete is true', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({ firstLaunchComplete: true, shortcutsOverlayDismissed: false, version: '1.0.0' }),
      )
      const result = await isFirstLaunch()
      expect(result).toBe(false)
    })

    it('should return true when config file does not exist', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'))
      const result = await isFirstLaunch()
      expect(result).toBe(true)
    })
  })

  describe('markFirstLaunchComplete', () => {
    it('should set firstLaunchComplete to true', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({ firstLaunchComplete: false, shortcutsOverlayDismissed: false, version: '1.0.0' }),
      )
      mockMkdir.mockResolvedValue(undefined)
      mockWriteFile.mockResolvedValue(undefined)
      mockRename.mockResolvedValue(undefined)
      await markFirstLaunchComplete()
      const writeCall = mockWriteFile.mock.calls[0] as [string, string, string]
      const savedConfig = JSON.parse(writeCall[1])
      expect(savedConfig.firstLaunchComplete).toBe(true)
      expect(mockRename).toHaveBeenCalledWith(`${expectedConfigPath}.tmp`, expectedConfigPath)
    })
  })

  describe('hasShortcutsBeenDismissed', () => {
    it('should return true when shortcutsOverlayDismissed is true', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({ firstLaunchComplete: false, shortcutsOverlayDismissed: true, version: '1.0.0' }),
      )
      const result = await hasShortcutsBeenDismissed()
      expect(result).toBe(true)
    })

    it('should return false when shortcutsOverlayDismissed is false', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({ firstLaunchComplete: false, shortcutsOverlayDismissed: false, version: '1.0.0' }),
      )
      const result = await hasShortcutsBeenDismissed()
      expect(result).toBe(false)
    })
  })

  describe('markShortcutsDismissed', () => {
    it('should set shortcutsOverlayDismissed to true', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({ firstLaunchComplete: false, shortcutsOverlayDismissed: false, version: '1.0.0' }),
      )
      mockMkdir.mockResolvedValue(undefined)
      mockWriteFile.mockResolvedValue(undefined)
      mockRename.mockResolvedValue(undefined)
      await markShortcutsDismissed()
      const writeCall = mockWriteFile.mock.calls[0] as [string, string, string]
      const savedConfig = JSON.parse(writeCall[1])
      expect(savedConfig.shortcutsOverlayDismissed).toBe(true)
      expect(mockRename).toHaveBeenCalledWith(`${expectedConfigPath}.tmp`, expectedConfigPath)
    })
  })
})
