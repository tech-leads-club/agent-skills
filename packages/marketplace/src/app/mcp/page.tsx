import { JsonLd } from '../../components/JsonLd'
import { McpCTA } from '../../components/mcp/McpCTA'
import { McpCompare } from '../../components/mcp/McpCompare'
import { McpHero } from '../../components/mcp/McpHero'
import { McpInstall } from '../../components/mcp/McpInstall'
import { McpLevels } from '../../components/mcp/McpLevels'
import { McpPrompts } from '../../components/mcp/McpPrompts'
import { McpTools } from '../../components/mcp/McpTools'
import { McpTrust } from '../../components/mcp/McpTrust'
import { buildPageMetadata } from '../../lib/seo/metadata'
import { breadcrumbSchema, graph, organizationSchema, websiteSchema } from '../../lib/seo/schema'
import { routes } from '../../lib/seo/urls'

const PAGE_TITLE = 'Agent Skills MCP — Use skills without installing them'
const PAGE_DESCRIPTION =
  'One MCP server gives any MCP-compatible agent the whole skills catalog on demand: search by intent, load one skill, fetch only the files it asks for. No install, no lockfile.'

export const metadata = buildPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: routes.mcp(),
  keywords: [
    'agent skills MCP',
    'Model Context Protocol',
    'MCP server',
    'skills without installing',
    'progressive disclosure',
    'Claude Code MCP',
    'Cursor MCP',
    'AI coding agents',
  ],
})

export default function McpLandingPage() {
  return (
    <>
      <JsonLd
        data={graph([
          organizationSchema(),
          websiteSchema(),
          breadcrumbSchema([
            { name: 'Home', path: routes.home() },
            { name: 'MCP', path: routes.mcp() },
          ]),
        ])}
      />
      <McpHero />
      <McpCompare />
      <McpLevels />
      <McpTools />
      <McpPrompts />
      <McpTrust />
      <McpInstall />
      <McpCTA />
    </>
  )
}
