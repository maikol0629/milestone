'use client'

import type { Event } from '@milestone/shared'
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { memo } from 'react'

import { cn } from '@/lib/utils'

interface CalendarGridProps {
  events: Event[]
  currentMonth: Date
  onMonthChange: (date: Date) => void
  onEventClick?: (event: Event) => void
  onDateClick?: (date: Date) => void
}

const EVENT_COLORS: Record<string, string> = {
  meeting: 'bg-blue-500',
  event: 'bg-blue-500',
  task: 'bg-green-500',
  reminder: 'bg-amber-500',
  focus: 'bg-purple-500',
  work_block: 'bg-purple-500',
}

const DAY_HEADERS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export const CalendarGrid = memo(function CalendarGrid({
  events,
  currentMonth,
  onMonthChange,
  onEventClick,
  onDateClick,
}: CalendarGridProps) {
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const eventsByDay = new Map<string, Event[]>()
  for (const event of events) {
    const dayKey = format(new Date(event.start_at), 'yyyy-MM-dd')
    const existing = eventsByDay.get(dayKey)
    if (existing) {
      existing.push(event)
    } else {
      eventsByDay.set(dayKey, [event])
    }
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => {
            onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
          }}
          aria-label="Mes anterior"
          className="rounded-md p-1 hover:bg-accent transition-colors"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <h2 className="text-lg font-semibold capitalize">
          {currentMonth.toLocaleDateString('es', { month: 'long', year: 'numeric' })}
        </h2>
        <button
          onClick={() => {
            onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
          }}
          aria-label="Mes siguiente"
          className="rounded-md p-1 hover:bg-accent transition-colors"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-7 border-t">
        {DAY_HEADERS.map((day) => (
          <div
            key={day}
            className="border-r border-b bg-muted/50 px-2 py-2 text-center text-xs font-medium text-muted-foreground last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dayKey = format(day, 'yyyy-MM-dd')
          const dayEvents = eventsByDay.get(dayKey) ?? []
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isTodayDate = isToday(day)

          return (
            <button
              key={dayKey}
              type="button"
              onClick={() => onDateClick?.(day)}
              aria-label="Ir al día"
              className={cn(
                'min-h-[100px] border-r border-b p-1.5 text-left transition-colors hover:bg-accent/50',
                idx % 7 === 6 && 'border-r-0',
                !isCurrentMonth && 'bg-muted/20',
              )}
            >
              <span
                className={cn(
                  'inline-flex h-6 w-6 items-center justify-center rounded-full text-sm',
                  isTodayDate && 'bg-primary text-primary-foreground font-semibold',
                  !isTodayDate && !isCurrentMonth && 'text-muted-foreground',
                )}
              >
                {day.getDate()}
              </span>

              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    role="button"
                    tabIndex={0}
                    aria-label="Ver evento"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick?.(event)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.stopPropagation()
                        onEventClick?.(event)
                      }
                    }}
                    className={cn(
                      'cursor-pointer rounded px-1 py-0.5 text-xs truncate text-white',
                      EVENT_COLORS[event.type] ?? 'bg-gray-500',
                    )}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="px-1 text-xs text-muted-foreground">
                    +{dayEvents.length - 3} m&aacute;s
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
})
