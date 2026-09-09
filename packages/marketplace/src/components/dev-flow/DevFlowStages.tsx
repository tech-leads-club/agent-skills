const stages = [
  {
    tag: 'ENTRY',
    color: 'bg-slate-400',
    title: 'Work arrives as an event',
    body: 'Issue, user request, incident alert or backlog item. Same format every time: scope, acceptance criteria, owner.',
    coming: true,
  },
  {
    tag: 'TRIAGE',
    color: 'bg-slate-400',
    title: 'Label is queue, lock and pause',
    body: 'An agent classifies: ready to build, needs a spec, missing information, wait. The label stops two agents grabbing the same issue, and it is the human pause point.',
    coming: true,
  },
  {
    tag: 'RESEARCH',
    color: 'bg-blue-600',
    title: 'Define the problem',
    body: 'tlc-discover. Bug often skips this. A feature does not. Problem, success metric, architecture and signatures, before code exists.',
    coming: false,
  },
  {
    tag: 'PLAN',
    color: 'bg-violet-500',
    title: 'Cut vertical slices',
    body: 'tlc-plan. Observable outcomes with concrete values. Each slice proves something a later agent can build without guessing.',
    coming: false,
  },
  {
    tag: 'IMPLEMENT',
    color: 'bg-emerald-500',
    title: 'Build and prove',
    body: 'tlc-implement. Isolated sandbox, own branch, vertical slice, cheap checks first. An independent verifier proves every check. The author never verifies their own work.',
    coming: false,
  },
  {
    tag: 'GATE',
    color: 'bg-rose-500',
    title: 'Judge the PR',
    body: 'the-judge. Evidence-first review, one consolidated GitHub review. Deterministic checks first, then judgment. Branch protection still requires a human. They read for direction.',
    coming: false,
  },
  {
    tag: 'PRODUCTION',
    color: 'bg-slate-400',
    title: 'Ship, watch, re-enter',
    body: 'Deploy and monitor. An incident or a piece of feedback becomes a new issue and re-enters stage 1.',
    coming: true,
  },
]

export function DevFlowStages() {
  return (
    <section className="bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-3">
            How the factory runs
          </h2>
          <p className="text-[15px] text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Seven stations on one line. v1 lights up research, plan, implement and the PR gate. Intake, triage and
            production are the same factory, still being built.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-5">
          {stages.map((stage, i) => (
            <div key={stage.tag} className={`relative flex flex-col ${stage.coming ? 'opacity-70' : ''}`}>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`w-8 h-8 rounded-full ${stage.color} text-white flex items-center justify-center text-xs font-bold shrink-0`}
                >
                  {i + 1}
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${stage.color}`}>
                  {stage.tag}
                </span>
                {stage.coming && (
                  <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    coming
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5">{stage.title}</h3>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">{stage.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
