import type { BenchmarkHighlight } from '../../data/spec-driven-benchmark'

interface BenchmarkHeroProps {
  highlights: BenchmarkHighlight[]
}

export function BenchmarkHero({ highlights }: BenchmarkHeroProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {highlights.map((h) => (
        <div
          key={h.label}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm"
        >
          <div className="text-[12px] text-gray-400 dark:text-gray-500 font-medium tracking-wide uppercase mb-2">
            {h.label}
          </div>
          <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight leading-none mb-2">
            {h.value}
          </div>
          <div className="text-[13px] text-gray-500 dark:text-gray-400 leading-snug">{h.detail}</div>
        </div>
      ))}
    </div>
  )
}
