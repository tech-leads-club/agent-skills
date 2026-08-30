import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Breadcrumbs } from '../../../components/Breadcrumbs'
import { JsonLd } from '../../../components/JsonLd'
import { SkillListItem } from '../../../components/SkillListItem'
import { findCategory, populatedCategories, skillsInCategory } from '../../../lib/catalog'
import { buildPageMetadata } from '../../../lib/seo/metadata'
import { breadcrumbSchema, categorySchema, graph, organizationSchema } from '../../../lib/seo/schema'
import { routes } from '../../../lib/seo/urls'

export function generateStaticParams() {
  return populatedCategories().map((category) => ({ category: category.id }))
}

function crumbsFor(name: string, id: string) {
  return [
    { name: 'Home', path: routes.home() },
    { name: 'Categories', path: routes.categories() },
    { name: name, path: routes.category(id) },
  ]
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: categoryId } = await params
  const category = findCategory(categoryId)
  if (!category) return {}

  const count = skillsInCategory(categoryId).length

  return buildPageMetadata({
    title: `${category.name} Skills for AI Coding Agents`,
    description: `${count} ${category.name.toLowerCase()} skills for AI coding agents. ${
      category.description ?? ''
    }`.trim(),
    path: routes.category(categoryId),
    keywords: [`${category.name.toLowerCase()} AI agent skills`, 'AI coding agents', 'agent skills'],
  })
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: categoryId } = await params
  const category = findCategory(categoryId)
  const skills = skillsInCategory(categoryId)

  if (!category || skills.length === 0) {
    notFound()
  }

  const siblings = populatedCategories().filter((entry) => entry.id !== categoryId)

  return (
    <>
      <JsonLd
        data={graph([
          organizationSchema(),
          categorySchema(category, skills),
          breadcrumbSchema(crumbsFor(category.name, categoryId)),
        ])}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumbs crumbs={crumbsFor(category.name, categoryId)} />

        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-4">
            {category.name} skills for AI coding agents
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed max-w-3xl">
            {category.description}. Each skill is a packaged set of instructions you install into Cursor, Claude Code,
            GitHub Copilot, Windsurf or any other supported agent, so the agent follows the same workflow every time.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-3">
            {skills.length} {skills.length === 1 ? 'skill' : 'skills'} in this category.
          </p>
        </header>

        <section aria-labelledby="skills-heading" className="mb-14">
          <h2
            id="skills-heading"
            className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-4"
          >
            Skills in {category.name}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {skills.map((skill) => (
              <SkillListItem key={skill.id} skill={skill} />
            ))}
          </ul>
        </section>

        <section aria-labelledby="other-categories-heading">
          <h2
            id="other-categories-heading"
            className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-4"
          >
            Other categories
          </h2>
          <ul className="flex flex-wrap gap-2">
            {siblings.map((sibling) => (
              <li key={sibling.id}>
                <Link
                  href={routes.category(sibling.id)}
                  className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {sibling.name}
                  <span className="text-gray-400 dark:text-gray-500">{sibling.skillCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
