import { Tree } from '@nx/devkit'

import { CategoriesConfig, CategoryInfo, SKILLS_CATEGORIES_FILE, formatCategoryName } from '@tech-leads-club/core'

export function loadCategoriesConfig(tree: Tree): CategoriesConfig {
  if (!tree.exists(SKILLS_CATEGORIES_FILE)) return { categories: [], skills: {} }
  const content = tree.read(SKILLS_CATEGORIES_FILE, 'utf-8')
  if (!content) return { categories: [], skills: {} }

  try {
    return JSON.parse(content) as CategoriesConfig
  } catch {
    return { categories: [], skills: {} }
  }
}

export function saveCategoriesConfig(tree: Tree, config: CategoriesConfig): void {
  const content = JSON.stringify(
    { $schema: './categories.schema.json', categories: config.categories, skills: config.skills },
    null,
    2,
  )
  tree.write(SKILLS_CATEGORIES_FILE, content + '\n')
}

export function categoryExists(tree: Tree, categoryId: string): boolean {
  const config = loadCategoriesConfig(tree)
  return config.categories.some((cat) => cat.id === categoryId)
}

export function assignSkillToCategory(tree: Tree, skillName: string, categoryId: string, categoryName?: string): void {
  const config = loadCategoriesConfig(tree)

  if (!config.categories.some((cat) => cat.id === categoryId)) {
    const newCategory: CategoryInfo = {
      id: categoryId,
      name: categoryName ?? formatCategoryName(categoryId),
      priority: Math.max(0, ...config.categories.map((c) => c.priority ?? 0)) + 1,
    }
    config.categories.push(newCategory)
    console.log(`📁 Created new category: "${newCategory.name}"`)
  }

  config.skills[skillName] = categoryId
  saveCategoriesConfig(tree, config)
}
