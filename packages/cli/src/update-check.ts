import { createRequire } from 'node:module'
import packageJson from 'package-json'

const PACKAGE_NAME = '@tech-leads-club/agent-skills'

export async function checkForUpdates(currentVersion: string): Promise<string | null> {
  try {
    const result = await packageJson(PACKAGE_NAME)
    if (result.version !== currentVersion) return result.version
    return null
  } catch {
    // Silently fail if offline or registry unavailable
    return null
  }
}

export function getCurrentVersion(): string {
  try {
    const require = createRequire(import.meta.url)
    try {
      const pkg = require('./package.json')
      return pkg.version || '0.0.0'
    } catch {
      const pkg = require('../package.json')
      return pkg.version || '0.0.0'
    }
  } catch {
    return '0.0.0'
  }
}
