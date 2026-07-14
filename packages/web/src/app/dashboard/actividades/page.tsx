'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import type { Activity, Project } from '@milestone/shared'
import { Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { FormField, Input, Select } from '@/components/ui/form-field'
import { Spinner } from '@/components/ui/spinner'
import {
  useActivities,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
} from '@/hooks/use-activities'
import { useRequireAuth } from '@/hooks/use-auth'
import { useProjects } from '@/hooks/use-projects'

const createActivitySchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200),
  project_id: z.uuid('Proyecto inválido'),
})
type CreateActivityInput = z.infer<typeof createActivitySchema>

export default function ActivitiesPage() {
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { isLoading: authLoading } = useRequireAuth()
  const { data: activities, isLoading, error } = useActivities()
  const { data: projects } = useProjects()
  const create = useCreateActivity()
  const update = useUpdateActivity()
  const del = useDeleteActivity()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateActivityInput>({
    resolver: zodResolver(createActivitySchema) as never,
    defaultValues: { title: '', project_id: '' },
  })

  useEffect(() => {
    if (editId && activities) {
      const activity = activities.find((a) => a.id === editId)
      if (activity) {
        setValue('title', activity.title)
        setValue('project_id', activity.project_id)
      }
    }
  }, [editId, activities, setValue])

  function startEdit(activity: Activity) {
    setEditId(activity.id)
    setValue('title', activity.title)
    setValue('project_id', activity.project_id)
  }

  function cancelEdit() {
    setEditId(null)
    reset({ title: '', project_id: '' })
  }

  async function onSubmit(data: CreateActivityInput) {
    try {
      if (editId) {
        await update.mutateAsync({ id: editId, ...data })
        toast.success('Actividad actualizada')
      } else {
        await create.mutateAsync(data)
        toast.success('Actividad creada')
      }
      cancelEdit()
    } catch {
      toast.error(editId ? 'Error al actualizar actividad' : 'Error al crear actividad')
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await del.mutateAsync(deleteId)
      toast.success('Actividad eliminada')
    } catch {
      toast.error('Error al eliminar actividad')
    } finally {
      setDeleteId(null)
    }
  }

  if (authLoading || isLoading) return <Spinner />
  if (error)
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-destructive">
        Error: {error.message}
      </div>
    )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Actividades"
        description="Tareas y acciones concretas dentro de tus proyectos"
      />

      <form
        onSubmit={(e) => {
          void handleSubmit(onSubmit)(e)
        }}
        className="flex items-end gap-3 rounded-lg border bg-card p-4"
      >
        <FormField
          label={editId ? 'Editar actividad' : 'Nueva actividad'}
          error={errors.title?.message}
          className="flex-[2]"
        >
          <Input
            placeholder="Ej: Diseñar landing page..."
            {...register('title')}
            hasError={!!errors.title}
          />
        </FormField>
        <FormField label="Proyecto" error={errors.project_id?.message} className="flex-1">
          <Select
            options={(projects ?? []).map((p: Project) => ({ value: p.id, label: p.name }))}
            placeholder="Seleccionar..."
            {...register('project_id')}
            hasError={!!errors.project_id}
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

      {activities?.length === 0 ? (
        <EmptyState
          icon="✅"
          title="No hay actividades"
          description="Crea la primera arriba vinculada a un proyecto."
        />
      ) : (
        <div className="space-y-2">
          {activities?.map((activity, idx) => (
            <div
              key={activity.id}
              className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
              style={{
                animation: 'fadeSlideIn 0.3s ease-out both',
                animationDelay: `${String(idx * 50)}ms`,
              }}
            >
              <div>
                <p className="font-medium">{activity.title}</p>
                <p className="text-xs text-muted-foreground">
                  {(projects ?? []).find((p: Project) => p.id === activity.project_id)?.name ?? '—'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    startEdit(activity)
                  }}
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setDeleteId(activity.id)
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
        title="Eliminar actividad"
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
