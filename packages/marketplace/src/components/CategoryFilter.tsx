'use client'

import clsx from 'clsx'
import type { Category } from '../types'

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory: string | null
  onSelectCategory: (categoryId: string | null) => void
}

export function CategoryFilter({ categories, selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelectCategory(null)}
        className={clsx(
          'px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer',
          selectedCategory === null
            ? 'bg-blue-600 text-white'
            : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500',
        )}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className={clsx(
            'px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer',
            selectedCategory === category.id
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500',
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}
