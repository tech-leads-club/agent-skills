export const colors = {
  primary: '#3b82f6',
  primaryLight: '#60a5fa',
  primaryDark: '#1e3a8a',
  accent: '#06b6d4',
  accentLight: '#22d3ee',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  text: '#f8fafc',
  textDim: '#94a3b8',
  textMuted: '#64748b',
  border: '#334155',
  bg: '#0f172a',
  bgLight: '#1e293b',
} as const

export const gradientStops = [
  { color: '#1e3a8a', pos: 0 },
  { color: '#3b82f6', pos: 0.3 },
  { color: '#0ea5e9', pos: 0.5 },
  { color: '#06b6d4', pos: 0.7 },
  { color: '#22d3ee', pos: 1 },
] as const
