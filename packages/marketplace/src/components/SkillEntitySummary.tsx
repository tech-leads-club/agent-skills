import Link from 'next/link'

import { skillIds } from '../lib/catalog'
import { splitSkillReferences } from '../lib/editorial-links'
import { parseSkillDescription } from '../lib/seo/skill-description'
import { routes } from '../lib/seo/urls'

// why: "Do NOT use for X (use Y)" names the skill to reach for instead. Linking Y turns the
// catalog's own convention into internal links between alternatives.
function WithSkillLinks({ text }: { text: string }) {
  return (
    <>
      {splitSkillReferences(text, skillIds).map((segment, index) =>
        'skillId' in segment ? (
          <Link
            key={index}
            href={routes.skill(segment.skillId)}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {segment.skillId}
          </Link>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  )
}

/**
 * why: the skill body is long, agent-facing Markdown. AI answer engines and search snippets need
 * the three facts a reader actually asks for — what this is, when to reach for it, and when not to
 * — as short, self-contained, server-rendered statements. All three come from the catalog's own
 * enforced description convention, so nothing here is invented copy.
 */
export function SkillEntitySummary({ name, description }: { name: string; description: string }) {
  const { summary, useWhen, doNotUseFor } = parseSkillDescription(description)

  return (
    <section
      aria-labelledby="skill-overview"
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm mb-6"
    >
      <h2 id="skill-overview" className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4">
        What {name} does
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6">{summary}.</p>

      {useWhen.length > 0 && (
        <div className="mb-6">
          <h3 className="text-[11px] font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-2">
            When to use it
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-300">
            {useWhen.map((trigger) => (
              <li key={trigger}>{trigger}</li>
            ))}
          </ul>
        </div>
      )}

      {doNotUseFor.length > 0 && (
        <div>
          <h3 className="text-[11px] font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-2">
            When not to use it
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-300">
            {doNotUseFor.map((trigger) => (
              <li key={trigger}>
                <WithSkillLinks text={trigger} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
