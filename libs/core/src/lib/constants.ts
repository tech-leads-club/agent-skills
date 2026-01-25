import type { CategoryInfo } from './types'

export const SKILLS_CATEGORIES_FILE = 'skills/categories.json'
export const SKILLS_ROOT_DIR = 'skills'
export const DEFAULT_CATEGORY_ID = 'uncategorized'

export const DEFAULT_CATEGORY: CategoryInfo = {
  id: DEFAULT_CATEGORY_ID,
  name: 'Uncategorized',
  description: 'Skills without a specific category',
  priority: 999,
}
