import type { Metadata } from 'next'
import { Suspense } from 'react'
import { JsonLd } from '../../components/JsonLd'
import marketplaceData from '../../data/skills.json'
import { SkillsClient } from './SkillsClient'

export const metadata: Metadata = {
  title: 'Browse All Skills',
  description:
    'Browse and search all available AI agent skills. Filter by category and discover skills for Cursor, Claude Code, GitHub Copilot, Windsurf, and other AI coding agents.',
  alternates: {
    canonical: '/skills',
  },
}

const collectionPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Browse All Agent Skills',
  description:
    'Browse and search all available AI agent skills. Filter by category and discover skills for Cursor, Claude Code, GitHub Copilot, Windsurf, and other AI coding agents.',
  url: 'https://agent-skills.techleads.club/skills',
  numberOfItems: marketplaceData.stats.totalSkills,
  isPartOf: {
    '@type': 'WebSite',
    name: 'Agent Skills Marketplace',
    url: 'https://agent-skills.techleads.club',
  },
}

export default function SkillsPage() {
  return (
    <>
      <JsonLd data={collectionPageSchema} />
      <Suspense
        fallback={
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Browse Skills</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Loading skills...</p>
            </div>
          </div>
        }
      >
        <SkillsClient data={marketplaceData} />
      </Suspense>
    </>
  )
}
