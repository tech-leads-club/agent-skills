'use client'

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { FrameworkResult } from '../../data/spec-driven-benchmark'
import { useChartTheme } from './useChartTheme'

interface ImplVsTestsChartProps {
  data: FrameworkResult[]
}

export function ImplVsTestsChart({ data }: ImplVsTestsChartProps) {
  const theme = useChartTheme()
  const chartData = [...data]
    .sort((a, b) => b.final - a.final)
    .map((f) => ({ name: f.name, Implementation: f.implementation, Tests: f.tests }))

  return (
    <div
      className="h-72 w-full"
      role="img"
      aria-label={
        'Grouped bar chart comparing implementation and test scores per framework. ' +
        chartData
          .map((d) => `${d.name}: implementation ${d.Implementation.toFixed(2)}, tests ${d.Tests.toFixed(2)}`)
          .join('; ') +
        '.'
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 12, right: 12, left: -12, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: theme.axis, fontSize: 12 }}
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
            formatter={(value) => Number(value).toFixed(2)}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: theme.label }} />
          <Bar dataKey="Implementation" fill={theme.highlight} radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="Tests" fill={theme.muted} radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
