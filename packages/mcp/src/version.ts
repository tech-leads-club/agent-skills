import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export function readPackageVersion(moduleUrl: string, fallback: string): string {
  try {
    const manifestPath = fileURLToPath(new URL('./package.json', moduleUrl))
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { version?: unknown }
    return typeof manifest.version === 'string' && manifest.version.length > 0 ? manifest.version : fallback
  } catch {
    return fallback
  }
}
