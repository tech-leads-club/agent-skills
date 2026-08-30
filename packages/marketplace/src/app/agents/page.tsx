import Link from 'next/link'

import { Breadcrumbs } from '../../components/Breadcrumbs'
import { JsonLd } from '../../components/JsonLd'
import { catalog } from '../../lib/catalog'
import { buildPageMetadata } from '../../lib/seo/metadata'
import { breadcrumbSchema, collectionPageSchema, graph, organizationSchema } from '../../lib/seo/schema'
import { routes } from '../../lib/seo/urls'

const crumbs = [
  { name: 'Home', path: routes.home() },
  { name: 'Agents', path: routes.agents() },
]

export const metadata = buildPageMetadata({
  title: 'Supported AI Coding Agents',
  description: `Install agent skills into ${catalog.stats.totalAgents} AI coding agents including Cursor, Claude Code, GitHub Copilot, Windsurf and Cline.`,
  path: routes.agents(),
})

export default function AgentsPage() {
  return (
    <>
      <JsonLd
        data={graph([
          organizationSchema(),
          collectionPageSchema({
            name: 'Supported AI coding agents',
            description: `The ${catalog.stats.totalAgents} AI coding agents the Agent Skills installer can install skills into.`,
            path: routes.agents(),
            items: catalog.agents.map((agent) => ({ name: agent.name, path: routes.agent(agent.id) })),
          }),
          breadcrumbSchema(crumbs),
        ])}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumbs crumbs={crumbs} />

        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-4">
            Supported AI coding agents
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed max-w-3xl">
            Skills are plain Markdown instruction files, so the same skill works in every agent below. The installer
            handles the one thing that differs between them: where each agent reads its skills from. Pick your agent for
            the exact install command and paths.
          </p>
        </header>

        <ul className="grid gap-4 sm:grid-cols-2">
          {catalog.agents.map((agent) => (
            <li
              key={agent.id}
              className="border border-gray-100 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 p-5 shadow-sm"
            >
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1.5">
                <Link
                  href={routes.agent(agent.id)}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {agent.name}
                </Link>
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-3">{agent.description}</p>
              <p className="text-xs font-mono text-gray-400 dark:text-gray-500">{agent.skillsDir}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
