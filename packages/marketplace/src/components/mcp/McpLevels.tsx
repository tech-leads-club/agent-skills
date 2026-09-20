import { LEVELS } from './constants'

export function McpLevels() {
  return (
    <section className="bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 py-16 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-3">
            Progressive disclosure, in three levels
          </h2>
          <p className="text-[15px] text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Loading the whole catalog into a session would be wasteful, so the server never does. Each level pays only
            for itself, and the agent decides whether to spend the next one.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {LEVELS.map((level) => (
            <div
              key={level.tool}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm flex flex-col"
            >
              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`w-7 h-7 rounded-full ${level.color} text-white flex items-center justify-center text-xs font-bold shrink-0`}
                >
                  {level.level}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${level.color}`}>
                  {level.tag}
                </span>
                <code className="text-[12px] font-mono text-gray-500 dark:text-gray-400">{level.tool}</code>
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">{level.title}</h3>
              <p className="text-[14px] text-gray-500 dark:text-gray-400 leading-relaxed mb-4 flex-1">{level.body}</p>
              <span className="text-[12px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                {level.cost}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
