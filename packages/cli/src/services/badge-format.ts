export function formatCategoryBadge(installed: number, total: number): string {
  if (installed > 0) return `(${installed}/${total})`
  return `(${total})`
}
