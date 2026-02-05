import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  CATEGORY_FOLDER_PATTERN,
  CATEGORY_METADATA_FILE,
  DEFAULT_CATEGORY,
  DEFAULT_CATEGORY_ID,
  formatCategoryName,
} from '@tech-leads-club/core'

import type { CategoryInfo, CategoryMetadata } from './types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function getSkillsDir(): string {
  // Dev mode
  const devPath = join(__dirname, '..', '..', 'skills-catalog', 'skills')
  if (existsSync(devPath)) return devPath

  // Built package mode
  const altPath = join(__dirname, '..', '..', '..', 'packages', 'skills-catalog', 'skills')
  if (existsSync(altPath)) return altPath

  return devPath
}

export function loadCategoryMetadata(): CategoryMetadata {
  const skillsDir = getSkillsDir()
  const metadataPath = join(skillsDir, CATEGORY_METADATA_FILE)
  if (!existsSync(metadataPath)) return {}

  try {
    const content = readFileSync(metadataPath, 'utf-8')
    return JSON.parse(content) as CategoryMetadata
  } catch {
    return {}
  }
}

export function saveCategoryMetadata(metadata: CategoryMetadata): void {
  const skillsDir = getSkillsDir()
  const metadataPath = join(skillsDir, CATEGORY_METADATA_FILE)
  const content = JSON.stringify(metadata, null, 2)
  writeFileSync(metadataPath, content + '\n', 'utf-8')
}

export function extractCategoryId(folderName: string): string | null {
  const match = folderName.match(CATEGORY_FOLDER_PATTERN)
  return match ? match[1] : null
}

export function isCategoryFolder(folderName: string): boolean {
  return CATEGORY_FOLDER_PATTERN.test(folderName)
}

export function categoryIdToFolderName(categoryId: string): string {
  return `(${categoryId})`
}

export function getCategories(): CategoryInfo[] {
  const skillsDir = getSkillsDir()
  if (!existsSync(skillsDir)) return []

  const metadata = loadCategoryMetadata()
  const entries = readdirSync(skillsDir, { withFileTypes: true })
  const categories: CategoryInfo[] = []

  let index = 0
  for (const entry of entries) {
    if (!entry.isDirectory() || !isCategoryFolder(entry.name)) continue

    const categoryId = extractCategoryId(entry.name)
    if (!categoryId) continue

    const meta = metadata[entry.name] ?? {}
    categories.push({
      id: categoryId,
      name: meta.name ?? formatCategoryName(categoryId),
      description: meta.description,
      priority: meta.priority ?? index,
    })
    index++
  }

  categories.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100))
  return categories
}

export function getCategoryById(id: string): CategoryInfo | undefined {
  return getCategories().find((cat) => cat.id === id)
}

export function getSkillCategoryId(skillName: string): string {
  const skillsDir = getSkillsDir()
  if (!existsSync(skillsDir)) return DEFAULT_CATEGORY_ID

  const entries = readdirSync(skillsDir, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory() || !isCategoryFolder(entry.name)) continue

    const categoryId = extractCategoryId(entry.name)
    if (!categoryId) continue

    const categoryPath = join(skillsDir, entry.name)
    const skillPath = join(categoryPath, skillName)
    if (existsSync(join(skillPath, 'SKILL.md'))) return categoryId
  }

  return DEFAULT_CATEGORY_ID
}

export function getSkillCategory(skillName: string): CategoryInfo {
  const categoryId = getSkillCategoryId(skillName)
  return getCategoryById(categoryId) ?? DEFAULT_CATEGORY
}

export function categoryExists(categoryId: string): boolean {
  return getCategories().some((cat) => cat.id === categoryId)
}

export function groupSkillsByCategory<T extends { name: string; category?: string; description?: string }>(
  skills: T[],
): Map<CategoryInfo, T[]> {
  // Try to get local categories, fall back to building from skills
  let categories = getCategories()

  // If no local categories, build from skills data
  if (categories.length === 0) {
    const categoryIds = new Set(skills.map((s) => s.category).filter(Boolean) as string[])
    categories = Array.from(categoryIds).map((id, index) => ({
      id,
      name: formatCategoryName(id),
      priority: index,
    }))
  }

  const grouped = new Map<CategoryInfo, T[]>()

  for (const category of categories) {
    grouped.set(category, [])
  }

  grouped.set(DEFAULT_CATEGORY, [])

  for (const skill of skills) {
    const categoryId = skill.category ?? DEFAULT_CATEGORY_ID
    let category = categories.find((c) => c.id === categoryId)

    // If category not found, create it dynamically
    if (!category && categoryId !== DEFAULT_CATEGORY_ID) {
      category = {
        id: categoryId,
        name: formatCategoryName(categoryId),
        priority: 999,
      }
      categories.push(category)
      grouped.set(category, [])
    }

    const targetCategory = category ?? DEFAULT_CATEGORY
    const group = grouped.get(targetCategory) ?? []
    group.push(skill)
    grouped.set(targetCategory, group)
  }

  for (const [category, skillList] of grouped) {
    if (skillList.length === 0) grouped.delete(category)
  }

  // Sort by priority
  const sortedGrouped = new Map<CategoryInfo, T[]>()
  const sortedCategories = Array.from(grouped.keys()).sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100))
  for (const cat of sortedCategories) {
    const skills = grouped.get(cat)
    if (skills) sortedGrouped.set(cat, skills)
  }

  return sortedGrouped
}
