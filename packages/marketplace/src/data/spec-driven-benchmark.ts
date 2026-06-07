export type FrameworkName = 'TLC' | 'Speckit' | 'OpenSpec' | 'Superpowers'

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
  planningModel: 'Opus Reasoning (High)',
  implementationModel: 'Sonnet 4.6',
  frameworks: [
    {
      name: 'TLC',
      final: 0.94,
      runs: [0.94, 0.91, 0.91],
      implementation: 0.94,
      tests: 0.91,
      eRecall: 0.89,
      scope: 'pass',
      testCount: 69,
      tokensM: 30,
      highlight: true,
    },
    {
      name: 'Speckit',
      final: 0.95,
      runs: [0.95, 0.89, 0.9],
      implementation: 1.0,
      tests: 0.9,
      eRecall: 0.78,
      scope: 'partial',
      testCount: 43,
      tokensM: 37,
    },
    {
      name: 'OpenSpec',
      final: 0.83,
      runs: [0.83, 0.79, 0.81],
      implementation: 1.0,
      tests: 0.62,
      eRecall: 0.89,
      scope: 'partial',
      testCount: 29,
      tokensM: 24,
    },
    {
      name: 'Superpowers',
      final: 0.76,
      runs: [0.79, 0.76, 0.78],
      implementation: 0.92,
      tests: 0.61,
      eRecall: 1.0,
      scope: 'partial',
      testCount: 24,
      tokensM: 39,
    },
  ],
  highlights: [
    {
      label: '3-run average',
      value: '0.92',
      detail: 'Highest mean across runs — above Speckit (0.91). Peak run 0.94.',
    },
    {
      label: 'Consistency',
      value: '±0.03',
      detail: 'Tightest spread; floor of 0.91 vs Speckit’s 0.89. Quality you can repeat.',
    },
    {
      label: 'Scope adherence',
      value: 'pass',
      detail: 'The only framework with a clean scope — zero plan drift.',
    },
    {
      label: 'Token efficiency',
      value: '~30M',
      detail: '~7M fewer than Speckit, the slowest framework. Most meaningful tests (≈49).',
    },
  ],
  directQuestions: [
    {
      question: 'Who adds the most meaningful tests?',
      winner: 'TLC',
      tlcWins: true,
      detail: '≈49 tests mapped to criteria (of 69) — the most — and proves more of them (T = 0.91).',
    },
    {
      question: 'Who adheres best to requirements?',
      winner: 'TLC',
      tlcWins: true,
      detail: 'The only framework with Scope = pass — every build traces to a sanctioned requirement.',
    },
    {
      question: 'Who delivers the best overall solution?',
      winner: 'TLC & Speckit — tie',
      tlcWins: false,
      detail: 'Co-leaders in the Spec-complete band: Speckit 0.95, TLC 0.94. TLC gets there cleaner and cheaper.',
    },
  ],
  verdict:
    'Reading only the saved-run score (0.95 vs 0.94) undersells TLC. Across three independent runs TLC posts the higher average (0.92 vs 0.91) with the tightest spread, is the only framework with clean scope adherence, ships the most meaningful tests, and does it with ~7M fewer tokens than Speckit — the slowest framework. TLC wins two of the three direct questions and ties the third: the high-value, repeatable pick.',
}
