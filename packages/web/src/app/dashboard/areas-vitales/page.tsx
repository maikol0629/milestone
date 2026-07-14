'use client'

import { zodResolver } from '@hookform/resolvers/zod'
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
import { FormField, Input } from '@/components/ui/form-field'
import { Spinner } from '@/components/ui/spinner'
import { useRequireAuth } from '@/hooks/use-auth'
import { useGoals } from '@/hooks/use-goals'
import {
  useLifeAreas,
  useCreateLifeArea,
  useUpdateLifeArea,
  useDeleteLifeArea,
} from '@/hooks/use-life-areas'

const createLifeAreaSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  color: z.string().nullable().optional(),
})
type CreateLifeAreaInput = z.infer<typeof createLifeAreaSchema>

export default function LifeAreasPage() {
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { isLoading: authLoading } = useRequireAuth()
  const { data: areas, isLoading, error } = useLifeAreas()
  const { data: goals } = useGoals()
  const create = useCreateLifeArea()
  const update = useUpdateLifeArea()
  const del = useDeleteLifeArea()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateLifeAreaInput>({
    resolver: zodResolver(createLifeAreaSchema) as never,
    defaultValues: { name: '', color: null },
  })

  useEffect(() => {
    if (editId && areas) {
      const area = areas.find((a) => a.id === editId)
      if (area) {
        setValue('name', area.name)
        setValue('color', area.color)
      }
    }
  }, [editId, areas, setValue])

  function startEdit(area: { id: string; name: string; color: string | null }) {
    setEditId(area.id)
    setValue('name', area.name)
    setValue('color', area.color)
  }

  function cancelEdit() {
    setEditId(null)
    reset({ name: '', color: null })
  }

  async function onSubmit(data: CreateLifeAreaInput) {
    try {
      if (editId) {
        await update.mutateAsync({ id: editId, ...data })
        toast.success('Área vital actualizada')
      } else {
        await create.mutateAsync(data)
        toast.success('Área vital creada')
      }
      cancelEdit()
    } catch {
      toast.error(editId ? 'Error al actualizar área vital' : 'Error al crear área vital')
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await del.mutateAsync(deleteId)
      toast.success('Área vital eliminada')
    } catch {
      toast.error('Error al eliminar área vital')
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

  const goalsByArea = (goals ?? []).reduce<Record<string, number>>((acc, g) => {
    acc[g.life_area_id] = (acc[g.life_area_id] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <PageHeader title="Áreas Vitales" description="Define las áreas principales de tu vida" />

      <form
        onSubmit={(e) => {
          void handleSubmit(onSubmit)(e)
        }}
        className="flex items-end gap-3 rounded-lg border bg-card p-4"
      >
        <FormField
          label={editId ? 'Editar área' : 'Nueva área'}
          error={errors.name?.message}
          className="flex-1"
        >
          <Input
            placeholder="Ej: Salud, Finanzas, Carrera..."
            {...register('name')}
            hasError={!!errors.name}
          />
        </FormField>
        <FormField label="Color">
          <input
            type="color"
            {...register('color')}
            className="block h-9 w-14 rounded-md border border-input bg-background p-1"
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

      {areas?.length === 0 ? (
        <EmptyState
          icon="🌿"
          title="No hay áreas vitales"
          description="Crea la primera arriba para organizar tus objetivos."
        />
      ) : (
        <div className="space-y-2">
          {areas?.map((area, idx) => (
            <div
              key={area.id}
              className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
              style={{
                animation: 'fadeSlideIn 0.3s ease-out both',
                animationDelay: `${String(idx * 50)}ms`,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-1 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: area.color ?? '#6366f1' }}
                />
                <div>
                  <span className="font-medium">{area.name}</span>
                  <div className="flex gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {goalsByArea[area.id] ?? 0} objetivos
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    startEdit(area)
                  }}
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setDeleteId(area.id)
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
        title="Eliminar área vital"
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
