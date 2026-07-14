'use client'

import type { Event } from '@milestone/shared'
import { addDays, eachDayOfInterval, endOfWeek, format, isToday, startOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { memo } from 'react'

import { getEventDotColor, formatTime } from '@/lib/time-utils'
import { cn } from '@/lib/utils'

interface WeekViewProps {
  events: Event[]
  currentDate: Date
  onDateChange: (date: Date) => void
  onEventClick?: (event: Event) => void
  onSlotClick?: (start: Date) => void
}

const START_HOUR = 6
const END_HOUR = 23
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR)

export const WeekView = memo(function WeekView({
  events,
  currentDate,
  onDateChange,
  onEventClick,
  onSlotClick,
}: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const eventsByDay = new Map<string, Event[]>()
  for (const event of events) {
    const dayKey = format(new Date(event.start_at), 'yyyy-MM-dd')
    const existing = eventsByDay.get(dayKey)
    if (existing) existing.push(event)
    else eventsByDay.set(dayKey, [event])
  }

  function getEventStyle(event: Event) {
    const start = new Date(event.start_at)
    const end = new Date(event.end_at)
    const dayStart = new Date(start)
    dayStart.setHours(START_HOUR, 0, 0, 0)
    const totalMs = (END_HOUR - START_HOUR) * 60 * 60 * 1000
    const top = ((start.getTime() - dayStart.getTime()) / totalMs) * 100
    const height = ((end.getTime() - start.getTime()) / totalMs) * 100
    return { top: `${String(top)}%`, height: `${String(Math.max(height, 1.5))}%` }
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onDateChange(addDays(currentDate, -7))
            }}
            className="rounded-md p-1 hover:bg-accent transition-colors"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold">
            {weekStart.toLocaleDateString('es', { day: 'numeric', month: 'long' })} —{' '}
            {weekEnd.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={() => {
              onDateChange(addDays(currentDate, 7))
            }}
            className="rounded-md p-1 hover:bg-accent transition-colors"
            aria-label="Semana siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex border-t">
        <div className="w-14 flex-shrink-0 border-r">
          <div className="h-10" />
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="flex h-12 items-start justify-end pr-2 pt-0 text-[10px] text-muted-foreground"
            >
              {hour === 0 ? '' : `${String(hour).padStart(2, '0')}:00`}
            </div>
          ))}
        </div>

        {days.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd')
          const dayEvents = eventsByDay.get(dayKey) ?? []
          const isTodayDate = isToday(day)

          return (
            <div key={dayKey} className="flex-1 border-r last:border-r-0">
              <div
                className={cn(
                  'flex items-center justify-center border-b py-2 text-sm',
                  isTodayDate && 'bg-primary/5',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm',
                    isTodayDate && 'bg-primary text-primary-foreground font-semibold',
                  )}
                >
                  {day.toLocaleDateString('es', { weekday: 'short', day: 'numeric' })}
                </span>
              </div>

              <div className="relative">
                {HOURS.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => {
                      const slotDate = new Date(day)
                      slotDate.setHours(hour, 0, 0, 0)
                      onSlotClick?.(slotDate)
                    }}
                    className="h-12 w-full border-t border-border/30 hover:bg-accent/20 transition-colors"
                    aria-label={`${day.toLocaleDateString('es', { weekday: 'long', day: 'numeric' })} ${String(hour).padStart(2, '0')}:00`}
                  />
                ))}

                <div className="absolute inset-0 pointer-events-none">
                  {dayEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => onEventClick?.(event)}
                      className={cn(
                        'absolute left-0.5 right-0.5 z-10 overflow-hidden rounded border px-1 py-0.5 text-left text-[11px] leading-tight transition-opacity hover:opacity-80 pointer-events-auto',
                        getEventDotColor(event.type).replace('bg-', 'bg-').replace('500', '200') +
                          ' text-foreground border-' +
                          getEventDotColor(event.type).replace('bg-', ''),
                      )}
                      style={getEventStyle(event)}
                    >
                      <div className="truncate font-medium">{event.title}</div>
                      <div className="truncate opacity-75">
                        {formatTime(new Date(event.start_at))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})
