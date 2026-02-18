import { atom } from 'jotai'
import { unwrap } from 'jotai/utils'

import { isGloballyInstalled } from '../services/global-path'
import { checkForUpdates, getCurrentVersion } from '../services/update-check'

export interface EnvironmentCheckState {
  updateAvailable: string | null
  currentVersion: string
  isGlobal: boolean
}

const runCheck = async (): Promise<EnvironmentCheckState> => {
  const currentVersion = getCurrentVersion()
  const timeout = new Promise<null>((r) => setTimeout(() => r(null), 100))

  const [updateAvailable, isGlobal] = await Promise.all([
    Promise.race([checkForUpdates(currentVersion).catch(() => null), timeout]),
    Promise.resolve(isGloballyInstalled()).catch(() => false),
  ])

  return { updateAvailable: updateAvailable ?? null, currentVersion, isGlobal: isGlobal as boolean }
}

const environmentCheckAsyncAtom = atom<Promise<EnvironmentCheckState>>(runCheck())

export const environmentCheckAtom = unwrap(
  environmentCheckAsyncAtom,
  (prev) =>
    prev ?? {
      updateAvailable: null,
      currentVersion: getCurrentVersion(),
      isGlobal: false,
    },
)
