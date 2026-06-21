import type { DirectQuestion } from '../../data/spec-driven-benchmark'

interface DirectQuestionsProps {
  questions: DirectQuestion[]
}

export function DirectQuestions({ questions }: DirectQuestionsProps) {
  const wins = questions.filter((q) => q.tlcWins).length
  const ties = questions.length - wins

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Head-to-head: the questions that matter
        </h3>
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
          TLC: {wins} wins · {ties} tie
        </span>
      </div>
      <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-4">
        Beyond a single number — where each framework actually lands.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {questions.map((q) => (
          <div
            key={q.question}
            className={`rounded-lg border p-4 ${
              q.tlcWins
                ? 'border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/15'
                : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20'
            }`}
          >
            <div className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-2 leading-snug">
              {q.question}
            </div>
            <div className="flex items-center gap-1.5 mb-2">
              <svg
                className={q.tlcWins ? 'w-4 h-4 text-blue-600 dark:text-blue-400' : 'w-4 h-4 text-emerald-500'}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{q.winner}</span>
            </div>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed">{q.detail}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
