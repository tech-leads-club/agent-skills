import Link from 'next/link'
import type { Skill } from '../types'
import { CategoryBadge } from './CategoryBadge'
import { CopyButton } from './CopyButton'
import { ShareButton } from './ShareButton'

interface SkillCardProps {
  skill: Skill
  categoryName: string
}

export function SkillCard({ skill, categoryName }: SkillCardProps) {
  const installCommand = `npx @tech-leads-club/agent-skills install --skill ${skill.id}`

  return (
    <div className="skill-card-hover bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          <Link href={`/skills/${skill.id}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {skill.name}
          </Link>
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <ShareButton skillId={skill.id} variant="icon" />
          <CategoryBadge categoryId={skill.category} categoryName={categoryName} />
        </div>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">{skill.description}</p>

      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-auto">
        {skill.metadata.hasScripts && (
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5.854 4.854a.5.5 0 10-.708-.708l-3.5 3.5a.5.5 0 000 .708l3.5 3.5a.5.5 0 00.708-.708L2.707 8l3.147-3.146zm4.292 0a.5.5 0 01.708-.708l3.5 3.5a.5.5 0 010 .708l-3.5 3.5a.5.5 0 01-.708-.708L13.293 8l-3.147-3.146z" />
            </svg>
            Scripts
          </span>
        )}
        {skill.metadata.hasReferences && (
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.715 6.542L3.343 7.914a3 3 0 104.243 4.243l1.828-1.829A3 3 0 008.586 5.5L8 6.086a1.002 1.002 0 00-.154.199 2 2 0 01.861 3.337L6.88 11.45a2 2 0 11-2.83-2.83l.793-.792a4.018 4.018 0 01-.128-1.287z" />
              <path d="M6.586 4.672A3 3 0 007.414 9.5l.775-.776a2 2 0 01-.896-3.346L9.12 3.55a2 2 0 112.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 10-4.243-4.243L6.586 4.672z" />
            </svg>
            References
          </span>
        )}
        <span>{skill.metadata.lastModified}</span>
      </div>

      {/* Install command */}
      <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-2.5 flex items-center justify-between gap-2">
        <code className="text-xs text-sky-400 font-mono truncate">npx agent-skills install --skill {skill.id}</code>
        <CopyButton
          text={installCommand}
          className="!bg-white/10 !text-white !px-3 !py-1 !text-xs hover:!bg-white/20"
        />
      </div>

      <div className="flex justify-end">
        <Link
          href={`/skills/${skill.id}`}
          className="text-[13px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
        >
          View Details
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.646 1.646a.5.5 0 01.708 0l6 6a.5.5 0 010 .708l-6 6a.5.5 0 01-.708-.708L10.293 8 4.646 2.354a.5.5 0 010-.708z"
            />
          </svg>
        </Link>
      </div>
    </div>
  )
}
