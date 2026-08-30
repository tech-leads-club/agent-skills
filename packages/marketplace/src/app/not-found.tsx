import Link from 'next/link'

import { routes } from '../lib/seo/urls'

// why: Next already emits noindex for the not-found route; adding a second robots meta here
// would ship a duplicate directive, so this only names the page.
export const metadata = {
  title: 'Page Not Found',
}

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-4">Page not found</h1>
      <p className="text-base text-gray-500 dark:text-gray-400 mb-8">
        That URL does not match a skill, category or agent in this registry.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href={routes.skills()} className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl">
          Browse all skills
        </Link>
        <Link
          href={routes.categories()}
          className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300"
        >
          Browse categories
        </Link>
      </div>
    </div>
  )
}
