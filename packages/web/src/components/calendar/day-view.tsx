'use client'

import {
  DndContext,
  type DragEndEvent,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { Event } from '@milestone/shared'
import { addDays, format, isSameDay, isToday } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { memo, useState } from 'react'

import { getEventDotColor, formatTime, snapToMinutes, detectConflicts } from '@/lib/time-utils'
import { cn } from '@/lib/utils'

interface DayViewProps {
  events: Event[]
  currentDate: Date
  onDateChange: (date: Date) => void
  onEventClick?: (event: Event) => void
  onEventMove?: (eventId: string, newStart: Date, newEnd: Date) => void
  onSlotClick?: (start: Date) => void
}

const START_HOUR = 6
const END_HOUR = 23
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR)
const HALF_HOURS = [0, 30]

const DraggableEvent = memo(function DraggableEvent({
  event,
  onEventClick,
}: {
  event: Event
  onEventClick?: (event: Event) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `event-${event.id}`,
    data: { event },
  })

  const start = new Date(event.start_at)
  const end = new Date(event.end_at)
  const dayStart = new Date(start)
  dayStart.setHours(START_HOUR, 0, 0, 0)
  const totalMs = (END_HOUR - START_HOUR) * 60 * 60 * 1000
  const top = ((start.getTime() - dayStart.getTime()) / totalMs) * 100
  const height = ((end.getTime() - start.getTime()) / totalMs) * 100

  const style: React.CSSProperties = {
    top: `${String(top)}%`,
    height: `${String(Math.max(height, 2))}%`,
    transform: transform
      ? `translate(${String(transform.x)}px, ${String(transform.y)}px)`
      : undefined,
    zIndex: isDragging ? 50 : 10,
  }

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onEventClick?.(event)}
      className={cn(
        'absolute left-1 right-1 overflow-hidden rounded-md border px-2 py-1 text-xs text-left transition-shadow hover:shadow-md cursor-grab active:cursor-grabbing',
        getEventDotColor(event.type).replace('bg-', 'bg-').replace('500', '100') +
          ' text-foreground',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-primary',
      )}
    >
      <div className="truncate font-medium">{event.title}</div>
      <div className="truncate opacity-75">
        {formatTime(start)} — {formatTime(end)}
      </div>
    </button>
  )
})

function TimeSlot({
  hour,
  minute,
  day,
  onSlotClick,
}: {
  hour: number
  minute: number
  day: Date
  onSlotClick?: (start: Date) => void
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${format(day, 'yyyy-MM-dd')}-${String(hour).padStart(2, '0')}-${String(minute).padStart(2, '0')}`,
    data: { hour, minute, day: format(day, 'yyyy-MM-dd') },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn('h-6 border-t border-border/20 transition-colors', isOver && 'bg-primary/10')}
    >
      <button
        type="button"
        onClick={() => {
          const slotDate = new Date(day)
          slotDate.setHours(hour, minute, 0, 0)
          onSlotClick?.(slotDate)
        }}
        className="h-full w-full hover:bg-accent/20 transition-colors"
        aria-label={`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`}
      />
    </div>
  )
}

export const DayView = memo(function DayView({
  events,
  currentDate,
  onDateChange,
  onEventClick,
  onEventMove,
  onSlotClick,
}: DayViewProps) {
  const [conflictWarning, setConflictWarning] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const dayEvents = events.filter((e) => isSameDay(new Date(e.start_at), currentDate))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const eventId = String(active.id).replace('event-', '')
    const slotData = over.data.current as { hour: number; minute: number; day: string } | undefined
    if (!slotData) return

    const draggedEvent = active.data.current?.event as Event | undefined
    if (!draggedEvent) return

    const originalStart = new Date(draggedEvent.start_at)
    const originalDuration = new Date(draggedEvent.end_at).getTime() - originalStart.getTime()

    const newStart = new Date(
      slotData.day +
        'T' +
        String(slotData.hour).padStart(2, '0') +
        ':' +
        String(slotData.minute).padStart(2, '0') +
        ':00',
    )
    const snappedStart = snapToMinutes(newStart, 15)
    const newEnd = new Date(snappedStart.getTime() + originalDuration)

    const { hasConflict, conflicting } = detectConflicts(
      events,
      snappedStart,
      newEnd,
      draggedEvent.id,
    )

    if (hasConflict) {
      setConflictWarning(`Conflicto con: ${conflicting.map((c) => c.title).join(', ')}`)
      setTimeout(() => {
        setConflictWarning(null)
      }, 4000)
      return
    }

    onEventMove?.(eventId, snappedStart, newEnd)
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onDateChange(addDays(currentDate, -1))
            }}
            className="rounded-md p-1 hover:bg-accent transition-colors"
            aria-label="Día anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold">
            {currentDate.toLocaleDateString('es', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </h2>
          <button
            onClick={() => {
              onDateChange(addDays(currentDate, 1))
            }}
            className="rounded-md p-1 hover:bg-accent transition-colors"
            aria-label="Día siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        {isToday(currentDate) && (
          <span className="text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium">
            Hoy
          </span>
        )}
      </div>

      {conflictWarning && (
        <div className="mx-4 mb-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {conflictWarning}
        </div>
      )}

      <div className="flex border-t">
        <div className="w-14 flex-shrink-0 border-r">
          <div className="h-6" />
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="flex h-12 items-start justify-end pr-2 text-[10px] text-muted-foreground leading-none"
            >
              {hour === 0 ? '' : `${String(hour).padStart(2, '0')}:00`}
            </div>
          ))}
        </div>

        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="relative flex-1">
            {HOURS.map((hour) => (
              <div key={hour} className="flex">
                {HALF_HOURS.map((minute) => (
                  <div key={`${String(hour)}-${String(minute)}`} className="flex-1">
                    <TimeSlot
                      hour={hour}
                      minute={minute}
                      day={currentDate}
                      onSlotClick={onSlotClick}
                    />
                  </div>
                ))}
              </div>
            ))}

            <div className="absolute inset-0 pointer-events-none" style={{ marginTop: 0 }}>
              {dayEvents.map((event) => (
                <DraggableEvent key={event.id} event={event} onEventClick={onEventClick} />
              ))}
            </div>
          </div>
        </DndContext>
      </div>
    </div>
  )
})
