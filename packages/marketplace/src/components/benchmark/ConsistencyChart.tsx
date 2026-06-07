'use client'

import { CartesianGrid, Cell, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts'
import { runStats, type FrameworkResult } from '../../data/spec-driven-benchmark'
import { useChartTheme } from './useChartTheme'

interface ConsistencyChartProps {
  data: FrameworkResult[]
}

export function ConsistencyChart({ data }: ConsistencyChartProps) {
  const theme = useChartTheme()
  const ordered = [...data].sort((a, b) => runStats(b.runs).mean - runStats(a.runs).mean)

  const runPoints = ordered.flatMap((f) =>
    f.runs.map((score, i) => ({ name: f.name, score, highlight: f.highlight ?? false, kind: `run ${i + 1}` })),
  )
  const meanPoints = ordered.map((f) => ({
    name: f.name,
    score: Number(runStats(f.runs).mean.toFixed(2)),
    highlight: f.highlight ?? false,
    kind: '3-run avg',
  }))

  const byName = new Map<string, FrameworkResult>(ordered.map((f) => [f.name, f]))

  function TooltipContent({ active, payload }: { active?: boolean; payload?: Array<{ payload?: { name?: string } }> }) {
    if (!active || !payload?.length) return null
    const name = payload[0]?.payload?.name
    const f = name ? byName.get(name) : undefined
    if (!f) return null
    const { mean } = runStats(f.runs)
    return (
      <div
        style={{
          background: theme.tooltipBg,
          border: `1px solid ${theme.tooltipBorder}`,
          borderRadius: 8,
          padding: '8px 12px',
          color: theme.tooltipText,
          fontSize: 12,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{f.name}</div>
        <div>3-run average: {mean.toFixed(2)}</div>
        <div style={{ opacity: 0.85 }}>runs: {f.runs.map((r) => r.toFixed(2)).join(' · ')}</div>
      </div>
    )
  }

  return (
    <div
      className="h-72 w-full"
      role="img"
      aria-label={
        'Scatter chart of three independent runs per framework with the average. ' +
        ordered.map((f) => `${f.name} averages ${runStats(f.runs).mean.toFixed(2)}`).join(', ') +
        '.'
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 16, right: 16, left: -8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
          <XAxis
            type="category"
            dataKey="name"
            allowDuplicatedCategory={false}
            tick={{ fill: theme.axis, fontSize: 12 }}
            axisLine={{ stroke: theme.grid }}
            tickLine={false}
          />
          <YAxis
            type="number"
            dataKey="score"
            domain={[0.7, 1]}
            ticks={[0.7, 0.8, 0.9, 1]}
            tick={{ fill: theme.axis, fontSize: 12 }}
            axisLine={{ stroke: theme.grid }}
            tickLine={false}
          />
          <ZAxis range={[70, 70]} />
          <Tooltip cursor={{ strokeDasharray: '3 3', stroke: theme.muted }} content={<TooltipContent />} />
          {/* Individual runs — semi-transparent */}
          <Scatter data={runPoints} fillOpacity={0.45}>
            {runPoints.map((p, i) => (
              <Cell key={`run-${p.name}-${i}`} fill={p.highlight ? theme.highlight : theme.muted} />
            ))}
          </Scatter>
          {/* 3-run mean — solid, larger emphasis via ZAxis-independent shape color */}
          <Scatter data={meanPoints} shape="diamond">
            {meanPoints.map((p) => (
              <Cell key={`mean-${p.name}`} fill={p.highlight ? theme.highlight : theme.axis} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
