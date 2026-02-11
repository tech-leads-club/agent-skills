import type { Metadata } from 'next'
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
      <SkillsClient data={marketplaceData} />
    </>
  )
}
