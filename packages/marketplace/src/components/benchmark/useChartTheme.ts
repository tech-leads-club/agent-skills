'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export interface ChartTheme {
  grid: string
  axis: string
  /** High-contrast color for axis titles / data labels (WCAG-friendly) */
  label: string
  tooltipBg: string
  tooltipBorder: string
  tooltipText: string
  /** Flagship (TLC) bar/point color */
  highlight: string
  /** Muted color for the other frameworks */
  muted: string
}

const LIGHT: ChartTheme = {
  grid: '#d1d5db',
  axis: '#4b5563',
  label: '#1f2937',
  tooltipBg: '#ffffff',
  tooltipBorder: '#d1d5db',
  tooltipText: '#111827',
  highlight: '#2563eb',
  muted: '#94a3b8',
}

const DARK: ChartTheme = {
  grid: '#374151',
  axis: '#cbd5e1',
  label: '#f3f4f6',
  tooltipBg: '#0b1220',
  tooltipBorder: '#475569',
  tooltipText: '#f9fafb',
  highlight: '#60a5fa',
  muted: '#64748b',
}

/**
 * Returns palette for recharts that follows the active theme.
 * Guards against hydration mismatch by defaulting to light until mounted.
 */
export function useChartTheme(): ChartTheme {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return LIGHT
  return resolvedTheme === 'dark' ? DARK : LIGHT
}
