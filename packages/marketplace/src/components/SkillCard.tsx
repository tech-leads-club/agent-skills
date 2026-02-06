import Link from 'next/link'
import type { Skill } from '../types'
import { CopyButton } from './CopyButton'

interface SkillCardProps {
  skill: Skill
  categoryName: string
}

export function SkillCard({ skill, categoryName }: SkillCardProps) {
  const installCommand = `npx @tech-leads-club/agent-skills --skill ${skill.id}`

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-start justify-between mb-3">
        <Link
          href={`/skills/${skill.id}`}
          className="text-xl font-bold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {skill.name}
        </Link>
        <span className="px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-full">{categoryName}</span>
      </div>

      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">{skill.description}</p>

      <div className="flex items-center gap-3 mb-4 text-xs text-gray-500 dark:text-gray-500">
        {skill.metadata.hasScripts && (
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 7H7v6h6V7z" />
              <path
                fillRule="evenodd"
                d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"
                clipRule="evenodd"
              />
            </svg>
            Scripts
          </span>
        )}
        {skill.metadata.hasReferences && (
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
            References
          </span>
        )}
        <span>{skill.metadata.lastModified}</span>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 flex items-center justify-between">
        <code className="text-xs text-gray-700 dark:text-gray-300 flex-1 overflow-x-auto">{installCommand}</code>
        <CopyButton text={installCommand} />
      </div>
    </div>
  )
}
