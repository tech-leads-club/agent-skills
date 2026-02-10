export const TERMINAL_DEFAULTS = Object.freeze({
  WIDTH: 80,
  HEIGHT: 20,
})

export function getTerminalWidth(defaultWidth = TERMINAL_DEFAULTS.WIDTH): number {
  return process.stdout.columns ?? defaultWidth
}

export function getTerminalHeight(defaultHeight = TERMINAL_DEFAULTS.HEIGHT): number {
  return process.stdout.rows ?? defaultHeight
}

export function truncateText(text: string, maxLength: number): string {
  if (maxLength <= 0) return ''
  if (text.length <= maxLength) return text
  if (maxLength < 3) return '.'.repeat(maxLength)
  return text.slice(0, Math.max(0, maxLength - 3)) + '...'
}
