import type { MetadataRoute } from 'next'

import { catalog, populatedCategories } from '../lib/catalog'
import { absoluteUrl, pathFor, routes } from '../lib/seo/urls'

export const dynamic = 'force-static'

// why: fully data-derived so adding skills, categories or agents never needs a sitemap edit.
// invariant: lastModified is emitted only where a real timestamp exists — stamping new Date()
// on static routes marks them changed on every build and trains crawlers to discount the signal.
export default function sitemap(): MetadataRoute.Sitemap {
  const newestSkillChange = catalog.skills
    .map((skill) => skill.metadata.lastModified)
    .sort()
    .at(-1)

  return [
    { url: absoluteUrl(routes.home()), lastModified: newestSkillChange, changeFrequency: 'daily', priority: 1.0 },
    { url: absoluteUrl(routes.skills()), lastModified: newestSkillChange, changeFrequency: 'daily', priority: 0.9 },
    {
      url: absoluteUrl(routes.categories()),
      lastModified: newestSkillChange,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    { url: absoluteUrl(routes.agents()), changeFrequency: 'monthly', priority: 0.8 },
    { url: absoluteUrl(routes.about()), changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl(pathFor(['tlc-spec-driven'])), changeFrequency: 'weekly', priority: 0.9 },
    ...populatedCategories().map((category) => ({
      url: absoluteUrl(routes.category(category.id)),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...catalog.agents.map((agent) => ({
      url: absoluteUrl(routes.agent(agent.id)),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...catalog.skills.map((skill) => ({
      url: absoluteUrl(routes.skill(skill.id)),
      lastModified: skill.metadata.lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ]
}
