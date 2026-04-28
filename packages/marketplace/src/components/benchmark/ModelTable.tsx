import type { ModelResult } from '../../data/spec-driven-benchmark'

interface ModelTableProps {
  data: ModelResult[]
}

const bandClass: Record<string, string> = {
  'Spec-complete': 'bg-emerald-500 text-white',
  Solid: 'bg-amber-500 text-white',
  Weak: 'bg-red-500 text-white',
}

export function ModelTable({ data }: ModelTableProps) {
  const rows = [...data].sort((a, b) => b.mean - a.mean)

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-x-auto">
      <table className="w-full text-sm border-collapse min-w-[720px]">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/50">
            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
              Model
            </th>
            <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
              Runs
            </th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
              Mean Final
            </th>
            <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
              Band
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
              Notes
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m, i) => {
            const isLast = i === rows.length - 1
            const borderCls = isLast ? '' : 'border-b border-gray-50 dark:border-gray-800/50'
            const rowBg = m.warn
              ? 'bg-red-50/60 dark:bg-red-900/15'
              : m.recommended
                ? 'bg-blue-50/60 dark:bg-blue-900/20'
                : m.value
                  ? 'bg-emerald-50/60 dark:bg-emerald-900/15'
                  : ''
            return (
              <tr key={m.model} className={`${rowBg} ${borderCls}`}>
                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                  <span className="inline-flex items-center gap-2">
                    {m.model}
                    {m.recommended && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded tracking-wide">
                        RECOMMENDED
                      </span>
                    )}
                    {m.value && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded tracking-wide">
                        BEST VALUE
                      </span>
                    )}
                    {m.warn && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded tracking-wide">
                        AVOID FOR SDD
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 tabular-nums">
                  {m.finals.length}
                </td>
                <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                  {m.mean.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-block whitespace-nowrap px-2 py-0.5 text-[11px] font-bold rounded-md ${bandClass[m.band]}`}
                  >
                    {m.band}
                  </span>
                </td>
                <td className="px-4 py-3 text-left text-[13px] text-gray-500 dark:text-gray-400 leading-snug max-w-md">
                  {m.note}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
