import type { CategoryInfo } from './types'

export const SKILLS_CATALOG_DIR = 'packages/skills-catalog/skills'
export const DEFAULT_CATEGORY_ID = 'uncategorized'
export const CATEGORY_FOLDER_PATTERN = /^\(([a-z][a-z0-9-]*)\)$/
export const CATEGORY_METADATA_FILE = '_category.json'

export const DEFAULT_CATEGORY: CategoryInfo = {
  id: DEFAULT_CATEGORY_ID,
  name: 'Uncategorized',
  description: 'Skills without a specific category',
  priority: 999,
}
