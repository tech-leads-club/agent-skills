const detection = [
  {
    title: 'Reads your standards',
    body: 'Scans AGENTS.md, .cursor/rules, CONTRIBUTING, test-runner configs, and CI workflows for documented quality and testing rules.',
  },
  {
    title: 'Samples your tests',
    body: 'Studies 5 to 10 existing test files to learn your style, file locations, framework, and per-layer depth, then treats that depth as a floor, never a ceiling.',
  },
  {
    title: 'Discovers your commands',
    body: 'Extracts the real test and gate commands from your manifests and CI instead of guessing an ecosystem. No tests yet? It asks you which types and commands to use.',
  },
]

const built = [
  {
    title: 'Co-located, not deferred',
    body: 'Tests ship inside the task that creates the code, and they must satisfy the required coverage expectation for that layer, not merely exist. "Tested later" is rejected.',
  },
  {
    title: 'Spec-derived assertions',
    body: 'Tests are written from the spec acceptance criteria, never by reading the code. Each assertion targets the exact spec-defined outcome.',
  },
  {
    title: 'Test Adequacy Review',
    body: 'Every task passes a necessary-and-sufficient review: each criterion covered with file:line evidence (evidence-or-zero), and every test traced back to a requirement. No scope creep.',
  },
  {
    title: 'Non-shallow litmus',
    body: 'Assertions that would still pass under a wrong implementation are rejected. Asserting a value or persisted state, never just that a mock was called.',
  },
]

const ensured = [
  {
    title: 'Deterministic gate',
    body: 'The test runner decides, not the agent. A task cannot be committed until its gate (quick / full / build) passes, with the test count checked so nothing is silently deleted.',
  },
  {
    title: 'Independent Verifier',
    body: 'After the last task, a fresh read-only sub-agent runs automatically. Author is never the verifier, so it re-derives coverage from the spec instead of inheriting the author assumptions.',
  },
  {
    title: 'Discrimination sensor',
    body: 'The Verifier injects behavior-level faults into a throwaway copy and confirms the tests catch them. Surviving mutants become fix tasks: proof the suite detects regressions.',
  },
  {
    title: 'Bounded fix loop',
    body: 'Gaps route back as fix tasks and the Verifier re-runs, capped at 3 iterations before escalating to you. Every grounded failure is distilled into a reusable, project-local lesson.',
  },
]

function CheckIcon() {
  return (
    <svg className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

export function LPQuality() {
  return (
    <section className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 py-16 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-500/6 dark:bg-blue-400/10 border border-blue-500/12 dark:border-blue-400/20 rounded-full px-4 py-1.5 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Quality by construction</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-3">
            How quality is built and ensured
          </h2>
          <p className="text-[15px] text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Quality is not a final review bolted on at the end. The harness learns how your project tests, builds the
            right tests into every task, and then proves them with an independent verifier.
          </p>
        </div>

        {/* Step 1: proactive detection */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              1
            </span>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">It learns how your project tests</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {detection.map((d) => (
              <div
                key={d.title}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm"
              >
                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5">{d.title}</h4>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">{d.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Step 2: built + ensured */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                2
              </span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Built into every task</h3>
            </div>
            <ul className="space-y-4">
              {built.map((b) => (
                <li key={b.title} className="flex gap-3">
                  <CheckIcon />
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{b.title}</p>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">{b.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                3
              </span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Ensured independently</h3>
            </div>
            <ul className="space-y-4">
              {ensured.map((e) => (
                <li key={e.title} className="flex gap-3">
                  <CheckIcon />
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{e.title}</p>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">{e.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
