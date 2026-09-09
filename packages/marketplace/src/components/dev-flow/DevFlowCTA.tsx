'use client'

import Link from 'next/link'
import { CopyButton } from '../CopyButton'
import { FLOW_SKILLS, INSTALL_CMD } from './constants'

export function DevFlowCTA() {
  return (
    <section className="bg-gray-50 dark:bg-gray-900/50 py-16 sm:py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-3">
          Start the factory with the core loop
        </h2>
        <p className="text-[15px] text-gray-500 dark:text-gray-400 mb-8">
          Four skills, one command, works with your agent today.
        </p>

        <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 shadow-md">
          <code className="text-left text-sm text-sky-400 font-mono overflow-x-auto whitespace-nowrap">
            {INSTALL_CMD}
          </code>
          <CopyButton
            text={INSTALL_CMD}
            className="!bg-white/10 !text-white !px-4 !py-1.5 !text-xs hover:!bg-white/20 shrink-0"
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
          {FLOW_SKILLS.map((skill) => (
            <Link
              key={skill.id}
              href={`/skills/${skill.id}`}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
            >
              {skill.id}
            </Link>
          ))}
          <span className="text-gray-300 dark:text-gray-700">·</span>
          <Link
            href="/skills"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
          >
            Browse all skills
          </Link>
        </div>
      </div>
    </section>
  )
}
