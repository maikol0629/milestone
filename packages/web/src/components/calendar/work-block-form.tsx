'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { FormField, Input, Select } from '@/components/ui/form-field'

const workBlockSchema = z.object({
  project_id: z.string().min(1, 'El proyecto es requerido'),
  activity_id: z.string().min(1, 'La actividad es requerida'),
  duration_minutes: z.coerce.number().int().positive('La duración debe ser positiva'),
  priority: z.enum(['low', 'medium', 'high']),
  objective: z.string().nullable().optional(),
})

type WorkBlockValues = z.infer<typeof workBlockSchema>

interface WorkBlockFormProps {
  projects: { value: string; label: string }[]
  activities: { value: string; label: string }[]
  suggestedSlot?: { start: Date; end: Date } | null
  onSubmit: (data: {
    title: string
    type: 'work_block'
    activity_id: string
    duration_minutes: number
    priority: string
    start_at?: string | null
    end_at?: string | null
  }) => void
  onCancel?: () => void
}

export function WorkBlockForm({
  projects,
  activities,
  suggestedSlot,
  onSubmit,
  onCancel,
}: WorkBlockFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<WorkBlockValues>({
    resolver: zodResolver(workBlockSchema) as never,
    defaultValues: {
      project_id: '',
      activity_id: '',
      duration_minutes: 120,
      priority: 'medium',
      objective: null,
    },
  })

  const selectedProjectId = watch('project_id')

  function handleFormSubmit(data: WorkBlockValues) {
    const selectedActivity = activities.find((a) => a.value === data.activity_id)
    onSubmit({
      title: selectedActivity?.label ?? 'Bloque de trabajo',
      type: 'work_block',
      activity_id: data.activity_id,
      duration_minutes: data.duration_minutes,
      priority: data.priority,
      start_at: suggestedSlot?.start.toISOString() ?? null,
      end_at: suggestedSlot?.end.toISOString() ?? null,
    })
  }

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(handleFormSubmit)(e)
      }}
      className="space-y-4"
    >
      <FormField label="Proyecto" error={errors.project_id?.message}>
        <Select
          options={projects}
          placeholder="Seleccionar proyecto..."
          {...register('project_id')}
          hasError={!!errors.project_id}
        />
      </FormField>

      <FormField label="Actividad" error={errors.activity_id?.message}>
        <Select
          options={
            selectedProjectId
              ? activities.filter((a) => a.value.startsWith(selectedProjectId))
              : activities
          }
          placeholder="Seleccionar actividad..."
          {...register('activity_id')}
          hasError={!!errors.activity_id}
        />
      </FormField>

      <FormField label="Duración" error={errors.duration_minutes?.message}>
        <Input
          type="number"
          min={15}
          step={15}
          {...register('duration_minutes')}
          hasError={!!errors.duration_minutes}
        />
      </FormField>

      <FormField label="Prioridad" id="priority">
        <select
          id="priority"
          {...register('priority')}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="low">Baja</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
        </select>
      </FormField>

      {suggestedSlot && (
        <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
          <span className="font-medium">💡 Sugerencia:</span>{' '}
          {suggestedSlot.start.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })} —{' '}
          {suggestedSlot.end.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit">Crear Bloque</Button>
      </div>
    </form>
  )
}
