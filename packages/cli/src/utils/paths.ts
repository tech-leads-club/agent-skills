import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Gets the path to the skills catalog directory.
 * Returns the path regardless of whether it exists (for fallback scenarios).
 */
export function getSkillsCatalogPath(): string {
  return join(getMonorepoRoot(), 'packages', 'skills-catalog', 'skills')
}

/**
 * Checks if running in local development mode (skills catalog exists).
 */
export function isLocalDevMode(): boolean {
  return existsSync(getSkillsCatalogPath())
}

/**
 * Gets the path to a package in the monorepo.
 */
export function getPackagePath(packageName: string): string {
  return join(getMonorepoRoot(), 'packages', packageName)
}

/**
 * Gets the monorepo root directory.
 */
export function getWorkspaceRoot(): string {
  return getMonorepoRoot()
}

/**
 * Resolves paths relative to the monorepo root.
 * In dev mode (tsx): __dirname = packages/cli/src/services/
 * Goes 4 levels up to reach monorepo root.
 */
function getMonorepoRoot(): string {
  return join(__dirname, '..', '..', '..', '..')
}
