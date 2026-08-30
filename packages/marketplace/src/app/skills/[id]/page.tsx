import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { Breadcrumbs } from '../../../components/Breadcrumbs'
import { CategoryBadge } from '../../../components/CategoryBadge'
import { CopyButton } from '../../../components/CopyButton'
import { JsonLd } from '../../../components/JsonLd'
import { SafeMarkdownAnchor } from '../../../components/SafeMarkdownAnchor'
import { ShareButton } from '../../../components/ShareButton'
import { SkillEntitySummary } from '../../../components/SkillEntitySummary'
import { SkillListItem } from '../../../components/SkillListItem'
import { allSkills, findCategory, findSkill, installCommand, relatedSkills } from '../../../lib/catalog'
import { demoteFirstMarkdownH1 } from '../../../lib/demote-markdown-h1'
import { buildPageMetadata } from '../../../lib/seo/metadata'
import { breadcrumbSchema, graph, organizationSchema, skillSchema } from '../../../lib/seo/schema'
import { parseSkillDescription } from '../../../lib/seo/skill-description'
import { routes } from '../../../lib/seo/urls'

export function generateStaticParams() {
  return allSkills().map((skill) => ({ id: skill.id }))
}

function crumbsFor(skill: { id: string; name: string }, categoryName: string, categoryId: string) {
  return [
    { name: 'Home', path: routes.home() },
    { name: 'Skills', path: routes.skills() },
    { name: categoryName, path: routes.category(categoryId) },
    { name: skill.name, path: routes.skill(skill.id) },
  ]
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const skill = findSkill(id)

  if (!skill) {
    return {}
  }

  const category = findCategory(skill.category)
  const { summary } = parseSkillDescription(skill.description)

  return buildPageMetadata({
    title: `${skill.name} — ${category?.name ?? skill.category} Skill for AI Coding Agents`,
    description: summary,
    path: routes.skill(skill.id),
    ogType: 'article',
    keywords: [
      `${skill.name} skill`,
      `${skill.name} AI agent`,
      `${category?.name ?? skill.category} AI agent skills`,
      'AI coding agent skill',
    ],
  })
}

export default async function SkillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const skill = findSkill(id)

  if (!skill) {
    notFound()
  }

  const category = findCategory(skill.category)
  const categoryName = category?.name ?? skill.category
  const command = installCommand(skill.id)
  const related = relatedSkills(skill)
  const crumbs = crumbsFor(skill, categoryName, skill.category)

  return (
    <>
      <JsonLd data={graph([organizationSchema(), skillSchema(skill, category), breadcrumbSchema(crumbs)])} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumbs crumbs={crumbs} />

        <div className="flex flex-col lg:flex-row gap-10 items-stretch lg:items-start">
          {/* Main Content */}
          <div className="flex-1 min-w-0 overflow-hidden">
            {/* Title section */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-2xl sm:text-[28px] font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                  {skill.name}
                </h1>
                <CategoryBadge categoryId={skill.category} categoryName={categoryName} />
              </div>
              <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">{skill.description}</p>

              {/* Install command */}
              <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-3.5 flex items-center justify-between mt-5">
                <code className="text-sm text-sky-400 font-mono truncate">{command}</code>
                <CopyButton
                  text={command}
                  className="!bg-white/10 !text-white !px-4 !py-1.5 !text-xs hover:!bg-white/20 shrink-0 ml-3"
                />
              </div>
            </div>

            <SkillEntitySummary name={skill.name} description={skill.description} />

            {/* Markdown content — demote body H1s so page chrome owns the sole H1 */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
              <div className="markdown-body">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{ a: SafeMarkdownAnchor }}
                >
                  {demoteFirstMarkdownH1(skill.content)}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-[280px] shrink-0 sticky top-20">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <h4 className="text-[11px] font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-5">
                Details
              </h4>

              <div className="flex flex-col gap-4 text-[13px]">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 dark:text-gray-500">Category</span>
                  <CategoryBadge categoryId={skill.category} categoryName={categoryName} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 dark:text-gray-500">Updated</span>
                  <span className="font-semibold text-gray-600 dark:text-gray-300">{skill.metadata.lastModified}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 dark:text-gray-500">Scripts</span>
                  <span className="font-semibold text-gray-600 dark:text-gray-300">
                    {skill.metadata.hasScripts ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 dark:text-gray-500">References</span>
                  <span className="font-semibold text-gray-600 dark:text-gray-300">
                    {skill.metadata.hasReferences ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              {skill.metadata.hasReferences && skill.metadata.referenceFiles.length > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-800 mt-5 pt-5">
                  <p className="text-[11px] font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-3">
                    Reference Files
                  </p>
                  <ul className="space-y-1.5">
                    {skill.metadata.referenceFiles.map((file) => (
                      <li key={file} className="flex items-center gap-2">
                        <svg
                          className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <code className="text-xs bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">
                          {file}
                        </code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-gray-100 dark:border-gray-800 mt-5 pt-5 space-y-3">
                <Link
                  href={routes.category(skill.category)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-[13px] font-semibold"
                >
                  All {categoryName} skills
                </Link>
                <ShareButton skillId={skill.id} variant="full" />
                <a
                  href={`https://github.com/tech-leads-club/agent-skills/tree/main/packages/skills-catalog/${skill.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-[13px] font-semibold"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  View on GitHub
                </a>
              </div>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section aria-labelledby="related-skills" className="mt-14">
            <h2
              id="related-skills"
              className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-4"
            >
              Related {categoryName} skills
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((entry) => (
                <SkillListItem key={entry.id} skill={entry} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  )
}
