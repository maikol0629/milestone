'use client'

import type { TimeSession } from '@milestone/shared'

interface ActivityStreakProps {
  sessions: TimeSession[]
}

function getColor(hours: number): string {
  if (hours === 0) return 'bg-gray-100 dark:bg-gray-800'
  if (hours < 2) return 'bg-green-200 dark:bg-green-900'
  if (hours < 4) return 'bg-green-400 dark:bg-green-700'
  return 'bg-green-600 dark:bg-green-500'
}

export function ActivityStreak({ sessions }: ActivityStreakProps) {
  const now = new Date()
  const dayHours: Record<string, number> = {}

  for (const session of sessions) {
    if (!session.end_at) continue
    const dateKey = new Date(session.start_at).toLocaleDateString('es')
    const hours =
      (new Date(session.end_at).getTime() - new Date(session.start_at).getTime()) / (1000 * 60 * 60)
    dayHours[dateKey] = (dayHours[dateKey] ?? 0) + hours
  }

  const days: { date: Date; hours: number }[] = []
  for (let i = 27; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = d.toLocaleDateString('es')
    days.push({ date: d, hours: dayHours[key] ?? 0 })
  }

  const weekLabels = ['', 'Lun', '', 'Mié', '', 'Vie', '']

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">Actividad (28 días)</h3>
      <div className="flex gap-1">
        <div className="mr-2 flex flex-col justify-around text-xs text-muted-foreground">
          {weekLabels.map((label, i) => (
            <span key={i} className="h-3 leading-3">
              {label}
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 4 }).map((_, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-1">
              {Array.from({ length: 7 }).map((__, dayIdx) => {
                const idx = weekIdx * 7 + dayIdx
                const day = days[idx]
                if (!day) return <div key={dayIdx} className="h-3 w-3" />
                return (
                  <div
                    key={dayIdx}
                    className={`h-3 w-3 rounded-sm ${getColor(day.hours)}`}
                    title={`${day.date.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'short' })}: ${String(Math.round(day.hours * 100) / 100)} h`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
        <span>Menos</span>
        <div className="h-3 w-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
        <div className="h-3 w-3 rounded-sm bg-green-200 dark:bg-green-900" />
        <div className="h-3 w-3 rounded-sm bg-green-400 dark:bg-green-700" />
        <div className="h-3 w-3 rounded-sm bg-green-600 dark:bg-green-500" />
        <span>Más</span>
      </div>
    </div>
  )
}
