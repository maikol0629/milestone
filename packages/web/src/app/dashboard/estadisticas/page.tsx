'use client'

import { TimeChart, AreaDistribution, ActivityStreak } from '@/components/dashboard'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { useActivities } from '@/hooks/use-activities'
import { useRequireAuth } from '@/hooks/use-auth'
import { useGoals } from '@/hooks/use-goals'
import { useLifeAreas } from '@/hooks/use-life-areas'
import { useProjects } from '@/hooks/use-projects'
import { useTimeSessions } from '@/hooks/use-time-sessions'

function totalHours(sessions: { start_at: string; end_at: string | null }[]): string {
  const ms = sessions
    .filter((s): s is { start_at: string; end_at: string } => s.end_at !== null)
    .reduce((sum, s) => sum + (new Date(s.end_at).getTime() - new Date(s.start_at).getTime()), 0)
  return (ms / 3600000).toFixed(1)
}

export default function EstadisticasPage() {
  const { isLoading: authLoading } = useRequireAuth()
  const { data: sessions, isLoading } = useTimeSessions()
  const { data: areas } = useLifeAreas()
  const { data: goals } = useGoals()
  const { data: projects } = useProjects()
  const { data: activities } = useActivities()

  if (authLoading || isLoading) return <Spinner />

  if (!sessions || sessions.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Estadísticas" description="Analiza cómo estás usando tu tiempo" />
        <EmptyState
          icon="📊"
          title="No hay datos suficientes"
          description="Registra sesiones de tiempo para ver estadísticas."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Estadísticas" description="Analiza cómo estás usando tu tiempo" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total de sesiones</p>
            <p className="text-2xl font-bold">{sessions.length}</p>
          </div>
        </div>
        <div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Horas registradas</p>
            <p className="text-2xl font-bold">{totalHours(sessions)}</p>
          </div>
        </div>
        <div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Sesiones activas</p>
            <p className="text-2xl font-bold">{sessions.filter((s) => !s.end_at).length}</p>
          </div>
        </div>
      </div>

      {sessions.length > 0 && <TimeChart sessions={sessions} />}

      {areas && areas.length > 0 && (
        <AreaDistribution
          areas={areas}
          goals={goals ?? []}
          projects={projects ?? []}
          activities={activities ?? []}
          sessions={sessions}
        />
      )}

      <ActivityStreak sessions={sessions} />
    </div>
  )
}
