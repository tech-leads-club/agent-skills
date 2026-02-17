import { useEffect, useState } from 'react'

import { isGloballyInstalled } from '../services/global-path'
import { checkForUpdates, getCurrentVersion } from '../services/update-check'

interface UseEnvironmentCheckReturn {
  updateAvailable: string | null
  currentVersion: string
  isGlobal: boolean
  loading: boolean
}

export function useEnvironmentCheck(): UseEnvironmentCheckReturn {
  const [updateAvailable, setUpdateAvailable] = useState<string | null>(null)
  const [currentVersion] = useState<string>(getCurrentVersion())
  const [isGlobal, setIsGlobal] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let mounted = true

    const checkEnvironment = async () => {
      try {
        const timeoutPromise = new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 100)
        })

        const updateCheckPromise = checkForUpdates(currentVersion)
          .then((version) => {
            if (mounted) setUpdateAvailable(version)
          })
          .catch(() => {
            // Silent failure
            if (mounted) setUpdateAvailable(null)
          })

        const globalCheckPromise = Promise.resolve().then(() => {
          if (mounted) {
            try {
              setIsGlobal(isGloballyInstalled())
            } catch {
              // Silent failure
              setIsGlobal(false)
            }
          }
        })

        await Promise.race([Promise.all([updateCheckPromise, globalCheckPromise]), timeoutPromise])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    checkEnvironment()

    return () => {
      mounted = false
    }
  }, [currentVersion])

  return {
    updateAvailable,
    currentVersion,
    isGlobal,
    loading,
  }
}
