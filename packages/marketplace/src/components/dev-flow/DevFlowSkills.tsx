import Link from 'next/link'
import { FLOW_SKILLS } from './constants'

export function DevFlowSkills() {
  return (
    <section className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 py-16 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-3">
            The v1 skills
          </h2>
          <p className="text-[15px] text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Four skills, one core loop. Discover decides. Plan cuts. Implement proves. The Judge reviews.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FLOW_SKILLS.map((skill, i) => (
            <div
              key={skill.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm flex flex-col"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="w-7 h-7 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${skill.color}`}>
                  {skill.tag}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{skill.title}</h3>
              <p className="text-[14px] text-gray-500 dark:text-gray-400 leading-relaxed mb-5 flex-1">{skill.body}</p>
              <Link
                href={`/skills/${skill.id}`}
                className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {skill.id} →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
