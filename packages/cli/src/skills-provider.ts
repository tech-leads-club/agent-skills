import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  CATEGORY_FOLDER_PATTERN,
  CATEGORY_METADATA_FILE,
  DEFAULT_CATEGORY_ID,
  formatCategoryName,
} from '@tech-leads-club/core'

import { ensureSkillDownloaded, getRemoteCategories, getRemoteSkills, getSkillMetadata } from './registry'
import type { CategoryInfo, SkillInfo } from './types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export type SkillsMode = 'local' | 'remote'

interface ModeCache {
  mode: SkillsMode | null
  localDir: string | null
}

const cache: ModeCache = { mode: null, localDir: null }

const LOCAL_SKILLS_PATHS = [
  join(__dirname, '..', '..', 'skills-catalog', 'skills'),
  join(__dirname, '..', '..', '..', 'packages', 'skills-catalog', 'skills'),
]

function getLocalSkillsDirectory(): string | null {
  return LOCAL_SKILLS_PATHS.find((path) => existsSync(path)) ?? null
}

export function isCategoryFolder(folderName: string): boolean {
  return CATEGORY_FOLDER_PATTERN.test(folderName)
}

export function extractCategoryId(folderName: string): string | null {
  const match = folderName.match(CATEGORY_FOLDER_PATTERN)
  return match?.[1] ?? null
}

function parseSkillFrontmatter(content: string): { name?: string; description?: string } {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) return {}

  const frontmatter = frontmatterMatch[1]
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m)
  const descMatch = frontmatter.match(/^description:\s*(.+)$/m)

  return {
    name: nameMatch?.[1]?.trim(),
    description: descMatch?.[1]?.trim(),
  }
}

function tryReadSkillFromPath(skillPath: string, categoryId: string): SkillInfo | null {
  const skillMdPath = join(skillPath, 'SKILL.md')
  if (!existsSync(skillMdPath)) return null

  const content = readFileSync(skillMdPath, 'utf-8')
  const { name, description } = parseSkillFrontmatter(content)
  const folderName = skillPath.split('/').pop() ?? ''

  return {
    name: name ?? folderName,
    description: description ?? 'No description',
    path: skillPath,
    category: categoryId,
  }
}

function scanLocalSkills(dirPath: string, categoryId: string): SkillInfo[] {
  if (!existsSync(dirPath)) return []

  return readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => tryReadSkillFromPath(join(dirPath, entry.name), categoryId))
    .filter((skill): skill is SkillInfo => skill !== null)
}

function loadLocalCategoryMetadata(skillsDir: string): Record<string, { name?: string; description?: string }> {
  const metadataPath = join(skillsDir, CATEGORY_METADATA_FILE)
  if (!existsSync(metadataPath)) return {}

  try {
    return JSON.parse(readFileSync(metadataPath, 'utf-8'))
  } catch {
    return {}
  }
}

function discoverLocalSkills(skillsDir: string): SkillInfo[] {
  if (!existsSync(skillsDir)) return []

  const entries = readdirSync(skillsDir, { withFileTypes: true })

  return entries
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      if (isCategoryFolder(entry.name)) {
        const categoryId = extractCategoryId(entry.name)
        return categoryId ? scanLocalSkills(join(skillsDir, entry.name), categoryId) : []
      }

      const skill = tryReadSkillFromPath(join(skillsDir, entry.name), DEFAULT_CATEGORY_ID)
      return skill ? [skill] : []
    })
}

function discoverLocalCategories(skillsDir: string): CategoryInfo[] {
  if (!existsSync(skillsDir)) return []

  const metadata = loadLocalCategoryMetadata(skillsDir)

  return readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && isCategoryFolder(entry.name))
    .reduce<CategoryInfo[]>((acc, entry, index) => {
      const categoryId = extractCategoryId(entry.name)
      if (!categoryId) return acc

      const meta = metadata[entry.name] ?? {}
      acc.push({
        id: categoryId,
        name: meta.name ?? formatCategoryName(categoryId),
        description: meta.description,
      })
      return acc
    }, [])
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function detectMode(): SkillsMode {
  if (cache.mode) return cache.mode

  const localDir = getLocalSkillsDirectory()
  if (localDir) {
    cache.localDir = localDir
    cache.mode = 'local'
    return 'local'
  }

  cache.mode = 'remote'
  return 'remote'
}

export function getSkillsDirectory(): string {
  const mode = detectMode()
  if (mode === 'local' && cache.localDir) return cache.localDir
  throw new Error('Skills directory not found. Use remote mode or install skills locally.')
}

function isLocalMode(): boolean {
  return detectMode() === 'local' && cache.localDir !== null
}

export function discoverSkills(): SkillInfo[] {
  return isLocalMode() ? discoverLocalSkills(cache.localDir!) : []
}

export async function discoverSkillsAsync(): Promise<SkillInfo[]> {
  return isLocalMode() ? discoverLocalSkills(cache.localDir!) : getRemoteSkills()
}

export function discoverCategories(): CategoryInfo[] {
  return isLocalMode() ? discoverLocalCategories(cache.localDir!) : []
}

export async function discoverCategoriesAsync(): Promise<CategoryInfo[]> {
  return isLocalMode() ? discoverLocalCategories(cache.localDir!) : getRemoteCategories()
}

export function getSkillByName(name: string): SkillInfo | undefined {
  return discoverSkills().find((s) => s.name === name)
}

export async function getSkillByNameAsync(name: string): Promise<SkillInfo | undefined> {
  const skills = await discoverSkillsAsync()
  return skills.find((s) => s.name === name)
}

export async function ensureSkillAvailable(skillName: string): Promise<string | null> {
  if (isLocalMode()) return getSkillByName(skillName)?.path ?? null
  return ensureSkillDownloaded(skillName)
}

export async function getSkillWithPath(skillName: string): Promise<SkillInfo | null> {
  if (isLocalMode()) return getSkillByName(skillName) ?? null

  const metadata = await getSkillMetadata(skillName)
  if (!metadata) return null

  const localPath = await ensureSkillDownloaded(skillName)
  if (!localPath) return null

  return {
    name: metadata.name,
    description: metadata.description,
    path: localPath,
    category: metadata.category,
  }
}
