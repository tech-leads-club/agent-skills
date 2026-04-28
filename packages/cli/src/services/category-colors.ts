export const categoryColors: Record<string, string> = {
  web: '#3b82f6',
  devops: '#10b981',
  data: '#8b5cf6',
  mobile: '#f59e0b',
  testing: '#ef4444',
  ai: '#06b6d4',
  security: '#ec4899',
  default: '#64748b',
} as const

export function getColorForCategory(categoryId: string): string {
  if (Object.prototype.hasOwnProperty.call(categoryColors, categoryId)) return categoryColors[categoryId]
  return categoryColors.default
}

export function getAllCategoryColors(): Record<string, string> {
  return { ...categoryColors }
}
