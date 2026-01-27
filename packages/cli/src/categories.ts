import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  DEFAULT_CATEGORY,
  DEFAULT_CATEGORY_ID,
  SKILLS_CATEGORIES_FILE,
  formatCategoryName,
} from '@tech-leads-club/core'

import type { CategoriesConfig, CategoryInfo } from './types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export function getCategoriesFilePath(): string {
  const devPath = join(__dirname, '..', '..', '..', SKILLS_CATEGORIES_FILE)
  if (existsSync(devPath)) return devPath
  const pkgPath = join(__dirname, '..', SKILLS_CATEGORIES_FILE)
  if (existsSync(pkgPath)) return pkgPath
  const bundlePath = join(__dirname, SKILLS_CATEGORIES_FILE)
  if (existsSync(bundlePath)) return bundlePath
  return devPath
}

export function loadCategoriesConfig(): CategoriesConfig {
  const filePath = getCategoriesFilePath()
  if (!existsSync(filePath)) return { categories: [], skills: {} }

  try {
    const content = readFileSync(filePath, 'utf-8')
    return JSON.parse(content) as CategoriesConfig
  } catch {
    return { categories: [], skills: {} }
  }
}

export function saveCategoriesConfig(config: CategoriesConfig): void {
  const filePath = getCategoriesFilePath()
  const content = JSON.stringify({ $schema: './categories.schema.json', ...config }, null, 2)
  writeFileSync(filePath, content + '\n', 'utf-8')
}

export function getCategories(): CategoryInfo[] {
  const config = loadCategoriesConfig()
  const categories = [...config.categories]
  categories.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100))
  return categories
}

export function getCategoryById(id: string): CategoryInfo | undefined {
  const config = loadCategoriesConfig()
  return config.categories.find((cat) => cat.id === id)
}

export function getSkillCategoryId(skillName: string): string {
  const config = loadCategoriesConfig()
  return config.skills[skillName] ?? DEFAULT_CATEGORY_ID
}

export function getSkillCategory(skillName: string): CategoryInfo {
  const categoryId = getSkillCategoryId(skillName)
  const category = getCategoryById(categoryId)
  return category ?? DEFAULT_CATEGORY
}

export function categoryExists(categoryId: string): boolean {
  const config = loadCategoriesConfig()
  return config.categories.some((cat) => cat.id === categoryId)
}

export function addCategory(category: CategoryInfo): boolean {
  const config = loadCategoriesConfig()
  if (config.categories.some((cat) => cat.id === category.id)) return false
  config.categories.push(category)
  saveCategoriesConfig(config)
  return true
}

export function assignSkillToCategory(skillName: string, categoryId: string, categoryName?: string): void {
  const config = loadCategoriesConfig()

  if (!config.categories.some((cat) => cat.id === categoryId)) {
    const newCategory: CategoryInfo = {
      id: categoryId,
      name: categoryName ?? formatCategoryName(categoryId),
      priority: Math.max(0, ...config.categories.map((c) => c.priority ?? 0)) + 1,
    }
    config.categories.push(newCategory)
  }

  config.skills[skillName] = categoryId
  saveCategoriesConfig(config)
}

export function groupSkillsByCategory<T extends { name: string; category?: string }>(
  skills: T[],
): Map<CategoryInfo, T[]> {
  const config = loadCategoriesConfig()
  const grouped = new Map<CategoryInfo, T[]>()
  const sortedCategories = [...config.categories].sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100))

  for (const category of sortedCategories) {
    grouped.set(category, [])
  }

  grouped.set(DEFAULT_CATEGORY, [])

  for (const skill of skills) {
    const categoryId = skill.category ?? config.skills[skill.name] ?? DEFAULT_CATEGORY_ID
    const category = sortedCategories.find((c) => c.id === categoryId) ?? DEFAULT_CATEGORY
    const group = grouped.get(category) ?? []
    group.push(skill)
    grouped.set(category, group)
  }

  for (const [category, skillList] of grouped) {
    if (skillList.length === 0) grouped.delete(category)
  }

  return grouped
}
