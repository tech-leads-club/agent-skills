import { JsonLd } from '../../components/JsonLd'
import { DevFlowCTA } from '../../components/dev-flow/DevFlowCTA'
import { DevFlowHero } from '../../components/dev-flow/DevFlowHero'
import { DevFlowPosition } from '../../components/dev-flow/DevFlowPosition'
import { DevFlowQuality } from '../../components/dev-flow/DevFlowQuality'
import { DevFlowSkills } from '../../components/dev-flow/DevFlowSkills'
import { DevFlowStages } from '../../components/dev-flow/DevFlowStages'
import { DevFlowValueProps } from '../../components/dev-flow/DevFlowValueProps'
import { FLOW_SKILLS } from '../../components/dev-flow/constants'
import { buildPageMetadata } from '../../lib/seo/metadata'
import { breadcrumbSchema, collectionPageSchema, graph, organizationSchema, websiteSchema } from '../../lib/seo/schema'
import { routes } from '../../lib/seo/urls'

const PAGE_TITLE = 'TLC AI Dev Flow — Skills for Agentic Software Factories'
const PAGE_DESCRIPTION =
  'Agentic software factory skills for AI coding agents: discover, plan, implement, then evidence-first PR review. Humans stay at the ends.'

export const metadata = buildPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: routes.aiDevFlow(),
  ogImage: '/og-tlc-ai-dev-flow.png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  keywords: [
    'agentic software factory',
    'AI dev flow',
    'PR review',
    'tlc-discover',
    'tlc-plan',
    'tlc-implement',
    'the-judge',
    'AI coding agents',
  ],
})

export default function TLCAiDevFlowLandingPage() {
  return (
    <>
      <JsonLd
        data={graph([
          organizationSchema(),
          websiteSchema(),
          collectionPageSchema({
            name: PAGE_TITLE,
            description: PAGE_DESCRIPTION,
            path: routes.aiDevFlow(),
            items: FLOW_SKILLS.map((skill) => ({
              name: `${skill.id} — ${skill.title}`,
              path: routes.skill(skill.id),
            })),
          }),
          breadcrumbSchema([
            { name: 'Home', path: routes.home() },
            { name: 'AI Dev Flow', path: routes.aiDevFlow() },
          ]),
        ])}
      />
      <DevFlowHero />
      <DevFlowValueProps />
      <DevFlowStages />
      <DevFlowSkills />
      <DevFlowQuality />
      <DevFlowPosition />
      <DevFlowCTA />
    </>
  )
}
