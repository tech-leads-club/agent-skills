import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Breadcrumbs } from '../../../components/Breadcrumbs'
import { CopyButton } from '../../../components/CopyButton'
import { JsonLd } from '../../../components/JsonLd'
import { catalog, findAgent, installCommand, populatedCategories } from '../../../lib/catalog'
import { buildPageMetadata } from '../../../lib/seo/metadata'
import { breadcrumbSchema, graph, organizationSchema } from '../../../lib/seo/schema'
import { absoluteUrl, routes } from '../../../lib/seo/urls'

export function generateStaticParams() {
  return catalog.agents.map((agent) => ({ agent: agent.id }))
}

function crumbsFor(name: string, id: string) {
  return [
    { name: 'Home', path: routes.home() },
    { name: 'Agents', path: routes.agents() },
    { name: name, path: routes.agent(id) },
  ]
}

export async function generateMetadata({ params }: { params: Promise<{ agent: string }> }): Promise<Metadata> {
  const { agent: agentId } = await params
  const agent = findAgent(agentId)
  if (!agent) return {}

  return buildPageMetadata({
    title: `${agent.name} — Install AI Agent Skills`,
    description: `Install any of ${catalog.stats.totalSkills} agent skills into ${agent.name}. Skills land in ${agent.skillsDir} for a project or ${agent.globalSkillsDir} globally.`,
    path: routes.agent(agentId),
    keywords: [`${agent.name} skills`, `${agent.name} agent skills`, 'AI coding agent skills'],
  })
}

export default async function AgentPage({ params }: { params: Promise<{ agent: string }> }) {
  const { agent: agentId } = await params
  const agent = findAgent(agentId)

  if (!agent) {
    notFound()
  }

  const projectCommand = `npx @tech-leads-club/agent-skills install --agent ${agent.id}`
  const globalCommand = `${projectCommand} --global`
  const exampleSkill = catalog.skills.find((skill) => skill.id === 'tlc-spec-driven') ?? catalog.skills[0]
  const categories = populatedCategories()

  return (
    <>
      <JsonLd
        data={graph([
          organizationSchema(),
          {
            '@type': 'HowTo',
            name: `Install agent skills in ${agent.name}`,
            description: `Install skills from the Agent Skills registry into ${agent.name}.`,
            url: absoluteUrl(routes.agent(agentId)),
            tool: [{ '@type': 'HowToTool', name: '@tech-leads-club/agent-skills CLI' }],
            step: [
              {
                '@type': 'HowToStep',
                name: 'Run the installer',
                text: `Run ${projectCommand} in your project root.`,
              },
              {
                '@type': 'HowToStep',
                name: 'Verify the install location',
                text: `Skills are written to ${agent.skillsDir} in the project, or ${agent.globalSkillsDir} with --global.`,
              },
            ],
          },
          breadcrumbSchema(crumbsFor(agent.name, agentId)),
        ])}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumbs crumbs={crumbsFor(agent.name, agentId)} />

        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-4">
            Agent skills for {agent.name}
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed max-w-3xl">
            {agent.name} — {agent.description}. All {catalog.stats.totalSkills} skills in this registry are plain
            Markdown instruction files, so every one of them works with {agent.name}; the installer only needs to know
            where {agent.name} reads its skills from.
          </p>
        </header>

        <section aria-labelledby="install-heading" className="mb-12">
          <h2 id="install-heading" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            How to install skills in {agent.name}
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Install into the current project:</p>
          <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-3.5 flex items-center justify-between mb-5">
            <code className="text-sm text-sky-400 font-mono truncate">{projectCommand}</code>
            <CopyButton
              text={projectCommand}
              className="!bg-white/10 !text-white !px-4 !py-1.5 !text-xs hover:!bg-white/20 shrink-0 ml-3"
            />
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Install for every project on this machine:</p>
          <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-3.5 flex items-center justify-between mb-5">
            <code className="text-sm text-sky-400 font-mono truncate">{globalCommand}</code>
            <CopyButton
              text={globalCommand}
              className="!bg-white/10 !text-white !px-4 !py-1.5 !text-xs hover:!bg-white/20 shrink-0 ml-3"
            />
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Install one specific skill:</p>
          <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-3.5 flex items-center justify-between">
            <code className="text-sm text-sky-400 font-mono truncate">{installCommand(exampleSkill.id, agent.id)}</code>
            <CopyButton
              text={installCommand(exampleSkill.id, agent.id)}
              className="!bg-white/10 !text-white !px-4 !py-1.5 !text-xs hover:!bg-white/20 shrink-0 ml-3"
            />
          </div>
        </section>

        <section aria-labelledby="paths-heading" className="mb-12">
          <h2 id="paths-heading" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Where {agent.name} stores skills
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
              <tbody>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th scope="row" className="text-left font-semibold p-3 bg-gray-50 dark:bg-gray-900 w-56">
                    Project install path
                  </th>
                  <td className="p-3 font-mono text-gray-600 dark:text-gray-300">{agent.skillsDir}</td>
                </tr>
                <tr>
                  <th scope="row" className="text-left font-semibold p-3 bg-gray-50 dark:bg-gray-900">
                    Global install path
                  </th>
                  <td className="p-3 font-mono text-gray-600 dark:text-gray-300">{agent.globalSkillsDir}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="browse-heading" className="mb-12">
          <h2 id="browse-heading" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            What you can install
          </h2>
          <ul className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={routes.category(category.id)}
                  className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {category.name}
                  <span className="text-gray-400 dark:text-gray-500">{category.skillCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="others-heading">
          <h2 id="others-heading" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Other supported agents
          </h2>
          <ul className="flex flex-wrap gap-2">
            {catalog.agents
              .filter((entry) => entry.id !== agent.id)
              .map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={routes.agent(entry.id)}
                    className="inline-flex text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {entry.name}
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      </div>
    </>
  )
}
