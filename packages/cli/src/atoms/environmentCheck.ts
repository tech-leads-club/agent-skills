import { atom } from 'jotai'
import { unwrap } from 'jotai/utils'
import { isGloballyInstalled } from '@tech-leads-club/core'

import { ports } from '../ports'
import { getCachedUpdate, setCachedUpdate } from '../services/update-cache'
import { checkForUpdates, getCurrentVersion } from '../services/update-check'
import { UPDATE_CHECK_TIMEOUT_MS } from '../utils/constants'

export interface EnvironmentCheckState {
  updateAvailable: string | null
  currentVersion: string
  isGlobal: boolean
  isLoading?: boolean
}

async function resolveUpdateAvailable(currentVersion: string): Promise<string | null> {
  const cached = await getCachedUpdate()
  const cachedUpdate = cached && cached.latestVersion !== currentVersion ? cached.latestVersion : null

  try {
    const update = await Promise.race([
      checkForUpdates(currentVersion),
      new Promise<string | null>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), UPDATE_CHECK_TIMEOUT_MS),
      ),
    ])

    setCachedUpdate(update ?? currentVersion).catch(() => {})
    return update
  } catch {
    return cachedUpdate
  }
}

const runCheck = async (): Promise<EnvironmentCheckState> => {
  const currentVersion = getCurrentVersion()

  const [updateAvailable, isGlobal] = await Promise.all([
    resolveUpdateAvailable(currentVersion).catch(() => null),
    Promise.resolve(isGloballyInstalled(ports)).catch(() => false),
  ])

  return { updateAvailable, currentVersion, isGlobal: isGlobal as boolean, isLoading: false }
}

const environmentCheckAsyncAtom = atom<Promise<EnvironmentCheckState>>(runCheck())

export const environmentCheckAtom = unwrap(
  environmentCheckAsyncAtom,
  (prev) => prev ?? { updateAvailable: null, currentVersion: getCurrentVersion(), isGlobal: false, isLoading: true },
)
