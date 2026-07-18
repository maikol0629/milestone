'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { FormField, Input, Select } from '@/components/ui/form-field'

const eventFormSchema = z
  .object({
    title: z.string().min(1, 'El título es requerido').max(200),
    date: z.string().min(1, 'La fecha es requerida'),
    start_time: z.string().min(1, 'La hora es requerida'),
    duration: z.coerce.number().int().positive('La duración debe ser positiva'),
    area_id: z.string().nullable().optional(),
    project_id: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    recurrence_rule: z.enum(['', 'daily', 'weekly']),
    recurrence_interval: z.coerce.number().int().positive().nullable().optional(),
    recurrence_end_date: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      if (!data.recurrence_rule) return true
      return !!data.recurrence_interval
    },
    {
      message: 'El intervalo es requerido para eventos recurrentes',
      path: ['recurrence_interval'],
    },
  )
  .refine(
    (data) => {
      const [hour] = data.start_time.split(':')
      if (!hour) return false
      const startHour = parseInt(hour, 10)
      return startHour >= 6 && startHour < 23
    },
    {
      message: 'La hora de inicio debe ser entre las 06:00 AM y las 11:00 PM',
      path: ['start_time'],
    },
  )
  .refine(
    (data) => {
      const [hour, minute] = data.start_time.split(':')
      if (!hour || !minute) return false
      const startHour = parseInt(hour, 10)
      const startMin = parseInt(minute, 10)
      const endTotalMinutes = startHour * 60 + startMin + data.duration
      return endTotalMinutes <= 23 * 60
    },
    {
      message: 'El evento no puede terminar después de las 11:00 PM',
      path: ['duration'],
    },
  )

type EventFormValues = z.infer<typeof eventFormSchema>

const DAY_OPTIONS = [
  { value: '0', label: 'Dom' },
  { value: '1', label: 'Lun' },
  { value: '2', label: 'Mar' },
  { value: '3', label: 'Mié' },
  { value: '4', label: 'Jue' },
  { value: '5', label: 'Vie' },
  { value: '6', label: 'Sáb' },
]

interface EventFormProps {
  areas: { value: string; label: string }[]
  projects: { value: string; label: string }[]
  onSubmit: (data: {
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
  }) => void
  onCancel?: () => void
  initialData?: Partial<EventFormValues>
}

export function EventForm({ areas, projects, onSubmit, onCancel, initialData }: EventFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema) as never,
    defaultValues: {
      title: '',
      date: new Date().toISOString().slice(0, 10),
      start_time: '09:00',
      duration: 60,
      area_id: null,
      project_id: null,
      description: null,
      location: null,
      recurrence_rule: '',
      recurrence_interval: 1,
      recurrence_end_date: null,
      ...initialData,
    },
  })

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
    (data: EventFormValues) => {
      const startAt = new Date(`${data.date}T${data.start_time}:00`)
      const endAt = new Date(startAt.getTime() + data.duration * 60000)
      onSubmit({
        title: data.title,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        description: data.description ?? null,
        area_id: data.area_id ?? null,
        location: data.location ?? null,
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
    [onSubmit, selectedDays],
  )

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(handleFormSubmit)(e)
      }}
      className="space-y-4"
    >
      <FormField label="Título" error={errors.title?.message}>
        <Input
          placeholder="Ej: Sprint Review..."
          {...register('title')}
          hasError={!!errors.title}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Fecha" error={errors.date?.message}>
          <Input type="date" {...register('date')} hasError={!!errors.date} />
        </FormField>
        <FormField label="Hora inicio" error={errors.start_time?.message}>
          <Input type="time" {...register('start_time')} hasError={!!errors.start_time} />
        </FormField>
      </div>

      <FormField label="Duración (minutos)" error={errors.duration?.message}>
        <Input
          type="number"
          min={15}
          step={15}
          {...register('duration')}
          hasError={!!errors.duration}
        />
      </FormField>

      <FormField label="Área de vida">
        <Select options={areas} placeholder="Seleccionar..." {...register('area_id')} />
      </FormField>

      <FormField label="Proyecto (opcional)">
        <Select options={projects} placeholder="Seleccionar..." {...register('project_id')} />
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

      <FormField label="Descripción">
        <Input placeholder="Descripción opcional..." {...register('description')} />
      </FormField>

      <FormField label="Ubicación">
        <Input placeholder="Ej: Sala 3, Online..." {...register('location')} />
      </FormField>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit">Crear Evento</Button>
      </div>
    </form>
  )
}
