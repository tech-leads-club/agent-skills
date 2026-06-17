import type { MetadataRoute } from 'next'
import marketplaceData from '../data/skills.json'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://agent-skills.techleads.club'

  const skillEntries: MetadataRoute.Sitemap = marketplaceData.skills.map((skill) => ({
    url: `${baseUrl}/skills/${skill.id}`,
    lastModified: skill.metadata.lastModified,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/skills`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...skillEntries,
  ]
}
