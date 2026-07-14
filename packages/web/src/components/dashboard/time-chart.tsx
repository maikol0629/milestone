'use client'

import type { TimeSession } from '@milestone/shared'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'

interface TimeChartProps {
  sessions: TimeSession[]
}

export function TimeChart({ sessions }: TimeChartProps) {
  const now = new Date()
  const start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
  start.setHours(0, 0, 0, 0)

  const dailyHours: Record<string, number> = {}

  for (const session of sessions) {
    if (!session.end_at) continue
    const s = new Date(session.start_at)
    if (s < start) continue
    const dateKey = s.toLocaleDateString('es')
    const hours = (new Date(session.end_at).getTime() - s.getTime()) / (1000 * 60 * 60)
    dailyHours[dateKey] = (dailyHours[dateKey] ?? 0) + hours
  }

  const data = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = d.toLocaleDateString('es')
    data.push({
      date: d.toLocaleDateString('es', { weekday: 'short', day: 'numeric' }),
      hours: Math.round((dailyHours[key] ?? 0) * 100) / 100,
    })
  }

  const hasData = data.some((d) => d.hours > 0)

  if (!hasData) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
        No hay sesiones de tiempo esta semana
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">Horas registradas</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="date" className="text-xs text-muted-foreground" />
          <YAxis className="text-xs text-muted-foreground" />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
            formatter={(value) => [`${String(value ?? '')} h`, 'Horas']}
          />
          <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
