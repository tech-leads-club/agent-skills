interface StatsCardProps {
  label: string
  value: number
  icon?: string
}

export function StatsCard({ label, value, icon }: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{value}</p>
        </div>
        {icon && <div className="text-4xl opacity-20">{icon}</div>}
      </div>
    </div>
  )
}
