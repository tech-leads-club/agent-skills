import clsx from 'clsx'

const CATEGORY_STYLES: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  architecture: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    darkBg: 'dark:bg-indigo-900/30',
    darkText: 'dark:text-indigo-300',
  },
  'cloud-infrastructure': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    darkBg: 'dark:bg-emerald-900/30',
    darkText: 'dark:text-emerald-300',
  },
  'skill-agent-creation': {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    darkBg: 'dark:bg-orange-900/30',
    darkText: 'dark:text-orange-300',
  },
  'decision-making': {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    darkBg: 'dark:bg-purple-900/30',
    darkText: 'dark:text-purple-300',
  },
  design: { bg: 'bg-rose-50', text: 'text-rose-700', darkBg: 'dark:bg-rose-900/30', darkText: 'dark:text-rose-300' },
  'go-to-market': {
    bg: 'bg-green-50',
    text: 'text-green-700',
    darkBg: 'dark:bg-green-900/30',
    darkText: 'dark:text-green-300',
  },
  development: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    darkBg: 'dark:bg-blue-900/30',
    darkText: 'dark:text-blue-300',
  },
  monitoring: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    darkBg: 'dark:bg-amber-900/30',
    darkText: 'dark:text-amber-300',
  },
  performance: {
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    darkBg: 'dark:bg-pink-900/30',
    darkText: 'dark:text-pink-300',
  },
  quality: { bg: 'bg-teal-50', text: 'text-teal-700', darkBg: 'dark:bg-teal-900/30', darkText: 'dark:text-teal-300' },
  security: { bg: 'bg-red-50', text: 'text-red-700', darkBg: 'dark:bg-red-900/30', darkText: 'dark:text-red-300' },
  tooling: {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    darkBg: 'dark:bg-violet-900/30',
    darkText: 'dark:text-violet-300',
  },
  'web-automation': {
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    darkBg: 'dark:bg-cyan-900/30',
    darkText: 'dark:text-cyan-300',
  },
  'learning-growth': {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    darkBg: 'dark:bg-yellow-900/30',
    darkText: 'dark:text-yellow-300',
  },
}

const DEFAULT_STYLE = {
  bg: 'bg-gray-100',
  text: 'text-gray-600',
  darkBg: 'dark:bg-gray-800',
  darkText: 'dark:text-gray-300',
}

interface CategoryBadgeProps {
  categoryId: string
  categoryName: string
  className?: string
}

export function CategoryBadge({ categoryId, categoryName, className }: CategoryBadgeProps) {
  const style = CATEGORY_STYLES[categoryId] || DEFAULT_STYLE
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide',
        style.bg,
        style.text,
        style.darkBg,
        style.darkText,
        className,
      )}
    >
      {categoryName}
    </span>
  )
}
