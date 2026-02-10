export const TERMINAL_DEFAULTS = {
  WIDTH: 80,
  HEIGHT: 20,
}

export function getTerminalWidth(defaultWidth = TERMINAL_DEFAULTS.WIDTH): number {
  return process.stdout.columns ?? defaultWidth
}

export function getTerminalHeight(defaultHeight = TERMINAL_DEFAULTS.HEIGHT): number {
  return process.stdout.rows ?? defaultHeight
}

export function truncateText(text: string, maxWidth: number): string {
  if (text.length <= maxWidth) return text
  return text.slice(0, Math.max(0, maxWidth - 3)) + '...'
}
