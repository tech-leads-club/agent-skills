import { useEffect, useState } from 'react'

import type { UserConfig } from '../services/config'
import {
  hasShortcutsBeenDismissed,
  isFirstLaunch,
  loadConfig,
  markFirstLaunchComplete,
  markShortcutsDismissed,
  saveConfig,
} from '../services/config'

interface UseConfigReturn {
  config: UserConfig | null
  loading: boolean
  error: string | null
  isFirstLaunch: boolean
  hasShortcutsBeenDismissed: boolean
  markFirstLaunchComplete: () => Promise<void>
  markShortcutsDismissed: () => Promise<void>
  updateConfig: (updates: Partial<UserConfig>) => Promise<void>
}

export function useConfig(): UseConfigReturn {
  const [config, setConfig] = useState<UserConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFirstLaunchState, setIsFirstLaunchState] = useState(false)
  const [hasShortcutsDismissedState, setHasShortcutsDismissedState] = useState(false)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const [configData, firstLaunch, shortcutsDismissed] = await Promise.all([
          loadConfig(),
          isFirstLaunch(),
          hasShortcutsBeenDismissed(),
        ])

        if (mounted) {
          setConfig(configData)
          setIsFirstLaunchState(firstLaunch)
          setHasShortcutsDismissedState(shortcutsDismissed)
        }
      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [])

  const handleMarkFirstLaunchComplete = async () => {
    try {
      await markFirstLaunchComplete()
      setIsFirstLaunchState(false)
      const updatedConfig = await loadConfig()
      setConfig(updatedConfig)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
      throw err
    }
  }

  const handleMarkShortcutsDismissed = async () => {
    try {
      await markShortcutsDismissed()
      setHasShortcutsDismissedState(true)
      const updatedConfig = await loadConfig()
      setConfig(updatedConfig)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
      throw err
    }
  }

  const handleUpdateConfig = async (updates: Partial<UserConfig>) => {
    try {
      await saveConfig(updates)
      const updatedConfig = await loadConfig()
      setConfig(updatedConfig)

      if ('firstLaunchComplete' in updates) {
        setIsFirstLaunchState(!updates.firstLaunchComplete)
      }

      if ('shortcutsOverlayDismissed' in updates) {
        setHasShortcutsDismissedState(Boolean(updates.shortcutsOverlayDismissed))
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
      throw err
    }
  }

  return {
    config,
    loading,
    error,
    isFirstLaunch: isFirstLaunchState,
    hasShortcutsBeenDismissed: hasShortcutsDismissedState,
    markFirstLaunchComplete: handleMarkFirstLaunchComplete,
    markShortcutsDismissed: handleMarkShortcutsDismissed,
    updateConfig: handleUpdateConfig,
  }
}
