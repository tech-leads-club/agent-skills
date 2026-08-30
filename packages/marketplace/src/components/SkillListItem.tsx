import Link from 'next/link'

import { parseSkillDescription } from '../lib/seo/skill-description'
import { routes } from '../lib/seo/urls'
import type { Skill } from '../types'
import { CategoryBadge } from './CategoryBadge'

interface SkillListItemProps {
  skill: Skill
  categoryName?: string
  showCategory?: boolean
}

/**
 * Server-rendered skill entry used by every hub page, so the skill name, summary and link are
 * in the static HTML rather than behind the client-side filter on /skills/.
 */
export function SkillListItem({ skill, categoryName, showCategory = false }: SkillListItemProps) {
  const { summary } = parseSkillDescription(skill.description)

  return (
    <li className="border border-gray-100 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
          <Link
            href={routes.skill(skill.id)}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {skill.name}
          </Link>
        </h3>
        {showCategory && categoryName ? (
          <CategoryBadge categoryId={skill.category} categoryName={categoryName} />
        ) : null}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{summary}.</p>
    </li>
  )
}
