import { atom } from 'jotai'

import { isGloballyInstalled } from '../services/global-path'
import { checkForUpdates, getCurrentVersion } from '../services/update-check'

interface EnvironmentCheckState {
  updateAvailable: string | null
  currentVersion: string
  isGlobal: boolean
  loading: boolean
}

const runCheck = async (): Promise<EnvironmentCheckState> => {
  const currentVersion = getCurrentVersion()
  const timeout = new Promise<null>((r) => setTimeout(() => r(null), 100))

  const [updateAvailable, isGlobal] = await Promise.all([
    Promise.race([checkForUpdates(currentVersion).catch(() => null), timeout]),
    Promise.resolve(isGloballyInstalled()).catch(() => false),
  ])

  return { updateAvailable: updateAvailable ?? null, currentVersion, isGlobal: isGlobal as boolean, loading: false }
}

export const environmentCheckAtom = atom<Promise<EnvironmentCheckState>>(runCheck())
