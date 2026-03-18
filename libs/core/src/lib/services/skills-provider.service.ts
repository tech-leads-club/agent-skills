import { basename, join } from 'node:path'

import { CATEGORY_FOLDER_PATTERN, CATEGORY_METADATA_FILE, DEFAULT_CATEGORY_ID } from '../constants'
import type { CorePorts } from '../ports'
import type { CategoryInfo, SkillInfo, SkillsMode } from '../types'
import { formatCategoryName } from '../utils'

import {
  ensureSkillDownloaded,
  forceDownloadSkill,
  getRemoteCategories,
  getRemoteSkills,
  getSkillMetadata,
} from './registry.service'

interface ModeCache {
  mode: SkillsMode | null
  localDir: string | null
}

const cache = new Map<string, ModeCache>()

function getCacheKey(ports: CorePorts): string {
  try {
    const root = ports.paths.getWorkspaceRoot()
    if (root) return root
  } catch {
    // ignore to allow fallback
  }
  return '__default__'
}

function getCacheEntry(ports: CorePorts): ModeCache {
  const key = getCacheKey(ports)
  let entry = cache.get(key)
  if (!entry) {
    entry = { mode: null, localDir: null }
    cache.set(key, entry)
  }
  return entry
}

function getLocalSkillsDirectory(ports: CorePorts): string | null {
  return ports.paths.getLocalSkillsDirectory()
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
  const entry = getCacheEntry(ports)
  if (entry.mode) return entry.mode
  const localDir = getLocalSkillsDirectory(ports)

  if (localDir) {
    entry.localDir = localDir
    entry.mode = 'local'
    return 'local'
  }

  entry.mode = 'remote'
  return 'remote'
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
  const mode = detectMode(ports)
  const entry = getCacheEntry(ports)
  if (mode === 'local' && entry.localDir) return entry.localDir
  throw new Error('Skills directory not found. Use remote mode or install skills locally.')
}

function isLocalMode(ports: CorePorts): boolean {
  const entry = getCacheEntry(ports)
  return detectMode(ports) === 'local' && entry.localDir !== null
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
  const folderName = basename(skillPath)

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
  const entry = getCacheEntry(ports)
  return isLocalMode(ports) ? discoverLocalSkills(ports, entry.localDir!) : []
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
  const entry = getCacheEntry(ports)
  return isLocalMode(ports) ? discoverLocalSkills(ports, entry.localDir!) : getRemoteSkills(ports)
}

function loadLocalCategoryMetadata(
  ports: CorePorts,
  skillsDir: string,
): Record<string, { name?: string; description?: string }> {
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
  const entry = getCacheEntry(ports)
  return isLocalMode(ports) ? discoverLocalCategories(ports, entry.localDir!) : []
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
  const entry = getCacheEntry(ports)
  return isLocalMode(ports) ? discoverLocalCategories(ports, entry.localDir!) : getRemoteCategories(ports)
}

/**
 * Looks up a skill by name from the local catalog synchronously.
 *
 * @param ports - Core ports used to read local filesystem entries.
 * @param name - The skill name to find.
 * @returns The matching `SkillInfo` or `undefined` when not found.
 *
 * @example
 * ```ts
 * const skill = getSkillByName(ports, 'accessibility')
 * ```
 */
export function getSkillByName(ports: CorePorts, name: string): SkillInfo | undefined {
  return discoverSkills(ports).find((s) => s.name === name)
}

/**
 * Looks up a skill by name from the local catalog or remote registry asynchronously.
 *
 * @param ports - Core ports used for filesystem access and HTTP registry fetching.
 * @param name - The skill name to find.
 * @returns The matching `SkillInfo` or `undefined` when not found.
 *
 * @example
 * ```ts
 * const skill = await getSkillByNameAsync(ports, 'accessibility')
 * ```
 */
export async function getSkillByNameAsync(ports: CorePorts, name: string): Promise<SkillInfo | undefined> {
  const skills = await discoverSkillsAsync(ports)
  return skills.find((s) => s.name === name)
}

/**
 * Ensures a skill is locally available, downloading it from the registry when needed.
 *
 * @param ports - Core ports used for filesystem access and HTTP registry fetching.
 * @param skillName - The skill name to ensure is available.
 * @returns The absolute local path to the skill, or `null` when unavailable.
 *
 * @example
 * ```ts
 * const path = await ensureSkillAvailable(ports, 'accessibility')
 * ```
 */
export async function ensureSkillAvailable(ports: CorePorts, skillName: string): Promise<string | null> {
  if (isLocalMode(ports)) return getSkillByName(ports, skillName)?.path ?? null
  return ensureSkillDownloaded(ports, skillName)
}

/**
 * Returns skill information including the resolved local path.
 *
 * @param ports - Core ports used for filesystem access and HTTP registry fetching.
 * @param skillName - The skill name to retrieve with path.
 * @returns The `SkillInfo` with a resolved local path, or `null` when unavailable.
 *
 * @example
 * ```ts
 * const skill = await getSkillWithPath(ports, 'accessibility')
 * ```
 */
export async function getSkillWithPath(ports: CorePorts, skillName: string): Promise<SkillInfo | null> {
  if (isLocalMode(ports)) return getSkillByName(ports, skillName) ?? null
  const metadata = await getSkillMetadata(ports, skillName)
  if (!metadata) return null
  const localPath = await ensureSkillDownloaded(ports, skillName)
  if (!localPath) return null
  return { name: metadata.name, description: metadata.description, path: localPath, category: metadata.category }
}

/**
 * Returns skill information including the resolved local path, forcing a fresh download.
 *
 * Unlike {@link getSkillWithPath}, this always re-downloads the skill files and updates
 * the cached metadata hash. Use this during update operations to ensure the lockfile
 * receives the current registry hash rather than a stale cached value.
 *
 * @param ports - Core ports used for filesystem access and HTTP registry fetching.
 * @param skillName - The skill name to retrieve with path.
 * @returns The `SkillInfo` with a resolved local path, or `null` when unavailable.
 *
 * @example
 * ```ts
 * const skill = await getSkillWithPathForced(ports, 'cloudflare-deploy')
 * ```
 */
export async function getSkillWithPathForced(ports: CorePorts, skillName: string): Promise<SkillInfo | null> {
  if (isLocalMode(ports)) return getSkillByName(ports, skillName) ?? null
  const metadata = await getSkillMetadata(ports, skillName)
  if (!metadata) return null
  const localPath = await forceDownloadSkill(ports, skillName)
  if (!localPath) return null
  return { name: metadata.name, description: metadata.description, path: localPath, category: metadata.category }
}
