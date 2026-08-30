import Link from 'next/link'

import type { BreadcrumbCrumb } from '../lib/seo/schema'

/**
 * Visible breadcrumb trail. Kept in one component so the rendered trail and the
 * BreadcrumbList JSON-LD are always built from the same crumb array.
 */
export function Breadcrumbs({ crumbs }: { crumbs: BreadcrumbCrumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-2 text-[13px] text-gray-400 dark:text-gray-500">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          return (
            <li key={crumb.path} className="flex items-center gap-2">
              {isLast ? (
                <span className="text-gray-600 dark:text-gray-300 font-medium" aria-current="page">
                  {crumb.name}
                </span>
              ) : (
                <>
                  <Link href={crumb.path} className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    {crumb.name}
                  </Link>
                  <span aria-hidden="true">›</span>
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
