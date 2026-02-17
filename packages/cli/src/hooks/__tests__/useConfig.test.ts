/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals'
import { act, renderHook, waitFor } from '@testing-library/react'

const mockMkdir = jest.fn<() => Promise<void>>()
const mockReadFile = jest.fn<(path: string, encoding: string) => Promise<string>>()
const mockWriteFile = jest.fn<(path: string, data: string, encoding: string) => Promise<void>>()
const mockHomedir = jest.fn<() => string>()

jest.unstable_mockModule('node:fs/promises', () => ({
  mkdir: mockMkdir,
  readFile: mockReadFile,
  writeFile: mockWriteFile,
}))

jest.unstable_mockModule('node:os', () => ({
  homedir: mockHomedir,
}))

const { useConfig } = await import('../useConfig')

describe('useConfig hook', () => {
  const mockHome = '/home/testuser'

  beforeEach(() => {
    jest.clearAllMocks()
    mockHomedir.mockReturnValue(mockHome)
  })

  describe('initial load', () => {
    it('should load config on mount', async () => {
      const config = {
        firstLaunchComplete: true,
        shortcutsOverlayDismissed: false,
        version: '1.0.0',
      }

      mockReadFile.mockResolvedValue(JSON.stringify(config))
      const { result } = renderHook(() => useConfig())
      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.config).toEqual(config)
      expect(result.current.error).toBeNull()
      expect(result.current.isFirstLaunch).toBe(false)
      expect(result.current.hasShortcutsBeenDismissed).toBe(false)
    })

    it('should handle first launch state', async () => {
      const config = {
        firstLaunchComplete: false,
        shortcutsOverlayDismissed: false,
        version: '1.0.0',
      }

      mockReadFile.mockResolvedValue(JSON.stringify(config))
      const { result } = renderHook(() => useConfig())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isFirstLaunch).toBe(true)
      expect(result.current.hasShortcutsBeenDismissed).toBe(false)
    })

    it('should handle shortcuts dismissed state', async () => {
      const config = {
        firstLaunchComplete: true,
        shortcutsOverlayDismissed: true,
        version: '1.0.0',
      }

      mockReadFile.mockResolvedValue(JSON.stringify(config))
      const { result } = renderHook(() => useConfig())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isFirstLaunch).toBe(false)
      expect(result.current.hasShortcutsBeenDismissed).toBe(true)
    })

    it('should handle load errors', async () => {
      mockReadFile.mockRejectedValue(new Error('Permission denied'))
      const { result } = renderHook(() => useConfig())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.config).toEqual({
        firstLaunchComplete: false,
        shortcutsOverlayDismissed: false,
        version: '1.0.0',
      })
    })

    it('should use default config when file does not exist', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT: no such file'))
      const { result } = renderHook(() => useConfig())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.config).toEqual({
        firstLaunchComplete: false,
        shortcutsOverlayDismissed: false,
        version: '1.0.0',
      })

      expect(result.current.isFirstLaunch).toBe(true)
    })
  })

  describe('markFirstLaunchComplete', () => {
    it('should update first launch state', async () => {
      const initialConfig = {
        firstLaunchComplete: false,
        shortcutsOverlayDismissed: false,
        version: '1.0.0',
      }

      const updatedConfig = {
        ...initialConfig,
        firstLaunchComplete: true,
      }

      mockReadFile
        .mockResolvedValueOnce(JSON.stringify(initialConfig))
        .mockResolvedValueOnce(JSON.stringify(initialConfig))
        .mockResolvedValueOnce(JSON.stringify(initialConfig))
        .mockResolvedValueOnce(JSON.stringify(initialConfig))
        .mockResolvedValueOnce(JSON.stringify(updatedConfig))
      mockMkdir.mockResolvedValue(undefined)
      mockWriteFile.mockResolvedValue(undefined)

      const { result } = renderHook(() => useConfig())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isFirstLaunch).toBe(true)

      await act(async () => {
        await result.current.markFirstLaunchComplete()
      })

      await waitFor(() => {
        expect(result.current.isFirstLaunch).toBe(false)
      })
      expect(result.current.config?.firstLaunchComplete).toBe(true)
    })

    it('should handle errors when marking first launch complete', async () => {
      const config = {
        firstLaunchComplete: false,
        shortcutsOverlayDismissed: false,
        version: '1.0.0',
      }

      mockReadFile.mockResolvedValue(JSON.stringify(config))
      mockMkdir.mockResolvedValue(undefined)
      mockWriteFile.mockRejectedValue(new Error('Write failed'))

      const { result } = renderHook(() => useConfig())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await expect(result.current.markFirstLaunchComplete()).rejects.toThrow('Write failed')
      })

      expect(result.current.error).toBe('Write failed')
    })
  })

  describe('markShortcutsDismissed', () => {
    it('should update shortcuts dismissed state', async () => {
      const initialConfig = {
        firstLaunchComplete: false,
        shortcutsOverlayDismissed: false,
        version: '1.0.0',
      }
      const updatedConfig = {
        ...initialConfig,
        shortcutsOverlayDismissed: true,
      }

      mockReadFile
        .mockResolvedValueOnce(JSON.stringify(initialConfig))
        .mockResolvedValueOnce(JSON.stringify(initialConfig))
        .mockResolvedValueOnce(JSON.stringify(initialConfig))
        .mockResolvedValueOnce(JSON.stringify(initialConfig))
        .mockResolvedValueOnce(JSON.stringify(updatedConfig))

      mockMkdir.mockResolvedValue(undefined)
      mockWriteFile.mockResolvedValue(undefined)

      const { result } = renderHook(() => useConfig())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.hasShortcutsBeenDismissed).toBe(false)

      await act(async () => {
        await result.current.markShortcutsDismissed()
      })

      await waitFor(() => {
        expect(result.current.hasShortcutsBeenDismissed).toBe(true)
      })
      expect(result.current.config?.shortcutsOverlayDismissed).toBe(true)
    })

    it('should handle errors when marking shortcuts dismissed', async () => {
      const config = {
        firstLaunchComplete: false,
        shortcutsOverlayDismissed: false,
        version: '1.0.0',
      }

      mockReadFile.mockResolvedValue(JSON.stringify(config))
      mockMkdir.mockResolvedValue(undefined)
      mockWriteFile.mockRejectedValue(new Error('Write failed'))

      const { result } = renderHook(() => useConfig())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await expect(result.current.markShortcutsDismissed()).rejects.toThrow('Write failed')
      })

      expect(result.current.error).toBe('Write failed')
    })
  })

  describe('updateConfig', () => {
    it('should update config with partial updates', async () => {
      const initialConfig = {
        firstLaunchComplete: false,
        shortcutsOverlayDismissed: false,
        version: '1.0.0',
      }

      const updatedConfig = {
        ...initialConfig,
        firstLaunchComplete: true,
        shortcutsOverlayDismissed: true,
      }

      mockReadFile
        .mockResolvedValueOnce(JSON.stringify(initialConfig))
        .mockResolvedValueOnce(JSON.stringify(initialConfig))
        .mockResolvedValueOnce(JSON.stringify(initialConfig))
        .mockResolvedValueOnce(JSON.stringify(initialConfig))
        .mockResolvedValueOnce(JSON.stringify(updatedConfig))

      mockMkdir.mockResolvedValue(undefined)
      mockWriteFile.mockResolvedValue(undefined)

      const { result } = renderHook(() => useConfig())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.updateConfig({
          firstLaunchComplete: true,
          shortcutsOverlayDismissed: true,
        })
      })

      await waitFor(() => {
        expect(result.current.config).toEqual(updatedConfig)
      })
      expect(result.current.isFirstLaunch).toBe(false)
      expect(result.current.hasShortcutsBeenDismissed).toBe(true)
    })

    it('should handle errors when updating config', async () => {
      const config = {
        firstLaunchComplete: false,
        shortcutsOverlayDismissed: false,
        version: '1.0.0',
      }

      mockReadFile.mockResolvedValue(JSON.stringify(config))
      mockMkdir.mockResolvedValue(undefined)
      mockWriteFile.mockRejectedValue(new Error('Write failed'))

      const { result } = renderHook(() => useConfig())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await expect(result.current.updateConfig({ firstLaunchComplete: true })).rejects.toThrow('Write failed')
      })

      expect(result.current.error).toBe('Write failed')
    })
  })

  describe('cleanup', () => {
    it('should not update state after unmount', async () => {
      const config = {
        firstLaunchComplete: false,
        shortcutsOverlayDismissed: false,
        version: '1.0.0',
      }

      mockReadFile.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(JSON.stringify(config)), 100)
          }),
      )

      const { result, unmount } = renderHook(() => useConfig())

      expect(result.current.loading).toBe(true)
      unmount()

      await new Promise((resolve) => setTimeout(resolve, 150))
      expect(result.current.loading).toBe(true)
      expect(result.current.config).toBeNull()
    })
  })
})
