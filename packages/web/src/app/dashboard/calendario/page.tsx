'use client'

import type { Event } from '@milestone/shared'
import { CalendarDays, List, Maximize2, PanelRightOpen } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { CalendarGrid } from '@/components/calendar/calendar-grid'
import { EventDialog } from '@/components/calendar/event-dialog'
import { EventForm } from '@/components/calendar/event-form'
import { WeekView } from '@/components/calendar/week-view'
import { WorkBlockForm } from '@/components/calendar/work-block-form'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { useActivities } from '@/hooks/use-activities'
import { useRequireAuth } from '@/hooks/use-auth'
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/use-events'
import { useExpandedEvents } from '@/hooks/use-expanded-events'
import { useLifeAreas } from '@/hooks/use-life-areas'
import { useProjects } from '@/hooks/use-projects'
import { getEventsRangeParams } from '@/lib/events-query'
import { cn } from '@/lib/utils'

const DayView = dynamic(
  () => import('@/components/calendar/day-view').then((m) => ({ default: m.DayView })),
  {
    ssr: false,
  },
)

type ViewMode = 'list' | 'month' | 'week' | 'day'
type FormMode = 'event' | 'work_block' | 'reminder' | null

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export default function CalendarPage() {
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [page] = useState(1)
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [dialogEvent, setDialogEvent] = useState<Event | null>(null)
  const [showForm, setShowForm] = useState<FormMode>(null)
  const limit = 50

  const isCalendarView = viewMode !== 'list'

  const eventsParams: Record<string, string | number | undefined> = useMemo(
    () =>
      viewMode === 'list'
        ? { page, limit }
        : getEventsRangeParams({ viewMode, currentDate, currentMonth }),
    [viewMode, currentDate, currentMonth, page, limit],
  )

  const { isLoading: authLoading } = useRequireAuth()
  const { data: listData, isLoading: listLoading } = useEvents(
    viewMode === 'list' ? eventsParams : undefined,
  )

  const rangeParams = useMemo(
    () =>
      isCalendarView ? (eventsParams as { start: string; end: string }) : { start: '', end: '' },
    [isCalendarView, eventsParams],
  )

  const { data: expandedData, isLoading: calendarLoading } = useExpandedEvents(
    isCalendarView ? rangeParams : { start: '', end: '' },
    isCalendarView,
  )

  const { data: areas } = useLifeAreas()
  const { data: projects } = useProjects()
  const { data: activities } = useActivities()
  const create = useCreateEvent()
  const update = useUpdateEvent()
  const del = useDeleteEvent()

  const events =
    viewMode === 'list'
      ? (listData?.items ?? [])
      : ((expandedData?.items ?? []) as unknown as Event[])

  async function handleEventMove(eventId: string, newStart: Date, newEnd: Date) {
    try {
      await update.mutateAsync({
        id: eventId,
        start_at: newStart.toISOString(),
        end_at: newEnd.toISOString(),
      })
      toast.success('Evento movido')
    } catch (error: unknown) {
      toast.error(errorMessage(error, 'Error al mover el evento'))
    }
  }

  async function handleCreateEvent(data: {
    title: string
    start_at: string
    end_at: string
    description?: string | null
    area_id?: string | null
    location?: string | null
    recurrence_rule?: string | null
    recurrence_interval?: number | null
    recurrence_days_of_week?: string | null
    recurrence_end_date?: string | null
  }) {
    try {
      await create.mutateAsync({
        title: data.title,
        start_at: data.start_at,
        end_at: data.end_at,
        type: 'event' as const,
        description: data.description ?? null,
        activity_id: null,
        recurrence_rule: (data.recurrence_rule ?? null) as 'daily' | 'weekly' | null,
        recurrence_interval: data.recurrence_interval ?? null,
        recurrence_days_of_week: data.recurrence_days_of_week ?? null,
        recurrence_end_date: data.recurrence_end_date ?? null,
      })
      toast.success('Evento creado')
      setShowForm(null)
    } catch (error: unknown) {
      toast.error(errorMessage(error, 'Error al crear evento'))
    }
  }

  async function handleCreateWorkBlock(data: {
    title: string
    type: 'work_block'
    activity_id: string | null
    duration_minutes: number
    priority: string
    start_at?: string | null
    end_at?: string | null
    recurrence_rule?: string | null
    recurrence_interval?: number | null
    recurrence_days_of_week?: string | null
    recurrence_end_date?: string | null
  }) {
    try {
      const now = new Date()
      const start = data.start_at ? new Date(data.start_at) : now
      const end = data.end_at
        ? new Date(data.end_at)
        : new Date(start.getTime() + data.duration_minutes * 60000)
      await create.mutateAsync({
        title: data.title,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        type: 'work_block' as const,
        activity_id: data.activity_id,
        recurrence_rule: (data.recurrence_rule ?? null) as 'daily' | 'weekly' | null,
        recurrence_interval: data.recurrence_interval ?? null,
        recurrence_days_of_week: data.recurrence_days_of_week ?? null,
        recurrence_end_date: data.recurrence_end_date ?? null,
      })
      toast.success('Bloque de trabajo creado')
      setShowForm(null)
    } catch (error: unknown) {
      toast.error(errorMessage(error, 'Error al crear bloque de trabajo'))
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await del.mutateAsync(deleteId)
      toast.success('Evento eliminado')
    } catch {
      toast.error('Error al eliminar evento')
    } finally {
      setDeleteId(null)
    }
  }

  function startEdit(event: Event) {
    setEditId(event.id)
    setShowForm('event')
  }

  const viewButtons: { mode: ViewMode; icon: typeof List; label: string }[] = [
    { mode: 'day', icon: Maximize2, label: 'Día' },
    { mode: 'week', icon: PanelRightOpen, label: 'Semana' },
    { mode: 'month', icon: CalendarDays, label: 'Mes' },
    { mode: 'list', icon: List, label: 'Lista' },
  ]

  const isLoading = viewMode === 'list' ? listLoading : calendarLoading

  if (authLoading || isLoading) return <Spinner />
  if (viewMode === 'list' && listData === undefined) return <Spinner />
  if (isCalendarView && expandedData === undefined) return <Spinner />

  const areaOptions = (areas ?? []).map((a) => ({ value: a.id, label: a.name }))
  const projectOptions = (projects ?? []).map((p) => ({ value: p.id, label: p.name }))
  const activityOptions = (activities ?? []).map((a) => ({ value: a.id, label: a.title }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendario"
        description="Gestiona tu tiempo con vistas interactivas"
        action={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border p-0.5">
              {viewButtons.map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => {
                    setViewMode(mode)
                  }}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    viewMode === mode
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="mr-1.5 inline-block h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowForm('event')
                }}
              >
                + Evento
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowForm('work_block')
                }}
              >
                + Bloque
              </Button>
            </div>
          </div>
        }
      />

      {showForm === 'event' && (
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">{editId ? 'Editar evento' : 'Nuevo evento'}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowForm(null)
                setEditId(null)
              }}
            >
              Cerrar
            </Button>
          </div>
          <EventForm
            areas={areaOptions}
            projects={projectOptions}
            onSubmit={(data) => {
              void handleCreateEvent(data)
            }}
            onCancel={() => {
              setShowForm(null)
              setEditId(null)
            }}
          />
        </div>
      )}

      {showForm === 'work_block' && (
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Nuevo bloque de trabajo</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowForm(null)
              }}
            >
              Cerrar
            </Button>
          </div>
          <WorkBlockForm
            projects={projectOptions}
            activities={activityOptions.map((a) => ({ ...a, value: a.value }))}
            onSubmit={(data) => {
              void handleCreateWorkBlock(data)
            }}
            onCancel={() => {
              setShowForm(null)
            }}
          />
        </div>
      )}

      {viewMode === 'month' && (
        <CalendarGrid
          events={events}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          onEventClick={(event) => {
            setDialogEvent(event)
          }}
          onDateClick={(date) => {
            setCurrentDate(date)
            setViewMode('day')
          }}
        />
      )}

      {viewMode === 'week' && (
        <WeekView
          events={events}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onEventClick={(event) => {
            setDialogEvent(event)
          }}
          onSlotClick={(start) => {
            setCurrentDate(start)
            setViewMode('day')
          }}
        />
      )}

      {viewMode === 'day' && (
        <DayView
          events={events}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onEventClick={(event) => {
            setDialogEvent(event)
          }}
          onEventMove={(id, start, end) => {
            void handleEventMove(id, start, end)
          }}
          onSlotClick={() => {
            setShowForm('event')
          }}
        />
      )}

      {viewMode === 'list' &&
        (events.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No hay eventos"
            description="Crea el primero para gestionar tu tiempo."
          />
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full',
                      event.type === 'event' && 'bg-blue-500',
                      event.type === 'reminder' && 'bg-amber-500',
                      event.type === 'work_block' && 'bg-purple-500',
                    )}
                  />
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.start_at).toLocaleDateString('es', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      —{' '}
                      {new Date(event.end_at).toLocaleDateString('es', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {event.type === 'event' && 'Evento'}
                    {event.type === 'reminder' && 'Recordatorio'}
                    {event.type === 'work_block' && 'Bloque'}
                  </span>
                  <button
                    onClick={() => {
                      startEdit(event)
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      setDeleteId(event.id)
                    }}
                    className="text-sm text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}

      <EventDialog
        event={dialogEvent}
        open={!!dialogEvent}
        onClose={() => {
          setDialogEvent(null)
        }}
        onEdit={(event) => {
          startEdit(event)
          setViewMode('list')
        }}
        onDelete={(id) => {
          setDeleteId(id)
          setDialogEvent(null)
        }}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Eliminar evento"
        message="¿Estás seguro? Esta acción no se puede deshacer."
        onConfirm={() => {
          void handleDelete()
        }}
        onCancel={() => {
          setDeleteId(null)
        }}
      />
    </div>
  )
}
