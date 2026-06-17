import { join } from 'node:path'

import { PACKAGE_NAME } from '../constants'
import type { CorePorts } from '../ports'

/**
 * Queries npm for the globally configured root directory.
 *
 * @param ports - Core ports that expose shell execution.
 * @returns The npm global root path or `null` if npm cannot be executed.
 * @example
 * ```ts
 * const root = getNpmGlobalRoot(ports)
 * ```
 */
export function getNpmGlobalRoot(ports: CorePorts): string | null {
  try {
    return ports.shell.exec('npm root -g', { encoding: 'utf-8' }).trim()
  } catch {
    return null
  }
}

/**
 * Determines if the CLI package is installed under npm's global root.
 *
 * @param ports - Core ports that expose shell execution and filesystem checks.
 * @returns `true` when the package exists in the npm global root; otherwise `false`.
 * @example
 * ```ts
 * const globalInstall = isGloballyInstalled(ports)
 * ```
 */
export function isGloballyInstalled(ports: CorePorts): boolean {
  const npmGlobalRoot = getNpmGlobalRoot(ports)
  if (!npmGlobalRoot) return false

  const packagePath = join(npmGlobalRoot, PACKAGE_NAME)
  return ports.fs.existsSync(packagePath)
}
