'use client'

import type { Event, TimeSession } from '@milestone/shared'

import { calculateFreeTime, formatMinutes, formatTime, getLightEventColor } from '@/lib/time-utils'
import { cn } from '@/lib/utils'

interface DayTimelineProps {
  events: Event[]
  sessions: TimeSession[]
  date?: Date
  startHour?: number
  endHour?: number
}

export function DayTimeline({
  events,
  sessions,
  date,
  startHour = 6,
  endHour = 23,
}: DayTimelineProps) {
  const { busyBlocks, totalFreeMinutes } = calculateFreeTime(events, sessions, date)

  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)

  const now = new Date()

  const rangeStartMinutes = startHour * 60
  const rangeEndMinutes = endHour * 60
  const totalMinutes = rangeEndMinutes - rangeStartMinutes

  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const currentTop = ((currentMinutes - rangeStartMinutes) / totalMinutes) * 100

  function getBlockStyle(block: { start: Date; end: Date }) {
    const rangeStart = new Date(block.start)
    rangeStart.setHours(startHour, 0, 0, 0)

    const rangeEnd = new Date(block.start)
    rangeEnd.setHours(endHour, 0, 0, 0)

    const visibleStart = new Date(Math.max(block.start.getTime(), rangeStart.getTime()))

    const visibleEnd = new Date(Math.min(block.end.getTime(), rangeEnd.getTime()))

    const startOffset = (visibleStart.getTime() - rangeStart.getTime()) / 60000

    const duration = (visibleEnd.getTime() - visibleStart.getTime()) / 60000

    return {
      top: `${String((startOffset / totalMinutes) * 100)}%`,
      height: `${String(Math.max((duration / totalMinutes) * 100, 1.5))}%`,
    }
  }

  if (busyBlocks.length === 0 && totalFreeMinutes === 1440) {
    return (
      <div
        className="rounded-lg border bg-card p-6 text-center text-muted-foreground"
        role="status"
      >
        No hay eventos programados para hoy
      </div>
    )
  }

  return (
    <div
      className="rounded-lg border bg-card p-4"
      role="region"
      aria-label="Línea de tiempo del día"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Línea de tiempo del día</h3>

        <span className="text-sm text-muted-foreground">
          Tiempo libre: <strong>{formatMinutes(totalFreeMinutes)}</strong>
        </span>
      </div>

      <div className="relative flex" role="list" aria-label="Bloques de tiempo">
        {/* Horas */}
        <div className="w-14 flex-shrink-0 text-xs text-muted-foreground">
          {hours.map((hour) => (
            <div key={hour} className="flex h-12 items-start justify-end pr-2 leading-none">
              {`${String(hour).padStart(2, '0')}:00`}
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="relative flex-1">
          {/* Líneas horizontales */}
          <div className="absolute inset-0 border-l">
            {hours.map((hour) => (
              <div
                key={hour}
                className={cn(
                  'h-12 border-t',
                  hour % 3 === 0 ? 'border-border' : 'border-border/30',
                )}
              />
            ))}
          </div>

          {/* Eventos */}
          <div className="absolute inset-0">
            {busyBlocks
              .filter(
                (block) => block.end.getHours() >= startHour && block.start.getHours() <= endHour,
              )
              .map((block, index) => (
                <div
                  key={index}
                  role="listitem"
                  aria-label={`${block.title} de ${formatTime(
                    block.start,
                  )} a ${formatTime(block.end)}`}
                  className={cn(
                    'absolute left-1 right-1 z-10 overflow-hidden rounded-md border px-2 py-1 text-xs',
                    getLightEventColor(block.type),
                  )}
                  style={getBlockStyle(block)}
                >
                  <div className="truncate font-medium">{block.title}</div>

                  <div className="truncate opacity-75">
                    {formatTime(block.start)} - {formatTime(block.end)}
                  </div>
                </div>
              ))}
          </div>

          {/* Hora actual */}
          {currentTop >= 0 && currentTop <= 100 && date?.toDateString() === now.toDateString() && (
            <div
              className="absolute left-0 right-0 z-20 border-t-2 border-destructive"
              style={{
                top: `${String(currentTop)}%`,
              }}
            >
              <div className="-mt-2.5 ml-1 h-2 w-2 rounded-full bg-destructive" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
