import { TOOLS } from './constants'

export function McpTools() {
  return (
    <section className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 py-16 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-3">
            Five tools
          </h2>
          <p className="text-[15px] text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Four of them are the search → read → fetch workflow. The fifth is there for when you just want to look
            around.
          </p>
        </div>

        <div className="space-y-4">
          {TOOLS.map((tool) => (
            <div
              key={tool.name}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="sm:w-56 shrink-0">
                  <code
                    className={`inline-block px-2.5 py-1 rounded text-[12px] font-mono font-bold text-white ${tool.color}`}
                  >
                    {tool.name}
                  </code>
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 mb-3">{tool.summary}</p>
                  <ul className="space-y-1.5">
                    {tool.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-2 text-[14px] text-gray-500 dark:text-gray-400 leading-relaxed"
                      >
                        <svg
                          className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">
            Plus a resource:{' '}
            <code className="font-mono text-[14px] text-blue-600 dark:text-blue-400">skills://catalog</code>
          </h3>
          <p className="text-[14px] text-gray-500 dark:text-gray-400 leading-relaxed">
            The full registry as JSON. Clients that support MCP Resources can cache it natively and skip the round-trip
            for catalog data entirely.
          </p>
        </div>
      </div>
    </section>
  )
}
