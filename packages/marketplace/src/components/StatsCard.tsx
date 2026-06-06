interface StatsCardProps {
  label: string
  value: number
  icon?: string
}

export function StatsCard({ label, value, icon }: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 flex items-center justify-between shadow-sm">
      <div>
        <div className="text-[13px] text-gray-400 dark:text-gray-500 font-medium tracking-wide mb-2">{label}</div>
        <div className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight leading-none">
          {value}
        </div>
      </div>
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center text-xl">
          {icon}
        </div>
      )}
    </div>
  )
}
