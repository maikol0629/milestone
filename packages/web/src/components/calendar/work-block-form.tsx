'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { FormField, Input, Select } from '@/components/ui/form-field'

const workBlockSchema = z
  .object({
    project_id: z.string().min(1, 'El proyecto es requerido'),
    activity_id: z.string().nullable().optional(),
    duration_minutes: z.coerce.number().int().positive('La duración debe ser positiva'),
    priority: z.enum(['low', 'medium', 'high']),
    objective: z.string().nullable().optional(),
    recurrence_rule: z.enum(['', 'daily', 'weekly']),
    recurrence_interval: z.coerce.number().int().positive().nullable().optional(),
    recurrence_days_of_week: z.string().nullable().optional(),
    recurrence_end_date: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      if (!data.recurrence_rule) return true
      return !!data.recurrence_interval
    },
    {
      message: 'El intervalo es requerido para bloques recurrentes',
      path: ['recurrence_interval'],
    },
  )

type WorkBlockValues = z.infer<typeof workBlockSchema>

const DAY_OPTIONS = [
  { value: '0', label: 'Dom' },
  { value: '1', label: 'Lun' },
  { value: '2', label: 'Mar' },
  { value: '3', label: 'Mié' },
  { value: '4', label: 'Jue' },
  { value: '5', label: 'Vie' },
  { value: '6', label: 'Sáb' },
]

interface WorkBlockFormProps {
  projects: { value: string; label: string }[]
  activities: { value: string; label: string }[]
  suggestedSlot?: { start: Date; end: Date } | null
  onSubmit: (data: {
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
      activity_id: null,
      duration_minutes: 120,
      priority: 'medium',
      objective: null,
      recurrence_rule: '',
      recurrence_interval: 1,
      recurrence_days_of_week: null,
      recurrence_end_date: null,
    },
  })

  const selectedProjectId = watch('project_id')
  const recurrenceRule = watch('recurrence_rule')
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set())

  function handleDayToggle(day: string, checked: boolean) {
    setSelectedDays((prev) => {
      const next = new Set(prev)
      if (checked) next.add(day)
      else next.delete(day)
      return next
    })
  }

  const handleFormSubmit = useCallback(
    (data: WorkBlockValues) => {
      const selectedActivity = data.activity_id
        ? activities.find((a) => a.value === data.activity_id)
        : null
      onSubmit({
        title: selectedActivity?.label ?? 'Bloque de trabajo',
        type: 'work_block',
        activity_id: data.activity_id ?? null,
        duration_minutes: data.duration_minutes,
        priority: data.priority,
        start_at: suggestedSlot?.start.toISOString() ?? null,
        end_at: suggestedSlot?.end.toISOString() ?? null,
        recurrence_rule: data.recurrence_rule || null,
        recurrence_interval: data.recurrence_rule ? (data.recurrence_interval ?? 1) : null,
        recurrence_days_of_week:
          data.recurrence_rule === 'weekly'
            ? Array.from(selectedDays).sort().join(',') || null
            : null,
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- "" must convert to null, ?? would not
        recurrence_end_date: data.recurrence_end_date || null,
      })
    },
    [onSubmit, activities, suggestedSlot, selectedDays],
  )

  const filteredActivities = selectedProjectId
    ? activities.filter((a) => a.value.startsWith(selectedProjectId))
    : activities

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

      <FormField label="Actividad (opcional)">
        <Select
          options={[{ value: '', label: 'Sin actividad' }, ...filteredActivities]}
          placeholder="Seleccionar actividad..."
          {...register('activity_id')}
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

      <FormField label="Repetir">
        <select
          {...register('recurrence_rule')}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">No repetir</option>
          <option value="daily">Diariamente</option>
          <option value="weekly">Semanalmente</option>
        </select>
      </FormField>

      {recurrenceRule === 'daily' && (
        <FormField label="Cada cuántos días" error={errors.recurrence_interval?.message}>
          <Input
            type="number"
            min={1}
            {...register('recurrence_interval')}
            hasError={!!errors.recurrence_interval}
          />
        </FormField>
      )}

      {recurrenceRule === 'weekly' && (
        <>
          <FormField label="Cada cuántas semanas">
            <Input type="number" min={1} {...register('recurrence_interval')} />
          </FormField>

          <FormField label="Días de la semana">
            <div className="flex flex-wrap gap-2">
              {DAY_OPTIONS.map((day) => (
                <label key={day.value} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedDays.has(day.value)}
                    onChange={(e) => {
                      handleDayToggle(day.value, e.target.checked)
                    }}
                    className="rounded"
                  />
                  {day.label}
                </label>
              ))}
            </div>
          </FormField>
        </>
      )}

      {recurrenceRule && (
        <FormField label="Fecha de fin (opcional)">
          <Input type="date" {...register('recurrence_end_date')} />
        </FormField>
      )}

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
