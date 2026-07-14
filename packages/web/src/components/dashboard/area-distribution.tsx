'use client'

import type { LifeArea, Goal, Project, Activity, TimeSession } from '@milestone/shared'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface AreaDistributionProps {
  areas: LifeArea[]
  goals: Goal[]
  projects: Project[]
  activities: Activity[]
  sessions: TimeSession[]
}

const DEFAULT_COLORS = [
  '#3b82f6',
  '#ef4444',
  '#22c55e',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
]

export function AreaDistribution({
  areas,
  goals,
  projects,
  activities,
  sessions,
}: AreaDistributionProps) {
  const activityMap = new Map(activities.map((a) => [a.id, a]))
  const projectMap = new Map(projects.map((p) => [p.id, p]))
  const goalMap = new Map(goals.map((g) => [g.id, g]))
  const areaMap = new Map(areas.map((a) => [a.id, a]))

  const areaHours: Record<string, { name: string; hours: number; color: string }> = {}

  for (const session of sessions) {
    if (!session.end_at) continue
    const activity = activityMap.get(session.activity_id)
    if (!activity) continue
    const project = projectMap.get(activity.project_id)
    if (!project) continue
    const goal = goalMap.get(project.goal_id)
    if (!goal) continue
    const area = areaMap.get(goal.life_area_id)
    if (!area) continue

    const hours =
      (new Date(session.end_at).getTime() - new Date(session.start_at).getTime()) / (1000 * 60 * 60)

    areaHours[area.id] ??= { name: area.name, hours: 0, color: area.color ?? '' }
    const entry = areaHours[area.id]
    if (entry) entry.hours += hours
  }

  const entries = Object.values(areaHours)
  const data = entries.map((item, i) => ({
    name: item.name,
    hours: Math.round(item.hours * 100) / 100,
    color: item.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }))

  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
        No hay datos de distribución
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">Distribución por área</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="hours"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={50}
            label={(props) =>
              `${props.name ?? ''}: ${String((props.payload as Record<string, unknown>).hours)}h`
            }
          >
            {/* eslint-disable @typescript-eslint/no-deprecated */}
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
            {/* eslint-enable @typescript-eslint/no-deprecated */}
          </Pie>
          <Tooltip formatter={(value) => [`${String(value ?? '')} h`, 'Horas']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
