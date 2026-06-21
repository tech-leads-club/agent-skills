const phases = [
  {
    tag: 'SPECIFY',
    color: 'bg-blue-600',
    title: 'Define what to build',
    body: 'Requirements, constraints, scope. Always required. The agent generates a spec with requirement IDs that every downstream task traces back to.',
    required: true,
  },
  {
    tag: 'DESIGN',
    color: 'bg-violet-500',
    title: 'Architecture decisions',
    body: "Component design, data flow, integration points. Auto-skipped for straightforward changes — no boilerplate when there's nothing to decide.",
    required: false,
  },
  {
    tag: 'TASKS',
    color: 'bg-amber-500',
    title: 'Atomic breakdown',
    body: 'Full task list with dependencies and verification criteria. Auto-skipped when there are ≤3 obvious steps — they become implicit in Execute.',
    required: false,
  },
  {
    tag: 'EXECUTE',
    color: 'bg-emerald-500',
    title: 'Implement and verify',
    body: 'Atomic commits, one task at a time. Every task is verified against its criterion before moving on. Always required.',
    required: true,
  },
]

export function LPHowItWorks() {
  return (
    <section className="bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 py-16 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-3">
            How it works
          </h2>
          <p className="text-[15px] text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            The 4-phase pipeline. Only the phases you need — never more.
          </p>
        </div>

        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden sm:block absolute top-7 left-[calc(12.5%+1rem)] right-[calc(12.5%+1rem)] h-px bg-gray-200 dark:bg-gray-800" />

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-4">
            {phases.map((phase, i) => (
              <div key={phase.tag} className="relative flex flex-col items-center text-center sm:items-start sm:text-left">
                <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2 w-full mb-3">
                  <div
                    className={`w-8 h-8 rounded-full ${phase.color} text-white flex items-center justify-center text-xs font-bold shrink-0 z-10`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold tracking-widest`} style={{ color: 'inherit' }}>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${phase.color}`}>
                        {phase.tag}
                      </span>
                    </span>
                    {!phase.required && (
                      <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                        optional
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5">{phase.title}</h3>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">{phase.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
