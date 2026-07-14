'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import type { LifeArea, Goal } from '@milestone/shared'
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
import { useRequireAuth } from '@/hooks/use-auth'
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from '@/hooks/use-goals'
import { useLifeAreas } from '@/hooks/use-life-areas'
import { useProjects } from '@/hooks/use-projects'

const createGoalSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200),
  description: z.string().nullable().optional(),
  life_area_id: z.uuid('Área de vida inválida'),
})
type CreateGoalInput = z.infer<typeof createGoalSchema>

export default function GoalsPage() {
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { isLoading: authLoading } = useRequireAuth()
  const { data: goals, isLoading, error } = useGoals()
  const { data: areas } = useLifeAreas()
  const { data: projects } = useProjects()
  const create = useCreateGoal()
  const update = useUpdateGoal()
  const del = useDeleteGoal()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateGoalInput>({
    resolver: zodResolver(createGoalSchema) as never,
    defaultValues: { title: '', life_area_id: '' },
  })

  useEffect(() => {
    if (editId && goals) {
      const goal = goals.find((g) => g.id === editId)
      if (goal) {
        setValue('title', goal.title)
        setValue('life_area_id', goal.life_area_id)
      }
    }
  }, [editId, goals, setValue])

  function startEdit(goal: Goal) {
    setEditId(goal.id)
    setValue('title', goal.title)
    setValue('life_area_id', goal.life_area_id)
  }

  function cancelEdit() {
    setEditId(null)
    reset({ title: '', life_area_id: '' })
  }

  async function onSubmit(data: CreateGoalInput) {
    try {
      if (editId) {
        await update.mutateAsync({ id: editId, ...data })
        toast.success('Objetivo actualizado')
      } else {
        await create.mutateAsync(data)
        toast.success('Objetivo creado')
      }
      cancelEdit()
    } catch {
      toast.error(editId ? 'Error al actualizar objetivo' : 'Error al crear objetivo')
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await del.mutateAsync(deleteId)
      toast.success('Objetivo eliminado')
    } catch {
      toast.error('Error al eliminar objetivo')
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

  const areaColorMap = new Map((areas ?? []).map((a: LifeArea) => [a.id, a.color ?? '#6366f1']))
  const projectsByGoal = (projects ?? []).reduce<Record<string, number>>((acc, p) => {
    acc[p.goal_id] = (acc[p.goal_id] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <PageHeader title="Objetivos" description="Define tus metas y asocialas a un área vital" />

      <form
        onSubmit={(e) => {
          void handleSubmit(onSubmit)(e)
        }}
        className="flex items-end gap-3 rounded-lg border bg-card p-4"
      >
        <FormField
          label={editId ? 'Editar objetivo' : 'Nuevo objetivo'}
          error={errors.title?.message}
          className="flex-[2]"
        >
          <Input
            placeholder="Ej: Mejorar mi salud física..."
            {...register('title')}
            hasError={!!errors.title}
          />
        </FormField>
        <FormField label="Área vital" error={errors.life_area_id?.message} className="flex-1">
          <Select
            options={(areas ?? []).map((a: LifeArea) => ({ value: a.id, label: a.name }))}
            placeholder="Seleccionar..."
            {...register('life_area_id')}
            hasError={!!errors.life_area_id}
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

      {goals?.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="No hay objetivos"
          description="Crea el primero arriba para empezar a definir tus metas."
        />
      ) : (
        <div className="space-y-2">
          {goals?.map((goal, idx) => (
            <div
              key={goal.id}
              className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
              style={{
                animation: 'fadeSlideIn 0.3s ease-out both',
                animationDelay: `${String(idx * 50)}ms`,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-1 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: areaColorMap.get(goal.life_area_id) ?? '#6366f1' }}
                />
                <div>
                  <p className="font-medium">{goal.title}</p>
                  <div className="flex gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {(areas ?? []).find((a: LifeArea) => a.id === goal.life_area_id)?.name ?? '—'}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {projectsByGoal[goal.id] ?? 0} proyectos
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    startEdit(goal)
                  }}
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setDeleteId(goal.id)
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
        title="Eliminar objetivo"
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
