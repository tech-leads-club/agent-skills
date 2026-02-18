import packageJson from 'package-json'

import { PACKAGE_NAME } from '../utils/constants'
import { PACKAGE_VERSION } from './package-info'

export async function checkForUpdates(currentVersion: string): Promise<string | null> {
  try {
    // Don't check for updates if running a prerelease version
    if (isPrerelease(currentVersion)) return null

    const result = await packageJson(PACKAGE_NAME, { version: 'latest' })
    if (result.version !== currentVersion) return result.version
    return null
  } catch {
    // Silently fail if offline or registry unavailable
    return null
  }
}

function isPrerelease(version: string): boolean {
  return /-(alpha|beta|rc|snapshot|dev|canary|next)/i.test(version)
}

export function getCurrentVersion(): string {
  return PACKAGE_VERSION
}
