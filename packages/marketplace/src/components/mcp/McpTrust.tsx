const guarantees = [
  {
    title: 'Every file is checksum-verified',
    body: 'The registry carries a SHA-256 content hash per skill. Nothing is returned to the agent — and nothing is written to disk — before the fetched bytes match it.',
  },
  {
    title: 'Only one tool writes to disk',
    body: 'prepare_skill_files, and it is declared as such. Files land under ~/.cache/agent-skills-mcp/ with mode 0600 and no execute bit, so running staged code takes a deliberate act.',
  },
  {
    title: 'Paths are validated twice',
    body: 'Once against the registry file list, then again after resolution — because that list is remote input served by a CDN. A path a skill did not declare is rejected.',
  },
  {
    title: 'Revisions land beside each other',
    body: 'The staging directory is keyed on the skill content hash, so a new revision never overwrites one a script may still be running out of. Superseded ones are reclaimed after an hour.',
  },
  {
    title: 'The catalog stays fresh',
    body: 'A 15-minute TTL with ETag revalidation: a 304 renews the cache without re-downloading. If the CDN goes down after warmup, the stale cache answers instead of erroring.',
  },
  {
    title: 'Responses are bounded',
    body: 'fetch_skill_files caps at ~12.5k tokens and names what it left out, so five large reference files cannot silently blow past the limit your client applies to tool responses.',
  },
]

export function McpTrust() {
  return (
    <section className="bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 py-16 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-3">
            Fetching beats installing only if you can trust it
          </h2>
          <p className="text-[15px] text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Skipping the install step means content arrives over the network mid-session. These are the rules that
            content passes through first.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {guarantees.map((item) => (
            <div
              key={item.title}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">{item.title}</h3>
              <p className="text-[14px] text-gray-500 dark:text-gray-400 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
