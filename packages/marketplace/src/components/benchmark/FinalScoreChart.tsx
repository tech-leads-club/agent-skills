'use client'

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { runStats, type FrameworkResult } from '../../data/spec-driven-benchmark'
import { useChartTheme } from './useChartTheme'

interface FinalScoreChartProps {
  data: FrameworkResult[]
}

export function FinalScoreChart({ data }: FinalScoreChartProps) {
  const theme = useChartTheme()
  const chartData = [...data]
    .map((f) => ({
      name: f.name,
      mean: Number(runStats(f.runs).mean.toFixed(2)),
      peak: f.final,
      highlight: f.highlight ?? false,
    }))
    .sort((a, b) => b.mean - a.mean)

  return (
    <div
      className="h-72 w-full"
      role="img"
      aria-label={
        'Bar chart of the average score across 3 runs. ' +
        chartData.map((d) => `${d.name} ${d.mean.toFixed(2)}`).join(', ') +
        '.'
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 24, right: 12, left: -12, bottom: 4 }}>
          <XAxis
            dataKey="name"
            interval={0}
            tick={{ fill: theme.axis, fontSize: 11 }}
            axisLine={{ stroke: theme.grid }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 1]}
            ticks={[0, 0.25, 0.5, 0.75, 1]}
            tick={{ fill: theme.axis, fontSize: 12 }}
            axisLine={{ stroke: theme.grid }}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: theme.muted, opacity: 0.15 }}
            contentStyle={{
              background: theme.tooltipBg,
              border: `1px solid ${theme.tooltipBorder}`,
              borderRadius: 8,
            }}
            labelStyle={{ color: theme.tooltipText, fontWeight: 600 }}
            itemStyle={{ color: theme.tooltipText }}
            formatter={(value, _name, item) => [
              `${Number(value).toFixed(2)}  (peak run ${Number(item?.payload?.peak ?? 0).toFixed(2)})`,
              '3-run average',
            ]}
          />
          <Bar dataKey="mean" radius={[6, 6, 0, 0]} maxBarSize={64}>
            <LabelList
              dataKey="mean"
              position="top"
              formatter={(v) => Number(v).toFixed(2)}
              fill={theme.label}
              fontSize={12}
              fontWeight={600}
            />
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.highlight ? theme.highlight : theme.muted} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
