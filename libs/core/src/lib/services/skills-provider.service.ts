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

function isCategoryFolder(folderName: string): boolean {
  return CATEGORY_FOLDER_PATTERN.test(folderName)
}

function extractCategoryId(folderName: string): string | null {
  const match = folderName.match(CATEGORY_FOLDER_PATTERN)
  return match?.[1] ?? null
}

function parseSkillFrontmatter(content: string): { name?: string; description?: string } {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) return {}
  const frontmatter = frontmatterMatch[1]
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m)
  const descMatch = frontmatter.match(/^description:\s*(.+)$/m)
  return { name: nameMatch?.[1]?.trim(), description: descMatch?.[1]?.trim() }
}

function tryReadSkillFromPath(ports: CorePorts, skillPath: string, categoryId: string): SkillInfo | null {
  const skillMdPath = join(skillPath, 'SKILL.md')
  if (!ports.fs.existsSync(skillMdPath)) return null
  const content = ports.fs.readFileSync(skillMdPath, 'utf-8')
  const { name, description } = parseSkillFrontmatter(content)
  const folderName = skillPath.split('/').pop() ?? ''

  return {
    name: name ?? folderName,
    description: description ?? 'No description',
    path: skillPath,
    category: categoryId,
  }
}

function scanLocalSkills(ports: CorePorts, dirPath: string, categoryId: string): SkillInfo[] {
  if (!ports.fs.existsSync(dirPath)) return []
  return ports.fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => tryReadSkillFromPath(ports, join(dirPath, entry.name), categoryId))
    .filter((skill): skill is SkillInfo => skill !== null)
}

function discoverLocalSkills(ports: CorePorts, skillsDir: string): SkillInfo[] {
  if (!ports.fs.existsSync(skillsDir)) return []
  const entries = ports.fs.readdirSync(skillsDir, { withFileTypes: true })

  return entries
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      if (isCategoryFolder(entry.name)) {
        const categoryId = extractCategoryId(entry.name)
        return categoryId ? scanLocalSkills(ports, join(skillsDir, entry.name), categoryId) : []
      }
      const skill = tryReadSkillFromPath(ports, join(skillsDir, entry.name), DEFAULT_CATEGORY_ID)
      return skill ? [skill] : []
    })
}

function isLocalMode(ports: CorePorts): boolean {
  return getLocalSkillsDirectory(ports) !== null
}

/**
 * Discovers skills from the local skills catalog synchronously.
 *
 * @param ports - Core ports used to read local filesystem entries.
 * @returns Skills found in the local catalog, or an empty array in remote mode.
 *
 * @example
 * ```ts
 * const skills = discoverSkills(ports)
 * // [{ name: 'accessibility', description: '...', path: '...', category: 'quality' }]
 * ```
 */
export function discoverSkills(ports: CorePorts): SkillInfo[] {
  const localDir = getLocalSkillsDirectory(ports)
  return localDir ? discoverLocalSkills(ports, localDir) : []
}

/**
 * Discovers skills from local catalog or remote registry, depending on the detected mode.
 *
 * @param ports - Core ports used for filesystem access and HTTP registry fetching.
 * @returns Skills from the local catalog in local mode, or from the remote registry in remote mode.
 *
 * @example
 * ```ts
 * const skills = await discoverSkillsAsync(ports)
 * ```
 */
export async function discoverSkillsAsync(ports: CorePorts): Promise<SkillInfo[]> {
  const localDir = getLocalSkillsDirectory(ports)
  return localDir ? discoverLocalSkills(ports, localDir) : getRemoteSkills(ports)
}

function loadLocalCategoryMetadata(ports: CorePorts, skillsDir: string): Record<string, { name?: string; description?: string }> {
  const metadataPath = join(skillsDir, CATEGORY_METADATA_FILE)
  if (!ports.fs.existsSync(metadataPath)) return {}

  try {
    return JSON.parse(ports.fs.readFileSync(metadataPath, 'utf-8'))
  } catch {
    return {}
  }
}

function discoverLocalCategories(ports: CorePorts, skillsDir: string): CategoryInfo[] {
  if (!ports.fs.existsSync(skillsDir)) return []
  const metadata = loadLocalCategoryMetadata(ports, skillsDir)

  return ports.fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && isCategoryFolder(entry.name))
    .reduce<CategoryInfo[]>((acc, entry, _) => {
      const categoryId = extractCategoryId(entry.name)
      if (!categoryId) return acc
      const meta = metadata[entry.name] ?? {}
      acc.push({ id: categoryId, name: meta.name ?? formatCategoryName(categoryId), description: meta.description })
      return acc
    }, [])
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Discovers skill categories from the local catalog synchronously.
 *
 * @param ports - Core ports used to read local filesystem entries.
 * @returns Categories found in the local catalog, or an empty array in remote mode.
 *
 * @example
 * ```ts
 * const categories = discoverCategories(ports)
 * ```
 */
export function discoverCategories(ports: CorePorts): CategoryInfo[] {
  const localDir = getLocalSkillsDirectory(ports)
  return localDir ? discoverLocalCategories(ports, localDir) : []
}

/**
 * Discovers skill categories from local catalog or remote registry.
 *
 * @param ports - Core ports used for filesystem access and HTTP registry fetching.
 * @returns Categories from the local catalog in local mode, or from the remote registry in remote mode.
 *
 * @example
 * ```ts
 * const categories = await discoverCategoriesAsync(ports)
 * ```
 */
export async function discoverCategoriesAsync(ports: CorePorts): Promise<CategoryInfo[]> {
  const localDir = getLocalSkillsDirectory(ports)
  return localDir ? discoverLocalCategories(ports, localDir) : getRemoteCategories(ports)
}
