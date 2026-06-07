import { runStats, type FrameworkResult } from '../../data/spec-driven-benchmark'

interface ComparisonTableProps {
  data: FrameworkResult[]
}

const fmt = (n: number) => n.toFixed(2)

export function ComparisonTable({ data }: ComparisonTableProps) {
  const rows = [...data].sort((a, b) => runStats(b.runs).mean - runStats(a.runs).mean)

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-x-auto">
      <table className="w-full text-sm border-collapse min-w-[640px]">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/50">
            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
              Framework
            </th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
              Avg (3-run)
            </th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
              Peak
            </th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
              Impl (I)
            </th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
              Tests (T)
            </th>
            <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
              Scope
            </th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
              Tokens
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f, i) => {
            const isLast = i === rows.length - 1
            const rowBg = f.highlight ? 'bg-blue-50/60 dark:bg-blue-900/20' : ''
            const borderCls = isLast ? '' : 'border-b border-gray-50 dark:border-gray-800/50'
            return (
              <tr key={f.name} className={`${rowBg} ${borderCls}`}>
                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                  <span className="inline-flex items-center gap-2">
                    {f.name}
                    {f.highlight && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded tracking-wide">
                        THIS SKILL
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                  {fmt(runStats(f.runs).mean)}
                </td>
                <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400 tabular-nums">{fmt(f.final)}</td>
                <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 tabular-nums">
                  {fmt(f.implementation)}
                </td>
                <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 tabular-nums">{fmt(f.tests)}</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={
                      f.scope === 'pass'
                        ? 'px-2 py-0.5 text-[11px] font-bold bg-emerald-500 text-white rounded-md'
                        : 'px-2 py-0.5 text-[11px] font-semibold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md'
                    }
                  >
                    {f.scope}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 tabular-nums">~{f.tokensM}M</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
