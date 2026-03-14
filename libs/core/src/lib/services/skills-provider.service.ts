import { join } from 'node:path'

import {
  CATEGORY_FOLDER_PATTERN,
  CATEGORY_METADATA_FILE,
  DEFAULT_CATEGORY_ID,
  SKILLS_CATALOG_DIR,
} from '../constants'
import type { CorePorts } from '../ports'
import type { CategoryInfo, SkillInfo, SkillsMode } from '../types'
import { formatCategoryName } from '../utils'

import { findProjectRoot } from './project-root.service'
import { ensureSkillDownloaded, getRemoteCategories, getRemoteSkills, getSkillMetadata } from './registry.service'

function getLocalSkillsDirectory(ports: CorePorts): string | null {
  const path = join(findProjectRoot(ports), SKILLS_CATALOG_DIR)
  return ports.fs.existsSync(path) ? path : null
}

/**
 * Detects whether the skills provider runs in local (monorepo catalog) or remote (CDN registry) mode.
 *
 * @param ports - Core ports used to probe the local filesystem for the skills catalog.
 * @returns `'local'` when the local skills catalog directory is found, otherwise `'remote'`.
 *
 * @example
 * ```ts
 * const mode = detectMode(ports)
 * if (mode === 'local') {
 *   console.log('Using local catalog')
 * }
 * ```
 */
export function detectMode(ports: CorePorts): SkillsMode {
  const localDir = getLocalSkillsDirectory(ports)
  return localDir ? 'local' : 'remote'
}

/**
 * Returns the resolved local skills catalog directory path.
 *
 * @param ports - Core ports used to locate the skills catalog.
 * @returns Absolute path to the local skills catalog directory.
 * @throws {Error} When no local catalog is found (remote mode).
 *
 * @example
 * ```ts
 * const dir = getSkillsDirectory(ports)
 * // '/workspace/packages/skills-catalog/skills'
 * ```
 */
export function getSkillsDirectory(ports: CorePorts): string {
  const localDir = getLocalSkillsDirectory(ports)
  if (localDir) return localDir
  throw new Error('Skills directory not found. Use remote mode or install skills locally.')
}
