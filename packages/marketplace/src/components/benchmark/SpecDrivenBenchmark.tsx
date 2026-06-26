'use client'

import { benchmark, modelBenchmark } from '../../data/spec-driven-benchmark'
import { BenchmarkHero } from './BenchmarkHero'
import { ComparisonTable } from './ComparisonTable'
import { ConsistencyChart } from './ConsistencyChart'
import { DirectQuestions } from './DirectQuestions'
import { FinalScoreChart } from './FinalScoreChart'
import { ImplVsTestsChart } from './ImplVsTestsChart'
import { ModelTable } from './ModelTable'
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
          Benchmarked against other spec-driven development frameworks on a real, non-trivial PRD. TLC 3.* runs in its
          recommended role-split ({planningModel} plans, {implementationModel} implements); the other frameworks run on
          {' '}
          {implementationModel}. Three end-to-end runs each, scored by an auditable binary-check LLM judge.
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
          subtitle="Bars show the 3-run average, the consistency-fair view. Hover for each peak run. TLC 3.* leads on the mean (0.94); TLC 2.* shown for comparison."
        >
          <FinalScoreChart data={frameworks} />
        </ChartCard>
        <ChartCard
          title="Consistency across 3 runs"
          subtitle="Dots = the three independent runs; diamond = average. Tighter & higher cluster wins. TLC 3.* leads on the mean (0.94); TLC 2.* shown for comparison."
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

      {/* TLC 3.* model ablation across models */}
      <div className="mt-12 mb-6">
        <div className="inline-flex items-center gap-2 bg-blue-500/6 dark:bg-blue-400/10 border border-blue-500/12 dark:border-blue-400/20 rounded-full px-4 py-1.5 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">TLC 3.* · model ablation</span>
        </div>
        <h3 className="text-2xl sm:text-[28px] font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-2">
          Harness-friendly with most models
        </h3>
        <p className="text-[15px] text-gray-500 dark:text-gray-400 leading-relaxed max-w-3xl">
          The comparison above runs TLC 3.* in its recommended Opus→Sonnet role-split. Here we hold the framework at TLC
          3.* and vary the <strong>single</strong> model instead. The skill harness is deliberately thin and{' '}
          <strong>optimized for how modern models are designed</strong>. It guides without fighting the model&apos;s own
          reasoning, so almost every strong model lands <strong>Spec-complete (≥ 0.90)</strong>. The role-split (
          <strong>Opus plans, Sonnet implements</strong>) tops the field at <strong>0.95</strong>, and{' '}
          <strong>Composer 2.5 is the best value for money</strong> (mean 0.945, peak 0.98).
        </p>
      </div>

      <div className="mb-6">
        <ChartCard
          title="Harness-friendly with most models"
          subtitle="Mean Final per model on TLC 3.* (same PRD). Most strong models are Spec-complete; Gemini 3.1 Pro is a poor fit for SDD."
        >
          <ModelTable data={modelBenchmark.models} />
        </ChartCard>
      </div>

      {/* Gemini caveat */}
      <div className="mb-6 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/60 dark:bg-red-900/15 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded tracking-wide shrink-0">
            HEADS UP
          </span>
          <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed">
            <strong>Gemini 3.1 Pro is a bad fit for spec-driven development.</strong> It passed every engineering gate
            (build / lint / unit / e2e) yet stayed <strong>Weak (0.54)</strong> because it ignores the spec, shipping
            green-but-wrong code: un-wired endpoints, dropped requirements, and missing state transitions. It stayed
            Weak on a second framework too, so the limitation is model-driven, not framework-driven.
          </p>
        </div>
      </div>

      {/* Verdict + CTA */}
      <VerdictCTA verdict={verdict} skillId={skillId} />

      {/* Methodology footnote */}
      <p className="mt-6 text-[12px] text-gray-400 dark:text-gray-600 leading-relaxed">
        Benchmark methodology: each framework ran end-to-end 3× on the same non-trivial PRD. TLC 3.* used its
        recommended role-split ({planningModel} plans → {implementationModel} implements); TLC 2.* and the other
        frameworks used {implementationModel} for both planning and implementation. Quality was scored by an auditable
        binary-check LLM judge.{' '}
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
