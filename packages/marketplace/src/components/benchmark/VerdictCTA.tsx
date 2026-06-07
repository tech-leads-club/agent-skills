import { CopyButton } from '../CopyButton'
import { ShareButton } from '../ShareButton'

interface VerdictCTAProps {
  verdict: string
  skillId: string
}

export function VerdictCTA({ verdict, skillId }: VerdictCTAProps) {
  const installCommand = `npx @tech-leads-club/agent-skills install --skill ${skillId}`

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="px-3 py-1 text-xs font-bold bg-emerald-500 text-white rounded-md tracking-wide">Verdict</span>
      </div>
      <p className="text-[15px] text-gray-600 dark:text-gray-300 leading-relaxed mb-6 max-w-3xl">{verdict}</p>
      <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-3.5 sm:p-4 flex items-center justify-between gap-3 mb-5">
        <code className="text-sm text-sky-400 font-mono truncate">{installCommand}</code>
        <CopyButton
          text={installCommand}
          className="!bg-white/10 !text-white !px-4 !py-1.5 !text-xs hover:!bg-white/20 shrink-0"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <ShareButton skillId={skillId} variant="icon" />
      </div>
    </div>
  )
}
