import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { CategoryBadge } from '../../../components/CategoryBadge'
import { CopyButton } from '../../../components/CopyButton'
import { JsonLd } from '../../../components/JsonLd'
import { ShareButton } from '../../../components/ShareButton'
import marketplaceData from '../../../data/skills.json'

export function generateStaticParams() {
  return marketplaceData.skills.map((skill) => ({
    id: skill.id,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const skill = marketplaceData.skills.find((s) => s.id === id)

  if (!skill) {
    return {}
  }

  const category = marketplaceData.categories.find((c) => c.id === skill.category)

  return {
    title: skill.name,
    description: skill.description,
    alternates: {
      canonical: `/skills/${skill.id}`,
    },
    openGraph: {
      title: `${skill.name} - Agent Skill | Tech Leads Club`,
      description: skill.description,
      type: 'article',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: skill.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${skill.name} - Agent Skill | Tech Leads Club`,
      description: skill.description,
    },
    keywords: [skill.name, skill.category, category?.name || '', 'AI agent skill', 'coding agent', 'agent automation'],
  }
}

export default async function SkillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const skill = marketplaceData.skills.find((s) => s.id === id)

  if (!skill) {
    notFound()
  }

  const category = marketplaceData.categories.find((c) => c.id === skill.category)
  const installCommand = `npx @tech-leads-club/agent-skills install --skill ${skill.id}`

  const softwareSourceCodeSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: skill.name,
    description: skill.description,
    url: `https://agent-skills.techleads.club/skills/${skill.id}`,
    codeRepository: `https://github.com/tech-leads-club/agent-skills/tree/main/packages/skills-catalog/${skill.path}`,
    programmingLanguage: 'Markdown',
    runtimePlatform: 'AI Coding Agents',
    applicationCategory: category?.name || skill.category,
    author: {
      '@type': 'Organization',
      name: 'Tech Leads Club',
      url: 'https://github.com/tech-leads-club',
    },
    dateModified: skill.metadata.lastModified,
    keywords: [skill.name, skill.category, 'AI agent skill', 'coding automation'],
  }

  return (
    <>
      <JsonLd data={softwareSourceCodeSchema} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[13px] text-gray-400 dark:text-gray-500 mb-6">
          <Link href="/" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            Home
          </Link>
          <span>›</span>
          <Link href="/skills/" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            Skills
          </Link>
          <span>›</span>
          <span className="text-gray-600 dark:text-gray-300 font-medium">{skill.name}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-stretch lg:items-start">
          {/* Main Content */}
          <div className="flex-1 min-w-0 overflow-hidden">
            {/* Title section */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-2xl sm:text-[28px] font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                  {skill.name}
                </h1>
                <CategoryBadge categoryId={skill.category} categoryName={category?.name || skill.category} />
              </div>
              <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">{skill.description}</p>

              {/* Install command */}
              <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-3.5 flex items-center justify-between mt-5">
                <code className="text-sm text-sky-400 font-mono truncate">{installCommand}</code>
                <CopyButton
                  text={installCommand}
                  className="!bg-white/10 !text-white !px-4 !py-1.5 !text-xs hover:!bg-white/20 shrink-0 ml-3"
                />
              </div>
            </div>

            {/* Markdown content */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {skill.content}
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
                  <CategoryBadge categoryId={skill.category} categoryName={category?.name || skill.category} />
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
      </div>
    </>
  )
}
