export const INSTALL_CMD =
  'npx @tech-leads-club/agent-skills install --skill tlc-discover tlc-plan tlc-implement the-judge'

export const FLOW_SKILLS = [
  {
    id: 'tlc-discover',
    tag: 'DISCOVER',
    color: 'bg-blue-600',
    title: 'Interview the idea',
    body: 'Turns an unshaped problem into a verdict and a design document with literal decisions. The expensive judgment lives here: the problem, the success metric, the architecture and the signatures, before a line of code exists.',
  },
  {
    id: 'tlc-plan',
    tag: 'PLAN',
    color: 'bg-violet-500',
    title: 'Cut decided work into tasks',
    body: 'Takes work that is already decided and writes tasks a builder can act on without guessing. Each slice proves something. Criteria are observable outcomes with concrete values, not adjectives.',
  },
  {
    id: 'tlc-implement',
    tag: 'IMPLEMENT',
    color: 'bg-emerald-500',
    title: 'Build, then prove it',
    body: 'Extracts a checklist from the plan, builds in vertical slices, and proves every check with an independent verifier. The author is never the verifier. Done is an exit code, not a self-report.',
  },
  {
    id: 'the-judge',
    tag: 'JUDGE',
    color: 'bg-rose-500',
    title: 'Review with evidence',
    body: 'Evidence-first PR judge. Runs lint, types and tests first, researches current docs, then posts one consolidated GitHub review. Every finding carries a citation. The verdict is APPROVE, COMMENT or REQUEST_CHANGES. The human still merges.',
  },
] as const
