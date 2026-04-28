'use client'

import {
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import type { FrameworkResult } from '../../data/spec-driven-benchmark'
import { useChartTheme } from './useChartTheme'

interface ValueScatterProps {
  data: FrameworkResult[]
}

export function ValueScatter({ data }: ValueScatterProps) {
  const theme = useChartTheme()
  const points = data.map((f) => ({
    name: f.name,
    tokens: f.tokensM,
    final: f.final,
    highlight: f.highlight ?? false,
  }))

  return (
    <div
      className="h-72 w-full"
      role="img"
      aria-label={
        'Scatter chart of token cost versus final score. ' +
        points.map((p) => `${p.name}: ~${p.tokens}M tokens, score ${p.final.toFixed(2)}`).join('; ') +
        '.'
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 16, right: 24, left: 16, bottom: 28 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
          <XAxis
            type="number"
            dataKey="tokens"
            name="Tokens"
            unit="M"
            domain={[20, 42]}
            tick={{ fill: theme.axis, fontSize: 12 }}
            axisLine={{ stroke: theme.grid }}
            tickLine={false}
            label={{
              value: 'Tokens (M), lower is cheaper',
              position: 'insideBottom',
              offset: -16,
              fill: theme.label,
              fontSize: 12,
              fontWeight: 600,
            }}
          />
          <YAxis
            type="number"
            dataKey="final"
            name="Final"
            domain={[0.7, 1]}
            ticks={[0.7, 0.8, 0.9, 1]}
            tick={{ fill: theme.axis, fontSize: 12 }}
            axisLine={{ stroke: theme.grid }}
            tickLine={false}
            label={{
              value: 'Final score',
              angle: -90,
              position: 'insideLeft',
              offset: 8,
              style: { textAnchor: 'middle', fill: theme.label, fontSize: 12, fontWeight: 600 },
            }}
          />
          <ZAxis range={[140, 140]} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3', stroke: theme.muted }}
            contentStyle={{
              background: theme.tooltipBg,
              border: `1px solid ${theme.tooltipBorder}`,
              borderRadius: 8,
            }}
            labelStyle={{ color: theme.tooltipText, fontWeight: 600 }}
            itemStyle={{ color: theme.tooltipText }}
            formatter={(value, name) => (name === 'Tokens' ? [`~${value}M`, name] : [Number(value).toFixed(2), name])}
          />
          <Scatter data={points}>
            <LabelList dataKey="name" position="top" fill={theme.label} fontSize={11} fontWeight={600} />
            {points.map((p) => (
              <Cell key={p.name} fill={p.highlight ? theme.highlight : theme.muted} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
