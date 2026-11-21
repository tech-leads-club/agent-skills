const rows = [
  {
    label: 'Use when',
    cli: 'You want a curated set of skills installed in your agent, always available offline.',
    mcp: 'You want the agent to look one up the moment it needs it, without deciding in advance.',
  },
  {
    label: 'Persistence',
    cli: 'Files land in .agents/, ~/.cursor/skills/ and friends, recorded in a lockfile.',
    mcp: 'Nothing is installed. The agent fetches from the CDN when a skill is actually needed.',
  },
  {
    label: 'Staying current',
    cli: 'You re-run the installer to pick up new versions.',
    mcp: 'Always the published catalog — the registry is revalidated on a 15-minute TTL.',
  },
  {
    label: 'Context cost',
    cli: 'Every installed skill description sits in the agent context from the start.',
    mcp: 'A search costs a few hundred tokens. Nothing else loads until it is chosen.',
  },
  {
    label: 'Best for',
    cli: 'The handful of skills you use every day.',
    mcp: 'One-off help, exploring the catalog, or trying a skill before committing to it.',
  },
]

export function McpCompare() {
  return (
    <section className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 py-16 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-3">
            CLI or MCP?
          </h2>
          <p className="text-[15px] text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Same catalog, same CDN, same skills. They differ in one thing: whether the skill lives on your disk or is
            fetched when the agent asks for it.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="p-5 text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 w-36" />
                <th className="p-5 text-sm font-bold text-gray-900 dark:text-gray-100">
                  CLI
                  <span className="block font-mono text-[11px] font-medium text-gray-400 dark:text-gray-500 mt-1">
                    @tech-leads-club/agent-skills
                  </span>
                </th>
                <th className="p-5 text-sm font-bold text-blue-600 dark:text-blue-400">
                  MCP
                  <span className="block font-mono text-[11px] font-medium text-gray-400 dark:text-gray-500 mt-1">
                    @tech-leads-club/agent-skills-mcp
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <th className="p-5 align-top text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    {row.label}
                  </th>
                  <td className="p-5 align-top text-[14px] text-gray-500 dark:text-gray-400 leading-relaxed">
                    {row.cli}
                  </td>
                  <td className="p-5 align-top text-[14px] text-gray-600 dark:text-gray-300 leading-relaxed bg-blue-50/40 dark:bg-blue-900/10">
                    {row.mcp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-center text-[14px] text-gray-500 dark:text-gray-400 mt-6">
          You can run both: install your go-to skills with the CLI, and add the MCP so the agent can pull in the rest on
          demand.
        </p>
      </div>
    </section>
  )
}
