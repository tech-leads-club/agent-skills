'use client'

import Link from 'next/link'
import { routes } from '../../lib/seo/urls'
import { CopyButton } from '../CopyButton'
import { CLAUDE_CODE_CMD } from './constants'

export function McpCTA() {
  return (
    <section className="bg-gray-50 dark:bg-gray-900/50 py-16 sm:py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-3">
          One server. The whole catalog.
        </h2>
        <p className="text-[15px] text-gray-500 dark:text-gray-400 mb-8">
          Add it once and stop deciding in advance which skills you will need.
        </p>

        <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 shadow-md">
          <code className="text-left text-sm text-sky-400 font-mono overflow-x-auto whitespace-nowrap">
            {CLAUDE_CODE_CMD}
          </code>
          <CopyButton
            text={CLAUDE_CODE_CMD}
            className="!bg-white/10 !text-white !px-4 !py-1.5 !text-xs hover:!bg-white/20 shrink-0"
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
          <Link
            href={routes.skills()}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
          >
            Browse all skills
          </Link>
          <span className="text-gray-300 dark:text-gray-700">·</span>
          <Link
            href={routes.aiDevFlow()}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
          >
            AI Dev Flow
          </Link>
          <span className="text-gray-300 dark:text-gray-700">·</span>
          <a
            href="https://github.com/tech-leads-club/agent-skills/tree/main/packages/mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
          >
            Source on GitHub
          </a>
          <span className="text-gray-300 dark:text-gray-700">·</span>
          <a
            href="https://www.npmjs.com/package/@tech-leads-club/agent-skills-mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
          >
            npm
          </a>
        </div>
      </div>
    </section>
  )
}
