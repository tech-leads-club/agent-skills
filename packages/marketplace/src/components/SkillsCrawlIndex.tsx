import Link from 'next/link'

import type { Skill } from '../types'

interface SkillsCrawlIndexProps {
  skills: Pick<Skill, 'id' | 'name'>[]
}

/**
 * Server-rendered complete skill link set for crawlers (and no-JS users).
 * Remains outside the interactive filter client so filters never remove discovery links.
 */
export function SkillsCrawlIndex({ skills }: SkillsCrawlIndexProps) {
  if (skills.length === 0) {
    return null
  }

  return (
    <nav aria-label="All skills" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-4">
        All skills
      </h2>
      <ul className="columns-1 sm:columns-2 lg:columns-3 gap-x-8 text-sm space-y-1.5">
        {skills.map((skill) => (
          <li key={skill.id} className="break-inside-avoid">
            <Link
              href={`/skills/${skill.id}/`}
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {skill.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
