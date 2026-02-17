import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { PACKAGE_NAME } from './package-info'

export function getNpmGlobalRoot(): string | null {
  try {
    return execSync('npm root -g', { encoding: 'utf-8' }).trim()
  } catch {
    return null
  }
}

export function isGloballyInstalled(): boolean {
  const npmGlobalRoot = getNpmGlobalRoot()
  if (!npmGlobalRoot) return false
  const packagePath = join(npmGlobalRoot, PACKAGE_NAME)
  return existsSync(packagePath)
}
