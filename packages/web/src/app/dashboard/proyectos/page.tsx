'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import type { Project, Goal } from '@milestone/shared'
import { Pencil, Trash2 } from 'lucide-react'
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
import { useGoals } from '@/hooks/use-goals'
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from '@/hooks/use-projects'

const createProjectSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  goal_id: z.uuid('Objetivo inválido'),
})
type CreateProjectInput = z.infer<typeof createProjectSchema>

export default function ProjectsPage() {
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { isLoading: authLoading } = useRequireAuth()
  const { data: projects, isLoading, error } = useProjects()
  const { data: goals } = useGoals()
  const { data: activities } = useActivities()
  const create = useCreateProject()
  const update = useUpdateProject()
  const del = useDeleteProject()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema) as never,
    defaultValues: { name: '', goal_id: '' },
  })

  useEffect(() => {
    if (editId && projects) {
      const project = projects.find((p) => p.id === editId)
      if (project) {
        setValue('name', project.name)
        setValue('goal_id', project.goal_id)
      }
    }
  }, [editId, projects, setValue])

  function startEdit(project: Project) {
    setEditId(project.id)
    setValue('name', project.name)
    setValue('goal_id', project.goal_id)
  }

  function cancelEdit() {
    setEditId(null)
    reset({ name: '', goal_id: '' })
  }

  async function onSubmit(data: CreateProjectInput) {
    try {
      if (editId) {
        await update.mutateAsync({ id: editId, ...data })
        toast.success('Proyecto actualizado')
      } else {
        await create.mutateAsync(data)
        toast.success('Proyecto creado')
      }
      cancelEdit()
    } catch {
      toast.error(editId ? 'Error al actualizar proyecto' : 'Error al crear proyecto')
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await del.mutateAsync(deleteId)
      toast.success('Proyecto eliminado')
    } catch {
      toast.error('Error al eliminar proyecto')
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

  const activitiesByProject = (activities ?? []).reduce<Record<string, number>>((acc, a) => {
    acc[a.project_id] = (acc[a.project_id] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <PageHeader title="Proyectos" description="Organiza tu trabajo en proyectos concretos" />

      <form
        onSubmit={(e) => {
          void handleSubmit(onSubmit)(e)
        }}
        className="flex items-end gap-3 rounded-lg border bg-card p-4"
      >
        <FormField
          label={editId ? 'Editar proyecto' : 'Nuevo proyecto'}
          error={errors.name?.message}
          className="flex-[2]"
        >
          <Input
            placeholder="Ej: Crear app de fitness..."
            {...register('name')}
            hasError={!!errors.name}
          />
        </FormField>
        <FormField label="Objetivo" error={errors.goal_id?.message} className="flex-1">
          <Select
            options={(goals ?? []).map((g: Goal) => ({ value: g.id, label: g.title }))}
            placeholder="Seleccionar..."
            {...register('goal_id')}
            hasError={!!errors.goal_id}
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

      {projects?.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No hay proyectos"
          description="Crea el primero arriba vinculado a un objetivo."
        />
      ) : (
        <div className="space-y-2">
          {projects?.map((project, idx) => (
            <div
              key={project.id}
              className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
              style={{
                animation: 'fadeSlideIn 0.3s ease-out both',
                animationDelay: `${String(idx * 50)}ms`,
              }}
            >
              <div>
                <p className="font-medium">{project.name}</p>
                <div className="flex gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {(goals ?? []).find((g: Goal) => g.id === project.goal_id)?.title ?? '—'}
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {activitiesByProject[project.id] ?? 0} actividades
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    startEdit(project)
                  }}
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setDeleteId(project.id)
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
        title="Eliminar proyecto"
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
