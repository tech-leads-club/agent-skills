import { PROMPTS } from './constants'

export function McpPrompts() {
  return (
    <section className="bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 py-16 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-3">
            Slash commands, not tool names
          </h2>
          <p className="text-[15px] text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            The server ships MCP prompts, which compatible clients surface as slash commands. You describe the task; the
            prompt walks the agent through the workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {PROMPTS.map((prompt) => (
            <div
              key={prompt.command}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm"
            >
              <div className="flex items-baseline gap-3 mb-3">
                <code className="text-base font-mono font-bold text-gray-900 dark:text-gray-100">{prompt.command}</code>
                <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  {prompt.args}
                </span>
              </div>
              <p className="text-[14px] text-gray-500 dark:text-gray-400 leading-relaxed mb-4">{prompt.body}</p>
              <code className="block bg-slate-900 dark:bg-slate-950 rounded-lg px-3 py-2 text-[12px] font-mono text-sky-400 overflow-x-auto whitespace-nowrap">
                {prompt.example}
              </code>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
