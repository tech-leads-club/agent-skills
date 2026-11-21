import Link from 'next/link'

import { installCommand } from '../lib/catalog'
import { routes } from '../lib/seo/urls'
import type { AgentTarget } from '../types'
import { CopyButton } from './CopyButton'

/**
 * why: the install paths come from the CLI's own agent catalog, so this shows exactly where the
 * installer puts the skill for each agent — something the bare SKILL.md mirrors cannot tell.
 */
export function SkillAgentInstall({
  skillId,
  agents,
  totalAgents,
}: {
  skillId: string
  agents: AgentTarget[]
  totalAgents: number
}) {
  if (agents.length === 0) return null

  return (
    <section
      aria-labelledby="skill-install"
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm mb-6"
    >
      <h2 id="skill-install" className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
        Install it for your agent
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        The command copies the skill folder into the agent&apos;s skills directory in your project.{' '}
        <Link href={routes.agents()} className="text-blue-600 dark:text-blue-400 hover:underline">
          All {totalAgents} supported agents
        </Link>
      </p>
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {agents.map((agent) => {
          const command = installCommand(skillId, agent.id)
          return (
            <li key={agent.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
                <Link
                  href={routes.agent(agent.id)}
                  className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:underline"
                >
                  {agent.name}
                </Link>
                <code className="text-xs text-gray-500 dark:text-gray-400 break-all">
                  {agent.skillsDir}/{skillId}/
                </code>
              </div>
              <div className="bg-slate-900 dark:bg-slate-950 rounded-lg px-3 py-2 flex items-center justify-between gap-3">
                <code className="text-xs text-sky-400 font-mono truncate">{command}</code>
                <CopyButton
                  text={command}
                  className="!bg-white/10 !text-white !px-3 !py-1 !text-xs hover:!bg-white/20 shrink-0"
                />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
