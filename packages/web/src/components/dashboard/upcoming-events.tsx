'use client'

import type { Event } from '@milestone/shared'

import { getEventDotColor, formatTime } from '@/lib/time-utils'
import { cn } from '@/lib/utils'

interface UpcomingEventsProps {
  events: Event[]
  max?: number
}

export function UpcomingEvents({ events, max = 4 }: UpcomingEventsProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Próximos eventos</h3>
        <p className="text-sm text-muted-foreground">No hay eventos hoy</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Próximos eventos</h3>
      <div className="space-y-2">
        {events.slice(0, max).map((event) => {
          const start = new Date(event.start_at)
          const end = new Date(event.end_at)
          const dotColor = getEventDotColor(event.type)

          return (
            <div key={event.id} className="flex items-center gap-3 text-sm">
              <span className={cn('h-2 w-2 flex-shrink-0 rounded-full', dotColor)} />
              <span className="w-16 flex-shrink-0 text-xs text-muted-foreground">
                {formatTime(start)}
              </span>
              <span className="font-medium">{event.title}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {Math.round((end.getTime() - start.getTime()) / 60000)}m
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
