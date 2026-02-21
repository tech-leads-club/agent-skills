import type { Metadata } from 'next'
import { readFileSync } from 'fs'
import { join } from 'path'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import { JsonLd } from '../../components/JsonLd'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Learn about Agent Skills - a secure, validated skill registry for professional AI coding agents. Extend Cursor, Claude Code, GitHub Copilot, Windsurf, and more with confidence.',
  alternates: {
    canonical: '/about',
  },
}

const aboutPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'About Agent Skills',
  description:
    'Learn about Agent Skills - a secure, validated skill registry for professional AI coding agents. Extend Cursor, Claude Code, GitHub Copilot, Windsurf, and more with confidence.',
  url: 'https://agent-skills.techleads.club/about',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Agent Skills Marketplace',
    url: 'https://agent-skills.techleads.club',
  },
}

export default function AboutPage() {
  const readmePath = join(process.cwd(), '../../README.md')
  let readmeContent = readFileSync(readmePath, 'utf-8')

  const GITHUB_REPO_BASE = 'https://raw.githubusercontent.com/tech-leads-club/agent-skills/main'
  readmeContent = readmeContent.replace(/src="\.github\//g, `src="${GITHUB_REPO_BASE}/.github/`)

  return (
    <>
      <JsonLd data={aboutPageSchema} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="markdown-body about-readme">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight, rehypeRaw]}>
              {readmeContent}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </>
  )
}
