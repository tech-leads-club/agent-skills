export type FrameworkName = 'TLC 3.*' | 'TLC 2.*' | 'Speckit' | 'OpenSpec' | 'Superpowers'

export interface FrameworkResult {
  name: FrameworkName
  /** Final score of the saved (peak) run, 0..1 */
  final: number
  /** Scores of the three independent end-to-end runs, 0..1 */
  runs: [number, number, number]
  /** Implementation fidelity (I), 0..1 */
  implementation: number
  /** Test completeness (T), 0..1 */
  tests: number
  /** Implicit-requirement recall (E_recall), 0..1 */
  eRecall: number
  /** Scope adherence verdict */
  scope: 'pass' | 'partial'
  /** Total tests authored */
  testCount: number
  /** Approximate token cost, in millions */
  tokensM: number
  /** Highlight the flagship framework */
  highlight?: boolean
}

export interface RunStats {
  mean: number
  min: number
  max: number
  /** max - min across the three runs (lower = more consistent) */
  spread: number
}

/** Derived consistency stats from the three independent runs. */
export function runStats(runs: readonly number[]): RunStats {
  const min = Math.min(...runs)
  const max = Math.max(...runs)
  const mean = runs.reduce((a, b) => a + b, 0) / runs.length
  return { mean, min, max, spread: max - min }
}

export interface DirectQuestion {
  question: string
  winner: string
  /** True when the flagship (TLC) wins this question outright */
  tlcWins: boolean
  detail: string
}

export interface BenchmarkHighlight {
  label: string
  value: string
  detail: string
}

export interface BenchmarkData {
  /** Planning model used across every framework run */
  planningModel: string
  /** Implementation model used across every framework run */
  implementationModel: string
  frameworks: FrameworkResult[]
  /** Headline talking points for the flagship (TLC) */
  highlights: BenchmarkHighlight[]
  /** The three direct head-to-head questions from the benchmark */
  directQuestions: DirectQuestion[]
  /** Short verdict shown next to the install CTA */
  verdict: string
}

export const benchmark: BenchmarkData = {
  planningModel: 'Opus 4.8',
  implementationModel: 'Sonnet 4.6',
  frameworks: [
    {
      name: 'TLC 3.*',
      final: 0.95,
      runs: [0.95, 0.93, 0.95],
      implementation: 1.0,
      tests: 0.9,
      eRecall: 0.82,
      scope: 'pass',
      testCount: 43,
      tokensM: 31,
      highlight: true,
    },
    {
      name: 'TLC 2.*',
      final: 0.9,
      runs: [0.88, 0.9, 0.88],
      implementation: 0.92,
      tests: 0.72,
      eRecall: 0.82,
      scope: 'partial',
      testCount: 43,
      tokensM: 31,
    },
    {
      name: 'Speckit',
      final: 0.88,
      runs: [0.85, 0.88, 0.87],
      implementation: 0.96,
      tests: 0.63,
      eRecall: 0.85,
      scope: 'partial',
      testCount: 38,
      tokensM: 36,
    },
    {
      name: 'OpenSpec',
      final: 0.93,
      runs: [0.84, 0.79, 0.93],
      implementation: 0.96,
      tests: 0.65,
      eRecall: 0.71,
      scope: 'pass',
      testCount: 32,
      tokensM: 24,
    },
    {
      name: 'Superpowers',
      final: 0.86,
      runs: [0.86, 0.81, 0.84],
      implementation: 0.94,
      tests: 0.58,
      eRecall: 0.89,
      scope: 'partial',
      testCount: 20,
      tokensM: 31,
    },
  ],
  highlights: [
    {
      label: '3-run average',
      value: '0.94',
      detail: 'Top mean Final of the four frameworks, well ahead of the next best (0.87). Peak run 0.95.',
    },
    {
      label: 'Consistency',
      value: '0.93–0.95',
      detail: 'The most consistent framework: highest floor in the field, tight 0.02 range. Repeatable, not a lucky peak.',
    },
    {
      label: 'Test completeness',
      value: '0.90',
      detail: 'Best test completeness (T) in the field. Asserts behavior, never just exercises it.',
    },
    {
      label: 'Outcome tests',
      value: '12/12',
      detail: 'Perfect on real persisted-state checks: the only framework to assert the actual DB row after every webhook.',
    },
  ],
  directQuestions: [
    {
      question: 'Who tests most rigorously?',
      winner: 'TLC 3.*',
      tlcWins: true,
      detail: 'Best test completeness (T = 0.90) and a perfect 12/12 on outcome tests. Asserts real state, not just calls.',
    },
    {
      question: 'Who is the most consistent?',
      winner: 'TLC 3.*',
      tlcWins: true,
      detail: 'Range 0.93–0.95 across three runs: the highest floor in the field. OpenSpec swings 0.79–0.93.',
    },
    {
      question: 'Who delivers the best overall result?',
      winner: 'TLC 3.*',
      tlcWins: true,
      detail: 'Top mean (0.94) and the best single run (0.95): TLC 3.* leads on both the repeatable average and the peak, with a clean Scope = pass.',
    },
  ],
  verdict:
    'Across three independent runs on a real, non-trivial PRD, TLC 3.* (Opus plans, Sonnet implements) posts the highest average Final (0.94) and the most consistent results (0.93–0.95) of four spec-driven frameworks, powered by the best test completeness in the field (T = 0.90), a perfect 12/12 on real outcome assertions, and a clean Scope = pass. v3 raises the bar with an independent verifier, a requirement-closure gate, and a self-improving lessons layer, and it stays harness-friendly across most strong models.',
}

// ---------------------------------------------------------------------------
// Model ablation: TLC 3.* on the same PRD, varying the model.
// "Is the harness friendly across models?" Same framework, the model is the
// variable. Most strong models land Spec-complete (>=0.90); Gemini is the
// outlier (green gates, but ignores the spec).
// ---------------------------------------------------------------------------

export type Band = 'Spec-complete' | 'Solid' | 'Weak'

export interface ModelResult {
  /** Display name of the model (or role-split config) */
  model: string
  /** Final scores of each independent run, 0..1 */
  finals: number[]
  /** Mean Final across runs, 0..1 */
  mean: number
  band: Band
  /** Short note shown in the table */
  note: string
  /** Highlight the recommended config (Opus plans, Sonnet implements) */
  recommended?: boolean
  /** Planner != implementer (role-split) rather than same-model */
  roleSplit?: boolean
  /** Flag a model that is a poor fit for spec-driven development */
  warn?: boolean
  /** Flag the best value-for-money model */
  value?: boolean
}

export interface ModelBenchmarkData {
  /** Framework held constant across every model run */
  framework: string
  models: ModelResult[]
  /** Spec-complete threshold (Final >= this) */
  specCompleteThreshold: number
}

export const modelBenchmark: ModelBenchmarkData = {
  framework: 'tlc-spec-driven (v3)',
  specCompleteThreshold: 0.9,
  models: [
    {
      model: 'Opus → Sonnet',
      finals: [0.95],
      mean: 0.95,
      band: 'Spec-complete',
      note: 'Role-split: Opus plans, Sonnet implements. A strong plan let the cheaper implementer keep quality, matching the best single-model run.',
      recommended: true,
      roleSplit: true,
    },
    {
      model: 'Composer 2.5',
      finals: [0.98, 0.91],
      mean: 0.945,
      band: 'Spec-complete',
      note: 'Best value for money: top single-model mean (peak 0.98, green gates on both runs) at a fraction of the cost of the frontier models.',
      value: true,
    },
    {
      model: 'Claude Opus 4.8',
      finals: [0.95, 0.91],
      mean: 0.93,
      band: 'Spec-complete',
      note: 'Spec-complete on both runs, perfect precision.',
    },
    {
      model: 'GPT-5.5 (high)',
      finals: [0.91, 0.94],
      mean: 0.925,
      band: 'Spec-complete',
      note: 'Tightest spread (0.03); spec-complete on both runs.',
    },
    {
      model: 'GLM 5.2 (high)',
      finals: [0.82, 0.92, 0.97, 0.94],
      mean: 0.9125,
      band: 'Spec-complete',
      note: 'Capable but variable (n=4): runs 2–4 average 0.94 with the richest robustness layers measured.',
    },
    {
      model: 'Claude Sonnet 4.6',
      finals: [0.89, 0.85],
      mean: 0.87,
      band: 'Solid',
      note: 'Just below the spec-complete line: thinner test coverage, not missing behavior (I ≈ 0.97).',
    },
    {
      model: 'Gemini 3.1 Pro',
      finals: [0.51, 0.56],
      mean: 0.535,
      band: 'Weak',
      note: 'Ignores the spec: green gates but green-but-wrong, with un-wired endpoints, dropped requirements, missing state transitions. Stays Weak on every framework tested, so the limitation is model-driven, not framework-driven.',
      warn: true,
    },
  ],
}
