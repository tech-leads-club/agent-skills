import { Breadcrumbs } from '../../components/Breadcrumbs'
import { JsonLd } from '../../components/JsonLd'
import { SkillsCrawlIndex } from '../../components/SkillsCrawlIndex'
import marketplaceData from '../../data/skills.json'
import { populatedCategories } from '../../lib/catalog'
import { buildPageMetadata } from '../../lib/seo/metadata'
import { breadcrumbSchema, collectionPageSchema, graph, organizationSchema } from '../../lib/seo/schema'
import { routes } from '../../lib/seo/urls'
import { CONTENT_INDEX_LIMIT } from '../../lib/skills-search'
import { SkillsClient } from './SkillsClient'

const crumbs = [
  { name: 'Home', path: routes.home() },
  { name: 'Skills', path: routes.skills() },
]

// why: every prop of a client component is serialized into the page's RSC payload; full SKILL.md
// bodies made /skills/ ~1.5 MB, while search only ever reads the first CONTENT_INDEX_LIMIT chars.
const clientData = {
  ...marketplaceData,
  skills: marketplaceData.skills.map((skill) => ({ ...skill, content: skill.content.slice(0, CONTENT_INDEX_LIMIT) })),
}

export const metadata = buildPageMetadata({
  title: 'Browse All Skills',
  description: `Search all ${marketplaceData.stats.totalSkills} AI agent skills for Cursor, Claude Code, GitHub Copilot, Windsurf and Cline.`,
  path: routes.skills(),
})

export default function SkillsPage() {
  const categories = populatedCategories()

  return (
    <>
      <JsonLd
        data={graph([
          organizationSchema(),
          collectionPageSchema({
            name: 'All agent skills',
            description: `Every skill published in the Agent Skills registry — ${marketplaceData.stats.totalSkills} in total.`,
            path: routes.skills(),
            items: marketplaceData.skills.map((skill) => ({ name: skill.name, path: routes.skill(skill.id) })),
          }),
          breadcrumbSchema(crumbs),
        ])}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Breadcrumbs crumbs={crumbs} />
      </div>
      <SkillsClient data={clientData} />
      <SkillsCrawlIndex skills={marketplaceData.skills} categories={categories} />
    </>
  )
}
