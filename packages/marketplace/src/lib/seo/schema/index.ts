import type { Category, Skill } from '../../../types'
import {
  NPM_PACKAGE_NAME,
  NPM_PACKAGE_URL,
  ORGANIZATION_NAME,
  ORGANIZATION_URL,
  REPOSITORY_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from '../site'
import { parseSkillDescription } from '../skill-description'
import { absoluteUrl, routes } from '../urls'

export type JsonLdNode = Record<string, unknown>

const ORGANIZATION_ID = `${SITE_URL}/#organization`
const WEBSITE_ID = `${SITE_URL}/#website`

/**
 * why: schema.org nodes only compose into one knowledge graph when they reference each other
 * by stable @id. Emitting standalone, unlinked nodes per page (the previous approach) gives
 * search and AI systems no way to connect a skill to the site or the publisher entity.
 */
export function organizationSchema(): JsonLdNode {
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: ORGANIZATION_NAME,
    url: ORGANIZATION_URL,
    logo: absoluteUrl('/tlc-logo-dark.svg'),
    sameAs: [ORGANIZATION_URL, REPOSITORY_URL, NPM_PACKAGE_URL],
  }
}

export function websiteSchema(): JsonLdNode {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE_NAME,
    alternateName: 'Agent Skills by Tech Leads Club',
    url: absoluteUrl(routes.home()),
    description: SITE_DESCRIPTION,
    inLanguage: 'en',
    publisher: { '@id': ORGANIZATION_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${absoluteUrl(routes.skills())}?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export interface BreadcrumbCrumb {
  name: string
  path: string
}

export function breadcrumbSchema(crumbs: BreadcrumbCrumb[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  }
}

export function itemListSchema(items: { name: string; path: string }[]): JsonLdNode {
  return {
    '@type': 'ItemList',
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  }
}

export function collectionPageSchema({
  name,
  description,
  path,
  items,
}: {
  name: string
  description: string
  path: string
  items: { name: string; path: string }[]
}): JsonLdNode {
  return {
    '@type': 'CollectionPage',
    '@id': `${absoluteUrl(path)}#webpage`,
    name,
    description,
    url: absoluteUrl(path),
    isPartOf: { '@id': WEBSITE_ID },
    mainEntity: itemListSchema(items),
  }
}

/**
 * why: a skill is a versioned Markdown instruction artifact installed into an agent, not an
 * installable binary — `SoftwareSourceCode` describes what is actually published, while the
 * `TechArticle` node describes the page a reader (or an answer engine) lands on. Claiming
 * `SoftwareApplication` would assert an operating system and an app category the catalog
 * does not have.
 */
export function skillSchema(skill: Skill, category: Category | undefined): JsonLdNode {
  const parsed = parseSkillDescription(skill.description)
  const path = routes.skill(skill.id)

  return {
    '@type': 'TechArticle',
    '@id': `${absoluteUrl(path)}#webpage`,
    headline: skill.name,
    name: skill.name,
    description: parsed.summary,
    url: absoluteUrl(path),
    inLanguage: 'en',
    dateModified: skill.metadata.lastModified,
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORGANIZATION_ID },
    author: { '@id': ORGANIZATION_ID },
    articleSection: category?.name ?? skill.category,
    proficiencyLevel: 'Expert',
    dependencies: NPM_PACKAGE_NAME,
    about: {
      '@type': 'SoftwareSourceCode',
      name: skill.id,
      description: parsed.summary,
      codeRepository: `${REPOSITORY_URL}/tree/main/packages/skills-catalog/${skill.path}`,
      programmingLanguage: 'Markdown',
      runtimePlatform: 'AI coding agents',
      author: { '@id': ORGANIZATION_ID },
    },
  }
}

export function categorySchema(category: Category, skills: Skill[]): JsonLdNode {
  return collectionPageSchema({
    name: `${category.name} skills for AI coding agents`,
    description: category.description ?? `Skills in the ${category.name} category.`,
    path: routes.category(category.id),
    items: skills.map((skill) => ({ name: skill.name, path: routes.skill(skill.id) })),
  })
}

/** Wraps page-specific nodes into one `@graph` so a page emits a single, connected JSON-LD block. */
export function graph(nodes: JsonLdNode[]): Record<string, unknown> {
  return { '@context': 'https://schema.org', '@graph': nodes }
}
