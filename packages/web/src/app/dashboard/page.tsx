'use client'

import { useMemo } from 'react'

import {
  DayTimeline,
  SuggestedBlock,
  TimeFreeCard,
  DailyProgress,
  UpcomingEvents,
} from '@/components/dashboard'
import { Spinner } from '@/components/ui/spinner'
import { useRequireAuth } from '@/hooks/use-auth'
import { useEvents } from '@/hooks/use-events'
import { useTimeSessions } from '@/hooks/use-time-sessions'
import { useAuthStore } from '@/lib/auth-store'
import { calculateFreeTime } from '@/lib/time-utils'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { isLoading } = useRequireAuth()

  const eventsParams = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return { start: today.toISOString(), end: tomorrow.toISOString() }
  }, [])
  const { data: eventsData, isLoading: eventsLoading } = useEvents(eventsParams)
  const { data: sessions, isLoading: sessionsLoading } = useTimeSessions()

  if (isLoading || eventsLoading || sessionsLoading) return <Spinner />

  const events = eventsData?.items ?? []

  const { totalFreeMinutes } = calculateFreeTime(events, sessions ?? [])

  const todayName = new Date().toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Buenos días{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {todayName.charAt(0).toUpperCase() + todayName.slice(1)}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DayTimeline events={events} sessions={sessions ?? []} />
        </div>
        <div className="space-y-4">
          <TimeFreeCard totalFreeMinutes={totalFreeMinutes} />
          <DailyProgress completed={events.length} total={8} label="Eventos del día" />
          <SuggestedBlock events={events} sessions={sessions ?? []} />
          <UpcomingEvents events={events} />
        </div>
      </div>
    </div>
  )
}
