const pills = ['Define intent', 'Validate direction', 'Layered verification', 'Evidence-first review']

export function DevFlowPosition() {
  return (
    <section className="bg-slate-900 dark:bg-slate-950 border-y border-slate-800">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
          <span className="text-xs font-semibold text-sky-300 tracking-wide">The human stays in the loop</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-white tracking-tight leading-[1.12] mb-5">
          The human doesn&apos;t leave the loop. They change position.
        </h2>

        <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto mb-8">
          v1 covers research, plan, implement and PR review. Intake, triage and production land in later versions of the
          same line.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {pills.map((pill) => (
            <span
              key={pill}
              className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm font-medium text-slate-200"
            >
              <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {pill}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
