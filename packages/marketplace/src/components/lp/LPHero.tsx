'use client'

import Link from 'next/link'
import { CopyButton } from '../CopyButton'

const INSTALL_CMD = 'npx @tech-leads-club/agent-skills install --skill tlc-spec-driven'

export function LPHero() {
  return (
    <section className="relative overflow-hidden bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-full px-4 py-1.5 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-wide">
            Spec-Driven Development · Agent Skill
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-gray-900 dark:text-gray-50 tracking-tight leading-[1.1] mb-5">
          Spec-driven development
          <br className="hidden sm:block" /> that actually works.
        </h1>

        <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto mb-10">
          4 adaptive phases that auto-size to complexity. Atomic tasks with verification criteria. Requirement
          traceability from spec to commit. Works with any stack and any agent.
        </p>

        <div className="max-w-xl mx-auto">
          <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-4 flex items-center justify-between gap-3 mb-4 shadow-md">
            <code className="text-sm text-sky-400 font-mono truncate">{INSTALL_CMD}</code>
            <CopyButton
              text={INSTALL_CMD}
              className="!bg-white/10 !text-white !px-4 !py-1.5 !text-xs hover:!bg-white/20 shrink-0"
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Works with Cursor, Claude Code, Copilot, Windsurf, Cline and{' '}
            <Link href="/skills" className="underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-300">
              14 others
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  )
}
