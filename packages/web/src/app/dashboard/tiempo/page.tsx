'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import type { TimeSession, Activity } from '@milestone/shared'
import { Play, Square, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { FormField, Input, Select } from '@/components/ui/form-field'
import { Spinner } from '@/components/ui/spinner'
import { useActivities } from '@/hooks/use-activities'
import { useRequireAuth } from '@/hooks/use-auth'
import {
  useTimeSessions,
  useCreateTimeSession,
  useUpdateTimeSession,
  useDeleteTimeSession,
} from '@/hooks/use-time-sessions'
import { cn, toDatetimeLocal, formatDuration } from '@/lib/utils'

const createTimeSessionSchema = z.object({
  start_at: z.iso.datetime('Fecha de inicio inválida'),
  end_at: z.iso.datetime().nullable().optional(),
  activity_id: z.uuid('Actividad inválida'),
})
type CreateTimeSessionInput = z.infer<typeof createTimeSessionSchema>

export default function TimeSessionsPage() {
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [quickActivityId, setQuickActivityId] = useState('')
  const { isLoading: authLoading } = useRequireAuth()
  const { data: sessions, isLoading, error } = useTimeSessions()
  const { data: activities } = useActivities()
  const create = useCreateTimeSession()
  const update = useUpdateTimeSession()
  const del = useDeleteTimeSession()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateTimeSessionInput>({
    resolver: zodResolver(createTimeSessionSchema) as never,
    defaultValues: { start_at: '', end_at: null, activity_id: '' },
  })

  useEffect(() => {
    if (editId && sessions) {
      const session = sessions.find((s) => s.id === editId)
      if (session) {
        setValue('start_at', toDatetimeLocal(session.start_at))
        setValue('end_at', session.end_at ? toDatetimeLocal(session.end_at) : null)
        setValue('activity_id', session.activity_id)
      }
    }
  }, [editId, sessions, setValue])

  function startEdit(session: TimeSession) {
    setEditId(session.id)
    setValue('start_at', session.start_at)
    setValue('end_at', session.end_at)
    setValue('activity_id', session.activity_id)
  }

  function cancelEdit() {
    setEditId(null)
    reset({ start_at: '', end_at: null, activity_id: '' })
  }

  async function onSubmit(data: CreateTimeSessionInput) {
    try {
      if (editId) {
        await update.mutateAsync({ id: editId, ...data })
        toast.success('Sesión actualizada')
      } else {
        await create.mutateAsync(data)
        toast.success('Sesión registrada')
      }
      cancelEdit()
    } catch {
      toast.error(editId ? 'Error al actualizar sesión' : 'Error al registrar sesión')
    }
  }

  async function stopSession(id: string, _start: string) {
    try {
      await update.mutateAsync({ id, end_at: new Date().toISOString() })
      toast.success('Sesión detenida')
    } catch {
      toast.error('Error al detener sesión')
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await del.mutateAsync(deleteId)
      toast.success('Sesión eliminada')
    } catch {
      toast.error('Error al eliminar sesión')
    } finally {
      setDeleteId(null)
    }
  }

  async function quickStartSession(activityId: string) {
    try {
      await create.mutateAsync({
        start_at: new Date().toISOString(),
        end_at: null,
        activity_id: activityId,
      })
      setQuickActivityId('')
      toast.success('Sesión iniciada')
    } catch {
      toast.error('Error al iniciar sesión')
    }
  }

  const activeSession = sessions?.find((s) => !s.end_at)

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 86400000)
  const weeklySessions = (sessions ?? []).filter((s) => new Date(s.start_at) >= weekAgo)
  const weeklyMinutes = weeklySessions.reduce((sum, s) => {
    const start = new Date(s.start_at)
    const end = s.end_at ? new Date(s.end_at) : now
    return sum + (end.getTime() - start.getTime()) / 60000
  }, 0)

  if (authLoading || isLoading) return <Spinner />
  if (error)
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-destructive">
        Error: {error.message}
      </div>
    )

  const activityMap = new Map((activities ?? []).map((a: Activity) => [a.id, a.title]))

  return (
    <div className="space-y-6">
      <PageHeader title="Tiempo" description="Registra sesiones de trabajo en tus actividades" />

      {activeSession ? (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3">
                <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="inline-flex h-3 w-3 rounded-full bg-green-500" />
              </span>
              <div>
                <p className="font-medium">Sesión activa</p>
                <p className="text-xs text-muted-foreground">
                  {activityMap.get(activeSession.activity_id) ?? 'Actividad'} &middot;{' '}
                  {formatDuration(activeSession.start_at, null)}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                void stopSession(activeSession.id, activeSession.start_at)
              }}
              disabled={update.isPending}
            >
              <Square className="mr-2 h-4 w-4" />
              Detener
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={quickActivityId}
              onChange={(e) => {
                setQuickActivityId(e.target.value)
              }}
            >
              <option value="">Seleccionar actividad...</option>
              {(activities ?? []).map((a: Activity) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
            <Button
              onClick={() => {
                if (quickActivityId) void quickStartSession(quickActivityId)
              }}
              disabled={!quickActivityId || create.isPending}
            >
              <Play className="mr-2 h-4 w-4" />
              Iniciar sesión
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Resumen semanal</h3>
          <p className="text-3xl font-bold">
            {Math.round(weeklyMinutes / 60)}
            <span className="text-lg font-normal text-muted-foreground">h </span>
            {Math.round(weeklyMinutes % 60)}
            <span className="text-lg font-normal text-muted-foreground">m</span>
          </p>
          <p className="text-xs text-muted-foreground">registradas esta semana</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: String(Math.min((weeklyMinutes / (40 * 60)) * 100, 100)) + '%' }}
            />
          </div>
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {Math.round((weeklyMinutes / (40 * 60)) * 100)}% de 40h semanales
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Línea de tiempo</h3>
          {sessions?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay sesiones registradas</p>
          ) : (
            <div className="space-y-2">
              {(sessions ?? []).slice(0, 5).map((session) => {
                const start = new Date(session.start_at)
                const end = session.end_at ? new Date(session.end_at) : now
                const durationMinutes = (end.getTime() - start.getTime()) / 60000
                return (
                  <div key={session.id} className="flex items-center gap-3 text-sm">
                    <div
                      className={cn(
                        'h-8 w-1 flex-shrink-0 rounded-full',
                        session.end_at ? 'bg-primary' : 'bg-green-500',
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">
                        {activityMap.get(session.activity_id) ?? 'Actividad'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {start.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                        {session.end_at && (
                          <>
                            {' '}
                            — {end.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                          </>
                        )}
                        {!session.end_at && ' (en curso)'}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(durationMinutes)}m
                    </span>
                    {!session.end_at && (
                      <Badge variant="outline" className="text-[10px]">
                        Activo
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          void handleSubmit(onSubmit)(e)
        }}
        className="flex items-end gap-3 rounded-lg border bg-card p-4"
      >
        <FormField label="Inicio" error={errors.start_at?.message} className="flex-1">
          <Input
            type="datetime-local"
            {...register('start_at', {
              setValueAs: (v: string) => (v ? new Date(v).toISOString() : ''),
            })}
            hasError={!!errors.start_at}
          />
        </FormField>
        <FormField label="Fin (opcional)" error={errors.end_at?.message} className="flex-1">
          <Input
            type="datetime-local"
            {...register('end_at', {
              setValueAs: (v: string) => (v ? new Date(v).toISOString() : null),
            })}
          />
        </FormField>
        <FormField label="Actividad" error={errors.activity_id?.message} className="flex-1">
          <Select
            options={(activities ?? []).map((a: Activity) => ({ value: a.id, label: a.title }))}
            placeholder="Seleccionar..."
            {...register('activity_id')}
            hasError={!!errors.activity_id}
          />
        </FormField>
        <div className="flex gap-2">
          {editId && (
            <Button type="button" variant="outline" onClick={cancelEdit}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={create.isPending || update.isPending}>
            {editId ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>

      {sessions?.length === 0 ? (
        <EmptyState
          icon="⏱"
          title="No hay sesiones de tiempo"
          description="Registra la primera arriba para empezar a medir tu trabajo."
        />
      ) : (
        <div className="space-y-2">
          {sessions?.map((session, idx) => (
            <div
              key={session.id}
              className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
              style={{
                animation: 'fadeSlideIn 0.3s ease-out both',
                animationDelay: `${String(idx * 50)}ms`,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'h-10 w-1 flex-shrink-0 rounded-full',
                    session.end_at ? 'bg-primary' : 'bg-green-500',
                  )}
                />
                <div>
                  <p className="font-medium">
                    {activityMap.get(session.activity_id) ?? 'Actividad'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(session.start_at).toLocaleDateString('es', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {session.end_at && (
                      <>
                        {' '}
                        —{' '}
                        {new Date(session.end_at).toLocaleDateString('es', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {formatDuration(session.start_at, session.end_at)}
                  {!session.end_at && ' (en curso)'}
                </span>
                {!session.end_at && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void stopSession(session.id, session.start_at)
                    }}
                    disabled={update.isPending}
                  >
                    <Square className="mr-1 h-3 w-3" />
                    Detener
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    startEdit(session)
                  }}
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setDeleteId(session.id)
                  }}
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Eliminar sesión"
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
