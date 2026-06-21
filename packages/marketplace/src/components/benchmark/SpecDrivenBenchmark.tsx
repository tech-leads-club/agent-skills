'use client'

import { benchmark } from '../../data/spec-driven-benchmark'
import { BenchmarkHero } from './BenchmarkHero'
import { ComparisonTable } from './ComparisonTable'
import { ConsistencyChart } from './ConsistencyChart'
import { DirectQuestions } from './DirectQuestions'
import { FinalScoreChart } from './FinalScoreChart'
import { ImplVsTestsChart } from './ImplVsTestsChart'
import { ValueScatter } from './ValueScatter'
import { VerdictCTA } from './VerdictCTA'

interface SpecDrivenBenchmarkProps {
  skillId: string
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 sm:p-6 shadow-sm">
      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">{title}</h3>
      <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-4">{subtitle}</p>
      {children}
    </div>
  )
}

export function SpecDrivenBenchmark({ skillId }: SpecDrivenBenchmarkProps) {
  const { frameworks, highlights, directQuestions, verdict, planningModel, implementationModel } = benchmark

  return (
    <section aria-labelledby="benchmark-heading" className="mt-10 mb-12">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 bg-blue-500/6 dark:bg-blue-400/10 border border-blue-500/12 dark:border-blue-400/20 rounded-full px-4 py-1.5 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">SDD Benchmark</span>
        </div>
        <h2
          id="benchmark-heading"
          className="text-2xl sm:text-[28px] font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-2"
        >
          Proven effectiveness, in numbers
        </h2>
        <p className="text-[15px] text-gray-500 dark:text-gray-400 leading-relaxed max-w-3xl">
          Benchmarked against other spec-driven development frameworks on a real, non-trivial PRD — same planning model
          ({planningModel}) and implementation model ({implementationModel}) across every run, with an auditable
          binary-check LLM judge.
        </p>
      </div>

      {/* Headline metrics */}
      <div className="mb-6">
        <BenchmarkHero highlights={highlights} />
      </div>

      {/* Primary chart + consistency (the headline correction) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard
          title="Average score across 3 runs"
          subtitle="Bars show the 3-run average — the consistency-fair view. Hover for each peak run. TLC leads on the mean (0.92)."
        >
          <FinalScoreChart data={frameworks} />
        </ChartCard>
        <ChartCard
          title="Consistency across 3 runs"
          subtitle="Dots = the three independent runs; diamond = average. Tighter & higher cluster wins — TLC leads on the mean (0.92)."
        >
          <ConsistencyChart data={frameworks} />
        </ChartCard>
      </div>

      {/* Secondary charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard
          title="Value: cost vs quality"
          subtitle="Tokens (work) vs final score. Top-left is the high-value quadrant."
        >
          <ValueScatter data={frameworks} />
        </ChartCard>
        <ChartCard
          title="Implementation vs Tests"
          subtitle="Everyone implements well; test completeness is the real differentiator."
        >
          <ImplVsTestsChart data={frameworks} />
        </ChartCard>
      </div>

      {/* The three direct questions */}
      <div className="mb-6">
        <DirectQuestions questions={directQuestions} />
      </div>

      {/* Comparison table */}
      <div className="mb-6">
        <ComparisonTable data={frameworks} />
      </div>

      {/* Verdict + CTA */}
      <VerdictCTA verdict={verdict} skillId={skillId} />

      {/* Methodology footnote */}
      <p className="mt-6 text-[12px] text-gray-400 dark:text-gray-600 leading-relaxed">
        Benchmark methodology: each framework ran end-to-end 3× on the same non-trivial PRD using {planningModel} for
        planning and {implementationModel} for implementation. Quality was scored by an auditable binary-check LLM
        judge.{' '}
        <a
          href="https://github.com/tech-leads-club/agent-skills/tree/main/packages/skills-catalog/skills/(development)/tlc-spec-driven"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-400"
        >
          View skill source →
        </a>
      </p>
    </section>
  )
}
