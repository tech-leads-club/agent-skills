'use client'

import Link from 'next/link'
import { CopyButton } from '../CopyButton'

const INSTALL_CMD = 'npx @tech-leads-club/agent-skills install --skill tlc-spec-driven'

export function LPFinalCTA() {
  return (
    <section className="bg-gray-50 dark:bg-gray-900/50 py-16 sm:py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-3">
          Ready to ship right?
        </h2>
        <p className="text-[15px] text-gray-500 dark:text-gray-400 mb-8">
          One command. Works with your agent today.
        </p>

        <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-4 flex items-center justify-between gap-3 mb-6 shadow-md">
          <code className="text-sm text-sky-400 font-mono truncate">{INSTALL_CMD}</code>
          <CopyButton
            text={INSTALL_CMD}
            className="!bg-white/10 !text-white !px-4 !py-1.5 !text-xs hover:!bg-white/20 shrink-0"
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <a
            href="https://github.com/tech-leads-club/agent-skills"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            GitHub
          </a>
          <span className="text-gray-300 dark:text-gray-700">·</span>
          <Link
            href="/skills/tlc-spec-driven"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
          >
            View skill details →
          </Link>
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
