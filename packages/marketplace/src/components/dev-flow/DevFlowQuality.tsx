const before = [
  {
    title: 'Human in the middle',
    body: 'Execution is the job. The expensive hour is writing the code.',
  },
  {
    title: 'Work lives in a session',
    body: 'A chat is the queue, the lock and the memory. Nothing arrives in a shared format.',
  },
  {
    title: 'Code is the bottleneck',
    body: 'Verification is a review bolted on at the end, if it happens at all.',
  },
]

const now = [
  {
    title: 'Human at the ends',
    body: 'Define intent before code exists. Validate direction after proof. Execution is an agent station.',
  },
  {
    title: 'Work arrives as an event',
    body: 'Issue, Slack, alert, backlog. Same shape every time, so the next station does not improvise.',
  },
  {
    title: 'Verification is the bottleneck',
    body: 'Cheap checks first, expensive ones near the PR. The human reads for direction, not to hunt bugs.',
  },
]

const sanity = [
  {
    title: 'The pre-patch test',
    body: 'Run the test the agent wrote against the code from before the patch. If it still passes, it tests nothing.',
  },
  {
    title: 'Do not let it rewrite the suite',
    body: 'Discard edits the agent made to existing tests. A green suite that it loosened is not proof.',
  },
]

function CheckIcon() {
  return (
    <svg className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

export function DevFlowQuality() {
  return (
    <section className="bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 py-16 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-500/6 dark:bg-blue-400/10 border border-blue-500/12 dark:border-blue-400/20 rounded-full px-4 py-1.5 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">The bottleneck moved</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-3">
            Software factories are not new
          </h2>
          <p className="text-[15px] text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            The idea dates to 1968. What changed is which station on the line became an agent, and where the bottleneck
            went. Code got cheap. Proof did not.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Before</h3>
            <ul className="space-y-4">
              {before.map((item) => (
                <li key={item.title}>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.title}</p>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Now</h3>
            <ul className="space-y-4">
              {now.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <CheckIcon />
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.title}</p>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
            Two sanity tests at the verification station
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sanity.map((item) => (
              <div
                key={item.title}
                className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5"
              >
                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5">{item.title}</h4>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
