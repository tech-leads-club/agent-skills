import Link from 'next/link'

import { routes } from '../lib/seo/urls'
import type { Category, Skill } from '../types'

interface SkillsCrawlIndexProps {
  skills: Pick<Skill, 'id' | 'name'>[]
  categories?: Pick<Category, 'id' | 'name'>[]
}

/**
 * Server-rendered complete skill link set for crawlers (and no-JS users).
 * Remains outside the interactive filter client so filters never remove discovery links.
 */
export function SkillsCrawlIndex({ skills, categories = [] }: SkillsCrawlIndexProps) {
  if (skills.length === 0) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      {categories.length > 0 && (
        <nav aria-label="Skill categories" className="mb-10">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-4">
            Browse by category
          </h2>
          <ul className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={routes.category(category.id)}
                  className="inline-flex text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <nav aria-label="All skills">
        <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-4">
          All skills
        </h2>
        <ul className="columns-1 sm:columns-2 lg:columns-3 gap-x-8 text-sm space-y-1.5">
          {skills.map((skill) => (
            <li key={skill.id} className="break-inside-avoid">
              <Link
                href={routes.skill(skill.id)}
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {skill.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
