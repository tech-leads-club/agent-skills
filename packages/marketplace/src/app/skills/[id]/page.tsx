import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { CopyButton } from '../../../components/CopyButton'
import { JsonLd } from '../../../components/JsonLd'
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
      title: `${skill.name} - Agent Skill`,
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
      title: `${skill.name} - Agent Skill`,
      description: skill.description,
    },
    keywords: [
      skill.name,
      skill.category,
      category?.name || '',
      'AI agent skill',
      'coding agent',
      'agent automation',
    ],
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back link */}
      <Link
        href="/skills/"
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Skills
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-full">
                {category?.name || skill.category}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{skill.metadata.lastModified}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">{skill.name}</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">{skill.description}</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {skill.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 p-6 sticky top-6">
            {/* Installation Section */}
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Installation</h2>
            <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 mb-4">
              <code className="text-sm text-green-400 break-all font-mono">{installCommand}</code>
            </div>
            <CopyButton text={installCommand} className="w-full mb-6" />

            {/* Skill Info */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
              {(skill.metadata.hasScripts || skill.metadata.hasReferences) && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Includes</p>
                  <div className="flex flex-wrap gap-2">
                    {skill.metadata.hasScripts && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 rounded">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Scripts
                      </span>
                    )}
                    {skill.metadata.hasReferences && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                        </svg>
                        References
                      </span>
                    )}
                  </div>
                </div>
              )}

              {skill.metadata.hasReferences && skill.metadata.referenceFiles.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Reference Files</p>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    {skill.metadata.referenceFiles.map((file) => (
                      <li key={file} className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-gray-400 dark:text-gray-500"
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
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{file}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* GitHub Link */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <a
                href={`https://github.com/tech-leads-club/agent-skills/tree/main/packages/skills-catalog/${skill.path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
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
        </div>
      </div>
    </div>
    </>
  )
}
